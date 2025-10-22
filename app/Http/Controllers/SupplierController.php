<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Exports\SupplierReportExport;
use Maatwebsite\Excel\Facades\Excel;


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


    public function print(string $id, Request $request)
    {
        $supplier = Supplier::where('user_id', Auth::id())
            ->with(['purchases.items', 'transactions.purchase', 'user'])
            ->withSum('purchases', 'total')
            ->withSum('transactions', 'amount')
            ->findOrFail($id);

        $admin = User::findOrFail(auth()->id());

        // Get and normalize date range from request
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        if ($startDate && $endDate) {
            $startDate = \Carbon\Carbon::parse($startDate)->startOfDay();
            $endDate = \Carbon\Carbon::parse($endDate)->endOfDay();
        }

        // Default collections
        $filteredPurchases = $supplier->purchases;
        $filteredTransactions = $supplier->transactions;

        // Filter by date range (if provided)
        if ($startDate && $endDate) {
            $filteredPurchases = $supplier->purchases->filter(function ($purchase) use ($startDate, $endDate) {
                $purchaseDate = \Carbon\Carbon::parse($purchase->purchase_date);
                return $purchaseDate->betweenIncluded($startDate, $endDate);
            });

            $filteredTransactions = $supplier->transactions->filter(function ($transaction) use ($startDate, $endDate) {
                $transactionDate = \Carbon\Carbon::parse($transaction->date);
                return $transactionDate->betweenIncluded($startDate, $endDate);
            });
        }

        // Calculate financial summary
        $totalPurchases = $filteredPurchases->sum('total');
        $totalPayments = $filteredTransactions->sum('amount');
        $currentBalance = $totalPurchases - $totalPayments;

        // Additional totals
        $totalSubtotal = $filteredPurchases->sum('subtotal');
        $totalDiscount = $filteredPurchases->sum('discount_value');
        $totalShipping = $filteredPurchases->sum('shipping_value');

        // Build combined transactions list
        $transactions = collect();

        // Add purchases
        foreach ($filteredPurchases as $purchase) {
            $purchaseDate = \Carbon\Carbon::parse($purchase->purchase_date);
            $transactions->push([
                'date' => $purchaseDate,
                'type' => 'purchase',
                'invoice_number' => $purchase->supplier_invoice_number,
                'invoice_id' => "#" . $purchase->id,
                'subtotal' => $purchase->subtotal,
                'discount' => $purchase->discount_value,
                'shipping' => $purchase->shipping_value,
                'total' => $purchase->total,
                'currency' => $purchase->currency,
                'note' => $purchase->note,
                'amount' => $purchase->total,
                'sort_date' => $purchaseDate->format('Y-m-d H:i:s'),
                'sort_priority' => 1,
            ]);
        }

        // Add transactions (payments)
        foreach ($filteredTransactions as $transaction) {
            if ($transaction->amount != 0) {
                $transactionDate = \Carbon\Carbon::parse($transaction->date);
                $transactions->push([
                    'date' => $transactionDate,
                    'type' => 'payment',
                    'invoice_number' => $transaction->purchase?->supplier_invoice_number,
                    'invoice_id' => "#" . $transaction->purchase?->id,
                    'amount' => $transaction->amount,
                    'note' => $transaction->note,
                    'total' => $transaction->amount,
                    'sort_date' => $transactionDate->format('Y-m-d H:i:s'),
                    'sort_priority' => 2,
                ]);
            }
        }

        // Sort combined transactions
        $transactions = $transactions->sortBy([
            ['sort_date', 'asc'],
            ['sort_priority', 'asc'],
        ]);

        // Generate PDF view
        $html = view('pdf.supplier', compact(
            'supplier',
            'admin',
            'totalPurchases',
            'totalPayments',
            'currentBalance',
            'totalSubtotal',
            'totalDiscount',
            'totalShipping',
            'transactions',
            'startDate',
            'endDate'
        ))->render();

        $pdf = Pdf::loadHTML($html)
            ->setPaper('A4', 'landscape')
            ->setOption('defaultFont', 'Times New Roman')
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('isRemoteEnabled', true);

        $dateSuffix = ($startDate && $endDate)
            ? '_' . $startDate->format('Y-m-d') . '_to_' . $endDate->format('Y-m-d')
            : '';

        return $pdf->stream("rapport-fournisseur-{$supplier->name}{$dateSuffix}.pdf");
    }



    public function export(string $id)
    {
        $supplier = Supplier::where('user_id', Auth::id())
            ->with(['purchases', 'transactions.purchase'])
            ->withSum('purchases', 'total')
            ->withSum('transactions', 'amount')
            ->findOrFail($id);

        $fileName = "rapport-fournisseur-{$supplier->name}-" . now()->format('Y-m-d') . '.xlsx';

        return Excel::download(new SupplierReportExport($supplier), $fileName);
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
