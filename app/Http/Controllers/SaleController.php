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
        $investors = Investor::where('user_id', auth()->id())->get();

        // Initially, no purchase items are loaded until investor is selected
        $purchaseItems = collect([]);

        return inertia('sales/create', [
            'investors' => $investors,
            'purchaseItems' => $purchaseItems,
        ]);
    }

    /**
     * Get purchase items for a specific investor
     */
    public function getInvestorPurchaseItems($investorId)
    {
        $investor = Investor::findOrFail($investorId);

        // Get purchase items that belong to the selected investor and have available stock
        $purchaseItems = PurchaseItem::with('purchase')
            ->whereHas('purchase', function ($query) use ($investorId) {
                $query->where('investor_id', $investorId);
            })
            ->select('*')
            ->selectRaw('(quantity - quantity_selled) as available_quantity')
            ->having('available_quantity', '>', 0)
            ->get();

        return response()->json([
            'purchaseItems' => $purchaseItems,
            'investor' => $investor
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'invoice_number' => 'nullable|string|max:255|unique:sales,invoice_number',
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

        // Validate that all purchase items belong to the selected investor
        $purchaseItemIds = collect($request->items)->pluck('purchase_item_id');
        $invalidItems = PurchaseItem::whereIn('id', $purchaseItemIds)
            ->whereHas('purchase', function ($query) use ($request) {
                $query->where('investor_id', '!=', $request->investor_id);
            })
            ->exists();

        if ($invalidItems) {
            return back()->withErrors([
                'items' => 'Some selected items do not belong to the chosen investor.'
            ]);
        }

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
                'currency' => 'DZD',
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
        // Ensure the sale belongs to the current user
        if ($sale->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        // Load the sale with all necessary relationships
        $sale->load([
            'investor',
            'items.purchaseItem'
        ]);

        // Calculate additional statistics
        $sale->total_items = $sale->items->sum('quantity');

        // REMOVED: Profit calculation completely

        return inertia('sales/view', [
            'sale' => $sale,
        ]);
    }


    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Sale $sale)
    {
        // Ensure the sale belongs to the current user
        if ($sale->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        // Get all investors
        $investors = Investor::where('user_id', auth()->id())->get();

        // Load the sale with relationships
        $sale->load(['investor', 'items.purchaseItem.purchase']); // Add 'purchase' here

        // Get purchase items for the sale's investor - CORRECTED:
        $purchaseItems = PurchaseItem::with('purchase') // Eager load purchase
            ->whereHas('purchase', function ($query) use ($sale) {
                $query->where('investor_id', $sale->investor_id);
            })
            ->select('*')
            ->selectRaw('(quantity - quantity_selled) as available_quantity')
            ->get();

        // Transform sale items for the form - ADD NULL CHECKS:
        $saleItems = $sale->items->map(function ($item) {
            return [
                'purchase_item_id' => $item->purchase_item_id,
                'quantity' => $item->quantity,
                'unit_price' => $item->purchaseItem->unit_price ,
                'sale_price' => $item->sale_price,
                'subtotal' => $item->subtotal,
                'product_name' => $item->purchaseItem->product_name ?? '',
                'barcode_generated' => $item->purchaseItem->barcode_generated ?? '',
                'available_quantity' => (($item->purchaseItem->quantity ?? 0) - ($item->purchaseItem->quantity_selled ?? 0)) + $item->quantity,
            ];
        });

        return inertia('sales/edit', [
            'sale' => $sale,
            'investors' => $investors,
            'purchaseItems' => $purchaseItems,
            'initialSaleItems' => $saleItems,
        ]);
    }

    /**
     * Update the specified resource in storage.
    */
    public function update(Request $request, Sale $sale)
    {
        // Ensure the sale belongs to the current user
        if ($sale->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'invoice_number' => 'nullable|string|max:255|unique:sales,invoice_number,' . $sale->id,
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

        // Validate that all purchase items belong to the selected investor
        $purchaseItemIds = collect($request->items)->pluck('purchase_item_id');
        $invalidItems = PurchaseItem::whereIn('id', $purchaseItemIds)
            ->whereHas('purchase', function ($query) use ($request) {
                $query->where('investor_id', '!=', $request->investor_id);
            })
            ->exists();

        if ($invalidItems) {
            return back()->withErrors([
                'items' => 'Some selected items do not belong to the chosen investor.'
            ]);
        }

        // Start database transaction
        return DB::transaction(function () use ($request, $sale) {
            // First, restore the stock from the original sale items
            foreach ($sale->items as $saleItem) {
                $purchaseItem = PurchaseItem::findOrFail($saleItem->purchase_item_id);
                $purchaseItem->decrement('quantity_selled', $saleItem->quantity);

                // Safety: ensure it doesn't go negative
                if ($purchaseItem->quantity_selled < 0) {
                    $purchaseItem->update(['quantity_selled' => 0]);
                }
            }

            // Delete existing sale items
            $sale->items()->delete();

            // Update the sale
            $sale->update([
                'invoice_number' => $request->invoice_number,
                'sale_date' => $request->sale_date,
                'investor_id' => $request->investor_id,
                'subtotal' => $request->subtotal,
                'discount_reason' => $request->discount_reason,
                'discount_value' => $request->discount_value ?? 0,
                'total' => $request->total,
                'note' => $request->note,
            ]);

            // Process new sale items
            foreach ($request->items as $itemData) {
                $purchaseItem = PurchaseItem::findOrFail($itemData['purchase_item_id']);

                // Validate available quantity (considering we've already restored the stock)
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
                ->with('success', 'Sale updated successfully!');
        });
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        return DB::transaction(function () use ($id) {
            // Find the sale with its items
            $sale = Sale::with('items')->findOrFail($id);

            // Loop through each sale item and restock
            foreach ($sale->items as $saleItem) {
                $purchaseItem = PurchaseItem::findOrFail($saleItem->purchase_item_id);

                // Decrement quantity_selled (restock)
                $purchaseItem->decrement('quantity_selled', $saleItem->quantity);

                // Safety: ensure it doesn't go negative
                if ($purchaseItem->quantity_selled < 0) {
                    $purchaseItem->update(['quantity_selled' => 0]);
                }
            }

            // Delete related sale items first
            $sale->items()->delete();

            // Delete the sale itself
            $sale->delete();

            return redirect()->route('sales')
                ->with('success', 'Sale deleted and stock restored successfully!');
        });
    }

}
