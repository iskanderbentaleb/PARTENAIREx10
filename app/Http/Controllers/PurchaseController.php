<?php

namespace App\Http\Controllers;

use App\Models\Investor;
use App\Models\InvestorTransaction;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Sale;
use App\Models\Supplier;
use App\Models\SupplierTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class PurchaseController extends Controller
{
    /**
     * Display a list of the user's suppliers.
     */
    public function index(Request $request)
    {
        $query = Purchase::with(['supplier', 'investor', 'items'])
            ->where('user_id', Auth::id());

        // Search functionality
        if ($request->filled('search')) {
            $searchTerm = '%' . $request->search . '%';

            $query->where(function ($q) use ($searchTerm) {
                // Search inside purchase fields
                $q->where('id', 'like', $searchTerm)
                    ->orWhere('supplier_invoice_number', 'like', $searchTerm)
                    ->orWhere('purchase_date', 'like', $searchTerm)
                    ->orWhere('subtotal', 'like', $searchTerm)
                    ->orWhere('discount_reason', 'like', $searchTerm)
                    ->orWhere('discount_value', 'like', $searchTerm)
                    ->orWhere('shipping_note', 'like', $searchTerm)
                    ->orWhere('shipping_value', 'like', $searchTerm)
                    ->orWhere('total', 'like', $searchTerm)
                    ->orWhere('currency', 'like', $searchTerm)
                    ->orWhere('note', 'like', $searchTerm);
            });

            // Search inside related supplier
            $query->orWhereHas('supplier', function ($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                ->orWhere('email', 'like', $searchTerm)
                ->orWhere('phone', 'like', $searchTerm)
                ->orWhere('address', 'like', $searchTerm)
                ->orWhere('notes', 'like', $searchTerm);
            });

            // Search inside related investor
            $query->orWhereHas('investor', function ($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                ->orWhere('email', 'like', $searchTerm)
                ->orWhere('phone', 'like', $searchTerm)
                ->orWhere('address', 'like', $searchTerm)
                ->orWhere('notes', 'like', $searchTerm);
            });

            // Search inside related purchase_items
            $query->orWhereHas('items', function ($q) use ($searchTerm) {
                $q->where('product_name', 'like', $searchTerm)
                ->orWhere('barcode_prinsipal', 'like', $searchTerm)
                ->orWhere('barcode_generated', 'like', $searchTerm);
            });
        }

        // Date Range Filter
        if ($request->filled('startDate')) {
            $query->where('purchase_date', '>=', $request->startDate);
        }

        if ($request->filled('endDate')) {
            $query->where('purchase_date', '<=', $request->endDate);
        }

        // Supplier Filter
        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        // Investor Filter
        if ($request->filled('investor_id')) {
            $query->where('investor_id', $request->investor_id);
        }

        // Total Amount Range Filter
        if ($request->filled('total_min')) {
            $query->where('total', '>=', $request->total_min);
        }

        if ($request->filled('total_max')) {
            $query->where('total', '<=', $request->total_max);
        }

        // Currency Filter
        // if ($request->filled('currency')) {
        //     $query->where('currency', $request->currency);
        // }

        // ✅ Get summary data BEFORE pagination
        $summary = $query->clone()->selectRaw('
            COUNT(*) as total_purchases,
            SUM(subtotal) as total_subtotal,
            SUM(discount_value) as total_discount,
            SUM(shipping_value) as total_shipping,
            SUM(total) as grand_total
        ')->first();

        // Order by latest purchase date
        $purchases = $query->latest()->paginate(50);

        // ✅ Apply sold_percentage filter AFTER getting the results (client-side filtering)
        if ($request->filled('sold_percentage_min') || $request->filled('sold_percentage_max')) {
            $minPercentage = $request->filled('sold_percentage_min') ? (float)$request->sold_percentage_min : 0;
            $maxPercentage = $request->filled('sold_percentage_max') ? (float)$request->sold_percentage_max : 100;

            $purchases->getCollection()->transform(function ($purchase) use ($minPercentage, $maxPercentage) {
                // Calculate sold percentage for each purchase
                $totalQty = $purchase->items->sum('quantity');
                $totalSold = $purchase->items->sum('quantity_selled');
                $soldPercentage = $totalQty > 0 ? round(($totalSold / $totalQty) * 100, 2) : 0;

                // Add the calculated sold_percentage to the purchase object
                $purchase->sold_percentage_calculated = $soldPercentage;

                return $purchase;
            });

            // Filter the collection based on sold percentage
            $filteredCollection = $purchases->getCollection()->filter(function ($purchase) use ($minPercentage, $maxPercentage) {
                return $purchase->sold_percentage_calculated >= $minPercentage &&
                    $purchase->sold_percentage_calculated <= $maxPercentage;
            });

            // Create a new paginator with the filtered collection
            $purchases = new \Illuminate\Pagination\LengthAwarePaginator(
                $filteredCollection,
                $filteredCollection->count(),
                $purchases->perPage(),
                $purchases->currentPage(),
                ['path' => $purchases->path()]
            );

            // ✅ Recalculate summary for filtered sold percentage results
            $filteredIds = $filteredCollection->pluck('id');
            $summary = Purchase::whereIn('id', $filteredIds)
                ->selectRaw('
                    COUNT(*) as total_purchases,
                    SUM(subtotal) as total_subtotal,
                    SUM(discount_value) as total_discount,
                    SUM(shipping_value) as total_shipping,
                    SUM(total) as grand_total
                ')->first();
        }

        // Get filter options for frontend dropdowns
        $suppliers = Supplier::where('user_id', Auth::id())->get(['id', 'name']);
        $investors = Investor::where('user_id', Auth::id())->get(['id', 'name']);

        // Get unique currencies for filter
        $currencies = Purchase::where('user_id', Auth::id())
            ->distinct()
            ->pluck('currency')
            ->filter()
            ->values();

        return Inertia::render('purchases/index', [
            'purchases'       => $purchases,
            'paginationLinks' => $purchases->linkCollection(),
            'search'          => $request->search,
            'summary'         => [ // ✅ Add summary data
                'total_purchases' => $summary->total_purchases ?? 0,
                'total_subtotal' => $summary->total_subtotal ?? 0,
                'total_discount' => $summary->total_discount ?? 0,
                'total_shipping' => $summary->total_shipping ?? 0,
                'grand_total' => $summary->grand_total ?? 0,
            ],
            'filters'         => [ // Pass current filter values back to frontend
                'startDate' => $request->startDate,
                'endDate' => $request->endDate,
                'supplier_id' => $request->supplier_id,
                'investor_id' => $request->investor_id,
                'sold_percentage_min' => $request->sold_percentage_min,
                'sold_percentage_max' => $request->sold_percentage_max,
                'total_min' => $request->total_min,
                'total_max' => $request->total_max,
                'currency' => $request->currency,
            ],
            'filterOptions'   => [ // Pass options for filter dropdowns
                'suppliers' => $suppliers,
                'investors' => $investors,
                'currencies' => $currencies,
            ],
        ]);
    }


    /**
     * Show the form to create a new supplier.
    */
    public function create()
    {
        $suppliers = Supplier::where('user_id', auth()->id())
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $investors = Investor::where('user_id', auth()->id())
            ->with(['transactions']) // Only need transactions for available cash
            ->select('id', 'name')
            ->get()
            ->map(function ($investor) {
                // Available cash = Total In - Total Out (from ALL transactions)
                $allIn = $investor->transactions->where('type', 'In')->sum('amount');
                $allOut = $investor->transactions->where('type', 'Out')->sum('amount');

                $availableCash = $allIn - $allOut;

                $investor->available_cash = $availableCash;
                return $investor;
            });

        return Inertia::render('purchases/create', [
            'suppliers' => $suppliers,
            'investors' => $investors,
        ]);
    }



    /**
     * Display the specified purchase.
     */
    public function show($id)
    {
        $purchase = Purchase::with(['supplier', 'investor', 'items'])
            ->findOrFail($id);

        // For now, we'll set default values since we don't have payments
        $purchase->amount_paid = 0;
        $purchase->status = 'pending';

        // Check if overdue
        // if (now()->gt($purchase->due_date)) {
        //     $purchase->status = 'overdue';
        // }

        return Inertia::render('purchases/view', [
            'purchase' => $purchase,
        ]);
    }



    /**
     * Download the purchase invoice file.
     */
    public function downloadInvoice(Purchase $purchase)
    {
        // Add authorization check
        if (!auth()->check()) {
            abort(403, 'Unauthorized');
        }

        // Optional: Add role-based authorization
        // if (!auth()->user()->can('download', $purchase)) {
        //     abort(403, 'Unauthorized');
        // }

        // Check if the file exists
        if (!$purchase->invoice_image) {
            abort(404, 'Invoice file not found');
        }

        // Get the full path to the file
        $filePath = storage_path('app/' . $purchase->invoice_image);

        // Check if file exists
        if (!file_exists($filePath)) {
            abort(404, 'Invoice file not found');
        }

        // Return the file as a download response
        return response()->download($filePath, 'invoice-' . $purchase->id . '.' . pathinfo($filePath, PATHINFO_EXTENSION));
    }


    /**
     * Store a newly created purchase in storage.
    */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id'               => 'required|exists:suppliers,id',
            'investor_id'               => 'required|exists:investors,id',
            'supplier_invoice_number'   => 'nullable|string|max:255',
            'purchase_date'             => 'required|date',
            'subtotal'                  => 'required|numeric|min:0',
            'discount_value'            => 'required|numeric|min:0',
            'discount_reason'           => 'nullable|string|max:255',
            'shipping_value'            => 'required|numeric|min:0',
            'shipping_note'             => 'nullable|string|max:255',
            'total'                     => 'required|numeric|min:0',
            'amount_paid'               => 'required|numeric|min:0', // Added validation
            'currency'                  => 'nullable|string|size:3',
            'note'                      => 'nullable|string',
            'invoice_image'             => 'nullable|file|mimes:pdf,jpg,jpeg,png,gif,xlsx,xls|max:5120',
            'items'                     => 'required|array|min:1',
            'items.*.product_name'      => 'required|string|max:255',
            'items.*.barcode_prinsipal' => 'nullable|string|max:255',
            'items.*.barcode_generated' => 'nullable|string|max:255',
            'items.*.quantity'          => 'required|integer|min:1',
            'items.*.unit_price'        => 'required|numeric|min:0',
            'items.*.sale_price'        => 'required|numeric|min:0',
            'items.*.subtotal'          => 'required|numeric|min:0',
        ]);

        // Set default currency if not provided
        if (!isset($validated['currency'])) {
            $validated['currency'] = 'DZD';
        }

        // Validate that amount_paid doesn't exceed total
        if ($validated['amount_paid'] > $validated['total']) {
            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Amount paid cannot exceed total amount');
        }

        // Fetch investor
        $investor = Investor::findOrFail($validated['investor_id']);

        DB::transaction(function () use ($validated, $request, $investor) {
            // Handle file upload
            $invoiceImagePath = null;
            if ($request->hasFile('invoice_image')) {
                $invoiceImagePath = $request->file('invoice_image')->store('invoices', 'public');
            }

            // Create purchase
            $purchase = Purchase::create(array_merge(
                $validated,
                [
                    'user_id' => auth()->id(),
                    'invoice_image' => $invoiceImagePath,
                ]
            ));

            // Calculate total quantity of all items
            $totalQuantity = collect($validated['items'])->sum('quantity');

            // Avoid division by zero
            $discountPerUnit = $totalQuantity > 0 ? $validated['discount_value'] / $totalQuantity : 0;

            // Create purchase items
            foreach ($validated['items'] as $item) {
                // Compute the unit_price + discounted for each product
                $unitPriceWithDiscount = $item['unit_price'] - $discountPerUnit;

                // Create the item with the new value
                $createdItem = $purchase->items()->create(array_merge($item, [
                    'unit_price_with_discount' => $unitPriceWithDiscount,
                ]));

                // Generate barcode from ID in Base16 (hexadecimal)
                $barcode = strtoupper(dechex($createdItem->id) . $createdItem->barcode_prinsipal);

                // Update the same record
                $createdItem->update([
                    'barcode_generated' => $barcode,
                ]);
            }


            // Create Supplier Transaction
                SupplierTransaction::create([
                    'supplier_id' => $validated['supplier_id'],
                    'user_id' => auth()->id(),
                    'purchase_id' => $purchase->id,
                    'date' => $validated['purchase_date'],
                    'amount' => $validated['amount_paid'],
                    'note' => 'Payment for Purchase #' . $purchase->id .
                            ($validated['supplier_invoice_number'] ?
                            ' (Invoice: ' . $validated['supplier_invoice_number'] . ')' : ''),
                ]);

            // Create investor transaction record
                InvestorTransaction::create([
                    'date' => $validated['purchase_date'],
                    'type' => 'Out', // money going out from investor caise
                    'amount' => $validated['total'],
                    'note' => 'Payment for Purchase #' . $purchase->id .
                                ($validated['supplier_invoice_number'] ?
                                ' (Invoice: ' . $validated['supplier_invoice_number'] . ')' : ''),
                    'investor_id' => $investor->id,
                    'user_id' => auth()->id(),
                    'purchase_id' => $purchase->id,
                ]);

        });

        return redirect()
            ->route('purchases')
            ->with('success', 'Purchase created successfully.' .
                ($validated['amount_paid'] > 0 ? ' Supplier transaction recorded.' : ''));
    }



    public function edit($id)
    {
        $purchase = Purchase::with(['supplier', 'investor', 'items'])
            ->findOrFail($id);

        $this->authorizePurchase($purchase);

        $suppliers = Supplier::where('user_id', auth()->id())
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $investors = Investor::where('user_id', auth()->id())
            ->with(['transactions'])
            ->select('id', 'name')
            ->get()
            ->map(function ($investor) use ($purchase) {
                // Available cash = Total In - Total Out (from ALL transactions)
                $allIn = $investor->transactions->where('type', 'In')->sum('amount');
                $allOut = $investor->transactions->where('type', 'Out')->sum('amount');
                $availableCash = $allIn - $allOut;

                // ✅ If this investor is linked to the current purchase,
                // add back the total of that purchase to their available cash
                if ($purchase->investor_id === $investor->id) {
                    $availableCash += $purchase->total;
                }

                $investor->available_cash = $availableCash;
                return $investor;
            });

        $supplierTransaction = SupplierTransaction::where('purchase_id', $purchase->id)->first();

        return Inertia::render('purchases/edit', [
            'purchase' => $purchase,
            'suppliers' => $suppliers,
            'investors' => $investors,
            'amount_paid' => $supplierTransaction ? $supplierTransaction->amount : 0,
            // ✅ Optionally send old total to frontend too
            'previous_total' => $purchase->total,
        ]);
    }



    /**
     * Update the specified purchase in storage.
     */
    public function update(Request $request, $id)
    {
        $purchase = Purchase::findOrFail($id);
        $this->authorizePurchase($purchase);

        $validated = $request->validate([
            'supplier_id'               => 'required|exists:suppliers,id',
            'investor_id'               => 'required|exists:investors,id',
            'supplier_invoice_number'   => 'nullable|string|max:255',
            'purchase_date'             => 'required|date',
            'subtotal'                  => 'required|numeric|min:0',
            'discount_value'            => 'required|numeric|min:0',
            'discount_reason'           => 'nullable|string|max:255',
            'shipping_value'            => 'required|numeric|min:0',
            'shipping_note'             => 'nullable|string|max:255',
            'total'                     => 'required|numeric|min:0',
            'amount_paid'               => 'required|numeric|min:0',
            'currency'                  => 'nullable|string|size:3',
            'note'                      => 'nullable|string',
            'invoice_image'             => 'nullable|file|mimes:pdf,jpg,jpeg,png,gif,xlsx,xls|max:5120',
            'items'                     => 'required|array|min:1',
            'items.*.id'                => 'nullable|exists:purchase_items,id',
            'items.*.product_name'      => 'required|string|max:255',
            'items.*.barcode_prinsipal' => 'nullable|string|max:255',
            'items.*.quantity'          => 'required|integer|min:1',
            'items.*.unit_price'        => 'required|numeric|min:0',
            'items.*.sale_price'        => 'required|numeric|min:0',
            'items.*.subtotal'          => 'required|numeric|min:0',
        ]);

        // Validate that amount_paid doesn't exceed total
        if ($validated['amount_paid'] > $validated['total']) {
            return redirect()
                ->back()
                ->withErrors(['amount_paid' => 'Amount paid cannot exceed total amount'])
                ->withInput();
        }

        // Process items from JSON if needed
        if (is_string($validated['items'])) {
            $validated['items'] = json_decode($validated['items'], true);
        }

        // Validate that updated quantities are not less than sold quantities
        foreach ($validated['items'] as $index => $itemData) {
            if (isset($itemData['id']) && !empty($itemData['id'])) {
                $existingItem = PurchaseItem::find($itemData['id']);
                if ($existingItem && $itemData['quantity'] < $existingItem->quantity_selled) {
                    return redirect()
                        ->back()
                        ->withErrors([
                            "items.{$index}.quantity" => 'Cannot set quantity less than sold quantity for product: ' . $existingItem->product_name . ' (Sold: ' . $existingItem->quantity_selled . ')'
                        ])
                        ->withInput();
                }
            }
        }

        DB::transaction(function () use ($validated, $request, $purchase) {
            // Handle file upload - delete old file if new one is uploaded
            if ($request->hasFile('invoice_image')) {
                // Delete old file if exists
                if ($purchase->invoice_image) {
                    Storage::disk('public')->delete($purchase->invoice_image);
                }

                // Store new file
                $invoiceImagePath = $request->file('invoice_image')->store('invoices', 'public');
                $validated['invoice_image'] = $invoiceImagePath;
            } else {
                // Keep the existing file if no new file is uploaded
                $validated['invoice_image'] = $purchase->invoice_image;
            }

            // Update purchase
            $purchase->update($validated);

            // Update the corresponding supplier transaction
            $supplierTransaction = SupplierTransaction::where('purchase_id', $purchase->id)->first();

            if ($supplierTransaction) {
                $supplierTransaction->update([
                    'supplier_id' => $validated['supplier_id'],
                    'date' => $validated['purchase_date'],
                    'amount' => $validated['amount_paid'],
                    'note' => 'Payment for Purchase #' . $purchase->id .
                            ($validated['supplier_invoice_number'] ?
                            ' (Invoice: ' . $validated['supplier_invoice_number'] . ')' : ''),
                ]);
            } else {
                // Create supplier transaction if it doesn't exist (for backward compatibility)
                SupplierTransaction::create([
                    'supplier_id' => $validated['supplier_id'],
                    'user_id' => auth()->id(),
                    'purchase_id' => $purchase->id,
                    'date' => $validated['purchase_date'],
                    'amount' => $validated['amount_paid'],
                    'note' => 'Payment for Purchase #' . $purchase->id .
                            ($validated['supplier_invoice_number'] ?
                            ' (Invoice: ' . $validated['supplier_invoice_number'] . ')' : ''),
                ]);
            }


            // Update the corresponding investor transaction
            $investorTransaction = InvestorTransaction::where('purchase_id', $purchase->id)->first();

            if ($investorTransaction) {
                $investorTransaction->update([
                    'date' => $validated['purchase_date'],
                    'amount' => $validated['total'],
                    'note' => 'Payment for Purchase #' . $purchase->id .
                            ($validated['supplier_invoice_number'] ?
                            ' (Invoice: ' . $validated['supplier_invoice_number'] . ')' : ''),
                    'investor_id' => $validated['investor_id'],
                    'purchase_id' => $purchase->id,
                ]);
            } else {
                // Create investor transaction if it doesn't exist (for backward compatibility)
                InvestorTransaction::create([
                    'date' => $validated['purchase_date'],
                    'type' => 'Out', // money going out from investor caise
                    'amount' => $validated['total'],
                    'note' => 'Payment for Purchase #' . $purchase->id .
                                ($validated['supplier_invoice_number'] ?
                                ' (Invoice: ' . $validated['supplier_invoice_number'] . ')' : ''),
                    'investor_id' => $validated['investor_id'],
                    'user_id' => auth()->id(),
                    'purchase_id' => $purchase->id,
                ]);
            }

            // Handle items - update existing, create new, delete removed
            $existingItemIds = $purchase->items->pluck('id')->toArray();
            $updatedItemIds = [];

            // Calculate total quantity of all items
            $totalQuantity = collect($validated['items'])->sum('quantity');

            // Avoid division by zero
            $discountPerUnit = $totalQuantity > 0 ? $validated['discount_value'] / $totalQuantity : 0;


            foreach ($validated['items'] as $itemData) {
                if (isset($itemData['id']) && !empty($itemData['id']) && in_array($itemData['id'], $existingItemIds)) {
                    // Update existing item
                    $item = PurchaseItem::find($itemData['id']);
                    // Recalculate unit_price_with_discount
                    $itemData['unit_price_with_discount'] = $itemData['unit_price'] - $discountPerUnit;

                    $item->update($itemData);
                    $updatedItemIds[] = $itemData['id'];
                } else {
                    // Create new item
                    $newItem = $purchase->items()->create($itemData);

                    // Generate barcode for new item
                    $barcode = strtoupper(dechex($newItem->id)) . ($newItem->barcode_prinsipal ?? '');

                    $newItem->update([
                        'barcode_generated' => $barcode,
                    ]);
                    // Recalculate unit_price_with_discount
                    $newItem->update([
                        'unit_price_with_discount' => $itemData['unit_price'] - $discountPerUnit,
                    ]);

                    $updatedItemIds[] = $newItem->id;
                }
            }

            // Delete items that were removed
            $itemsToDelete = array_diff($existingItemIds, $updatedItemIds);
            if (!empty($itemsToDelete)) {
                // Check if any items to delete have sold quantity
                $itemsWithSales = PurchaseItem::whereIn('id', $itemsToDelete)
                    ->where('quantity_selled', '>', 0)
                    ->exists();

                if ($itemsWithSales) {
                    throw new \Exception('Cannot delete items that have been sold');
                }

                PurchaseItem::whereIn('id', $itemsToDelete)->delete();
            }
        });

        return redirect()
            ->route('purchases')
            ->with('success', 'Purchase updated successfully.');
    }

    /**
     * Delete the specified purchase
    */
    public function destroy(string $id)
    {
        $purchase = Purchase::findOrFail($id);
        $this->authorizePurchase($purchase);

        // Delete the invoice file if it exists
        if ($purchase->invoice_image) {
            // Use the 'public' disk since files are in public/storage
            Storage::disk('public')->delete($purchase->invoice_image);
        }

        $purchase->delete();

        return redirect()->route('purchases')
            ->with('success', 'Purchase and associated files deleted successfully.');
    }

    /**
     * Prevent users from accessing other users' suppliers.
    */
    private function authorizePurchase(Purchase $purchase)
    {
        abort_unless($purchase->user_id === Auth::id(), 403, 'Unauthorized access');
    }

}
