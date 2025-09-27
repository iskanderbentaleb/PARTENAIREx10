<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\SupplierTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;


class SupplierTransactionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = SupplierTransaction::where('user_id', Auth::id())
            ->where('amount', '>', 0 )
            ->with(['supplier', 'purchase']); // eager load relations

        if ($request->filled('search')) {
            $searchTerm = '%' . $request->search . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->whereHas('supplier', function ($supplierQuery) use ($searchTerm) {
                    $supplierQuery->where('name', 'like', $searchTerm)
                        ->orWhere('email', 'like', $searchTerm)
                        ->orWhere('phone', 'like', $searchTerm);
                })
                ->orWhere('note', 'like', $searchTerm)
                ->orWhere('amount', 'like', $searchTerm)
                ->orWhereDate('date', $searchTerm) // exact match like 2025-09-22
                ->orWhere('date', 'like', "%{$searchTerm}%");
            });
        }

        // Paginate results (50 per page)
        $transactions = $query->latest()->paginate(50);

        return Inertia::render('supplier_transactions/index', [
            'transactions'    => $transactions, // full paginator
            'paginationLinks' => $transactions->linkCollection(),
            'search'          => $request->search,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $suppliers = Supplier::where('user_id', auth()->id())
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('supplier_transactions/create', [
            'suppliers' => $suppliers,
        ]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date'        => 'required|date',
            'amount'      => 'required|numeric|min:0',
            'note'        => 'nullable|string|max:500',
            'supplier_id' => 'required|exists:suppliers,id',
        ]);

        $validated['user_id'] = Auth::id();

        SupplierTransaction::create($validated);

        return redirect()
            ->route('supplier_transactions')
            ->with('success', 'Supplier transaction created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(SupplierTransaction $supplierTransaction)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
            $supplierTransaction = SupplierTransaction::findOrFail($id);

            // Check if purchase_id is not null
            if ($supplierTransaction->purchase_id !== null) {
                return redirect()->route('supplier_transactions')
                    ->with('error', 'This transaction is linked to a purchase and cannot be edited.');
            }

            $suppliers = Supplier::where('user_id', auth()->id())
                ->select('id', 'name')
                ->orderBy('name')
                ->get();

            return Inertia::render('supplier_transactions/edit', [
                'supplierTransaction' => $supplierTransaction->load('supplier'),
                'transaction' => [
                    'id' => $supplierTransaction->id,
                    'date' => $supplierTransaction->date,
                    'amount' => $supplierTransaction->amount,
                    'note' => $supplierTransaction->note,
                    'supplier_id' => $supplierTransaction->supplier_id,
                    'purchase_id' => $supplierTransaction->purchase_id, // Include this for frontend validation
                ],
                'suppliers' => $suppliers,
            ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $supplierTransaction = SupplierTransaction::findOrFail($id);

        // Check if purchase_id is not null before allowing update
        if ($supplierTransaction->purchase_id !== null) {
            return redirect()->route('supplier_transactions')
                ->with('error', 'This transaction is linked to a purchase and cannot be updated.');
        }

        $validated = $request->validate([
            'date'        => 'required|date',
            'amount'      => 'required|numeric',
            'note'        => 'nullable|string',
            'supplier_id' => 'required|exists:suppliers,id',
        ]);

        $supplierTransaction->update($validated);

        return redirect()->route('supplier_transactions')
            ->with('success', 'Supplier Transaction updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $supplierTransaction = SupplierTransaction::findOrFail($id);

        // Check if purchase_id is not null before allowing deletion
        if ($supplierTransaction->purchase_id !== null) {
            return redirect()->route('supplier_transactions')
                ->with('error', 'This transaction is linked to a purchase and cannot be deleted.');
        }

        $supplierTransaction->delete();

        return redirect()->route('supplier_transactions')
            ->with('success', 'Supplier Transaction deleted successfully.');
    }
}
