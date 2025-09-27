<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

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
