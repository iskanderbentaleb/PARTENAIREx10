<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;


class SupplierController extends Controller
{
    /**
     * Display a list of the user's suppliers.
     */
    public function index(Request $request)
    {
        $query = Supplier::where('user_id', Auth::id())
            ->withSum('purchases', 'total')           // supplier purchase total
            ->withSum('transactions', 'amount');      // supplier payments total

        if ($request->filled('search')) {
            $searchTerm = '%' . $request->search . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                    ->orWhere('email', 'like', $searchTerm)
                    ->orWhere('phone', 'like', $searchTerm)
                    ->orWhere('address', 'like', $searchTerm)
                    ->orWhere('notes', 'like', $searchTerm);
            });
        }

        $suppliers = $query->latest("name")->paginate(50);

        // Append debts to each supplier
        $suppliers->getCollection()->transform(function ($supplier) {
            $supplier->total_debt = ($supplier->purchases_sum_total ?? 0) - ($supplier->transactions_sum_amount ?? 0);
            return $supplier;
        });

        // Dashboard totals (grand totals across all suppliers)
        $totals = [
            'purchases' => $suppliers->getCollection()->sum('purchases_sum_total'),
            'payments'  => $suppliers->getCollection()->sum('transactions_sum_amount'),
            'debts'     => $suppliers->getCollection()->sum('total_debt'),
        ];

        return Inertia::render('suppliers/index', [
            'suppliers'       => $suppliers,
            'paginationLinks' => $suppliers->linkCollection(),
            'search'          => $request->search,
            'totals'          => $totals,
        ]);
    }
    /**
     * Show the form to create a new supplier.
     */
    public function create()
    {
        return Inertia::render('suppliers/create');
    }

    /**
     * Store a new supplier in the database.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => 'nullable|email|unique:suppliers,email',
            'phone'   => 'nullable|string|max:30',
            'address' => 'nullable|string|max:255',
            'notes'   => 'nullable|string',
        ]);

        $validated['user_id'] = Auth::id();

        Supplier::create($validated);

        return redirect()
            ->route('suppliers')
            ->with('success', 'Supplier created successfully.');
    }
    /**
     * Show the form to edit an existing supplier.
     */
    public function edit(string $id)
    {
        $supplier = Supplier::findOrFail($id);
        $this->authorizeSupplier($supplier);

        return Inertia::render('suppliers/edit', [
            'supplier' => $supplier,
        ]);
    }

    /**
     * Update the specified supplier.
     */
    public function update(Request $request, string $id)
    {
        $supplier = Supplier::findOrFail($id);
        $this->authorizeSupplier($supplier);

        $validated = $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => 'nullable|email|unique:suppliers,email,' . $supplier->id,
            'phone'   => 'nullable|string|max:30',
            'address' => 'nullable|string|max:255',
            'notes'   => 'nullable|string',
        ]);

        $supplier->update($validated);

        return redirect()
            ->route('suppliers')
            ->with('success', 'Supplier updated successfully.');
    }

    /**
     * Delete the specified supplier.
     */
    public function destroy(string $id)
    {
        $supplier = Supplier::findOrFail($id);
        $this->authorizeSupplier($supplier); // Pass the model instance
        $supplier->delete();
    }

    /**
     * Prevent users from accessing other users' suppliers.
     */
    private function authorizeSupplier(Supplier $supplier)
    {
        abort_unless($supplier->user_id === Auth::id(), 403, 'Unauthorized access');
    }


    public function print(string $id)
    {
        $supplier = Supplier::where('user_id', Auth::id())
            ->with(['purchases.items', 'transactions.purchase', 'user'])
            ->withSum('purchases', 'total')
            ->withSum('transactions', 'amount')
            ->findOrFail($id);

        $admin = User::findOrFail(auth()->id());

        // Calculate financial summary
        $totalPurchases = $supplier->purchases_sum_total ?? 0;
        $totalPayments = $supplier->transactions_sum_amount ?? 0;
        $currentBalance = $totalPurchases - $totalPayments;

        // Calculate additional totals (livraison is just shown, not added to sum)
        $totalSubtotal = $supplier->purchases->sum('subtotal');
        $totalDiscount = $supplier->purchases->sum('discount_value');
        $totalShipping = $supplier->purchases->sum('shipping_value'); // Just for display

        // Combine purchases and transactions and sort by date
        $transactions = collect();

        // Add purchases as transactions
        foreach ($supplier->purchases as $purchase) {
            $transactions->push([
                'date' => $purchase->purchase_date,
                'type' => 'purchase',
                'invoice_number' => $purchase->supplier_invoice_number,
                'subtotal' => $purchase->subtotal,
                'discount' => $purchase->discount_value,
                'shipping' => $purchase->shipping_value,
                'total' => $purchase->total,
                'currency' => $purchase->currency,
                'note' => $purchase->note,
                'amount' => $purchase->total,
            ]);
        }

        // Add payment transactions (only non-zero amounts)
        foreach ($supplier->transactions as $transaction) {
            if ($transaction->amount != 0) {
                $transactions->push([
                    'date' => $transaction->date,
                    'type' => 'payment',
                    'invoice_number' => $transaction->purchase?->supplier_invoice_number,
                    'amount' => $transaction->amount,
                    'note' => $transaction->note,
                    'total' => $transaction->amount,
                ]);
            }
        }

        // Sort by date
        $transactions = $transactions->sortBy('date');

        $html = view('pdf.supplier', compact(
            'supplier',
            'admin',
            'totalPurchases',
            'totalPayments',
            'currentBalance',
            'totalSubtotal',
            'totalDiscount',
            'totalShipping',
            'transactions'
        ))->render();

        $pdf = Pdf::loadHTML($html)
            ->setPaper('A4', 'landscape')
            ->setOption('defaultFont', 'DejaVu Sans')
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('isRemoteEnabled', true);

        return $pdf->stream("rapport-fournisseur-{$supplier->name}.pdf");
    }



    public function financialData(Supplier $supplier)
    {
        $userId = auth()->id();

        $totalPurchases = $supplier->purchases()
            ->where('user_id', $userId)
            ->sum('total');

        $totalPayments = $supplier->transactions()
            ->where('user_id', $userId)
            ->sum('amount');

        $totalDebts = $totalPurchases - $totalPayments;

        return response()->json([
            'total_purchases' => $totalPurchases,
            'total_payments'  => $totalPayments,
            'total_debts'     => $totalDebts,
        ]);
    }
}
