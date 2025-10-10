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
            ->where('amount', '>', 0)
            ->with(['supplier', 'purchase']);

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
                ->orWhereDate('date', $searchTerm)
                ->orWhere('date', 'like', "%{$searchTerm}%");
            });
        }

        // ✅ Date Range Filter
        if ($request->filled('startDate')) {
            $query->where('date', '>=', $request->startDate);
        }

        if ($request->filled('endDate')) {
            $query->where('date', '<=', $request->endDate);
        }

        // ✅ Supplier Filter
        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        // ✅ Amount Range Filter
        if ($request->filled('amount_min')) {
            $query->where('amount', '>=', $request->amount_min);
        }

        if ($request->filled('amount_max')) {
            $query->where('amount', '<=', $request->amount_max);
        }

        // ✅ Get summary data BEFORE pagination
        $summary = $query->clone()->selectRaw('
            COUNT(*) as total_transactions,
            SUM(amount) as total_amount,
            AVG(amount) as average_amount,
            MAX(amount) as max_amount,
            MIN(amount) as min_amount
        ')->first();

        // Paginate results (50 per page)
        $transactions = $query->latest()->paginate(50);

        // Get filter options for frontend dropdowns
        $suppliers = Supplier::where('user_id', Auth::id())->get(['id', 'name']);

        return Inertia::render('supplier_transactions/index', [
            'transactions'    => $transactions,
            'paginationLinks' => $transactions->linkCollection(),
            'search'          => $request->search,
            'summary'         => [ // ✅ Add summary data
                'total_transactions' => $summary->total_transactions ?? 0,
                'total_amount' => $summary->total_amount ?? 0,
                'average_amount' => $summary->average_amount ?? 0,
                'max_amount' => $summary->max_amount ?? 0,
                'min_amount' => $summary->min_amount ?? 0,
            ],
            'filters'         => [ // ✅ Pass current filter values back to frontend
                'startDate' => $request->startDate,
                'endDate' => $request->endDate,
                'supplier_id' => $request->supplier_id,
                'amount_min' => $request->amount_min,
                'amount_max' => $request->amount_max,
            ],
            'filterOptions'   => [ // ✅ Pass options for filter dropdowns
                'suppliers' => $suppliers,
            ],
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
