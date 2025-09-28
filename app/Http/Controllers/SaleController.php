<?php

namespace App\Http\Controllers;

use App\Models\Investor;
use App\Models\PurchaseItem;
use App\Models\Sale;
use App\Models\saleItem;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        // Get all investors
        $investors = Investor::all();

        // Get purchase items that have available stock (quantity - quantity_selled > 0)
        $purchaseItems = PurchaseItem::with('purchase')
            ->select('*')
            ->selectRaw('(quantity - quantity_selled) as available_quantity')
            ->having('available_quantity', '>', 0)
            ->get();

        return inertia('sales/create', [
            'investors' => $investors,
            'purchaseItems' => $purchaseItems,
        ]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'invoice_number' => 'required|string|max:255|unique:sales,invoice_number',
            'sale_date' => 'required|date',
            'investor_id' => 'required|exists:investors,id',
            'subtotal' => 'required|numeric|min:0',
            'discount_value' => 'nullable|numeric|min:0',
            'total' => 'required|numeric|min:0',
            'note' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.purchase_item_id' => 'required|exists:purchase_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.sale_price' => 'required|numeric|min:0',
            'items.*.subtotal' => 'required|numeric|min:0',
        ]);

        // Start database transaction
        return DB::transaction(function () use ($request) {
            // Create the sale
            $sale = Sale::create([
                'invoice_number' => $request->invoice_number,
                'sale_date' => $request->sale_date,
                'investor_id' => $request->investor_id,
                'user_id' => Auth::id(),
                'subtotal' => $request->subtotal,
                'discount_reason' => $request->discount_reason,
                'discount_value' => $request->discount_value ?? 0,
                'total' => $request->total,
                'currency' => 'DZD', // Default currency as per your requirement
                'note' => $request->note,
            ]);

            // Process sale items
            foreach ($request->items as $itemData) {
                $purchaseItem = PurchaseItem::findOrFail($itemData['purchase_item_id']);

                // Validate available quantity
                $availableQuantity = $purchaseItem->quantity - $purchaseItem->quantity_selled;
                if ($itemData['quantity'] > $availableQuantity) {
                    throw new \Exception("Quantity exceeds available stock for product: {$purchaseItem->product_name}. Available: {$availableQuantity}");
                }

                // Create sale item
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'purchase_item_id' => $itemData['purchase_item_id'],
                    'quantity' => $itemData['quantity'],
                    'sale_price' => $itemData['sale_price'],
                    'subtotal' => $itemData['subtotal'],
                ]);

                // Update purchase item's sold quantity
                $purchaseItem->increment('quantity_selled', $itemData['quantity']);
            }

            return redirect()->route('sales')
                ->with('success', 'Sale created successfully!');
        });
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
