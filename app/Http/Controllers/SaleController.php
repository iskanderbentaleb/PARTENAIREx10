<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SaleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Sale::with(['user', 'investor', 'items.purchaseItem'])
            ->where('user_id', Auth::id());

        if ($request->filled('search')) {
            $searchTerm = '%' . $request->search . '%';

            $query->where(function ($q) use ($searchTerm) {
                // Search inside sale fields
                $q->where('id', 'like', $searchTerm)
                    ->orWhere('invoice_number', 'like', $searchTerm)
                    ->orWhere('sale_date', 'like', $searchTerm)
                    ->orWhere('subtotal', 'like', $searchTerm)
                    ->orWhere('discount_reason', 'like', $searchTerm)
                    ->orWhere('discount_value', 'like', $searchTerm)
                    ->orWhere('total', 'like', $searchTerm)
                    ->orWhere('currency', 'like', $searchTerm)
                    ->orWhere('note', 'like', $searchTerm);
            });

            // Search inside related investor
            $query->orWhereHas('investor', function ($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                ->orWhere('email', 'like', $searchTerm)
                ->orWhere('phone', 'like', $searchTerm)
                ->orWhere('address', 'like', $searchTerm)
                ->orWhere('notes', 'like', $searchTerm);
            });

            // Search inside related sale_items → purchase_items
            $query->orWhereHas('items.purchaseItem', function ($q) use ($searchTerm) {
                $q->where('product_name', 'like', $searchTerm)
                ->orWhere('barcode_prinsipal', 'like', $searchTerm)
                ->orWhere('barcode_generated', 'like', $searchTerm);
            });
        }

        // Order by latest sale date
        $sales = $query->latest()->paginate(50);

        return Inertia::render('sales/index', [
            'sales'           => $sales,
            'paginationLinks' => $sales->linkCollection(),
            'search'          => $request->search,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Sale $sale)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Sale $sale)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Sale $sale)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Sale $sale)
    {
        //
    }
}
