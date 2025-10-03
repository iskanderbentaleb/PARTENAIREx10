<?php

namespace App\Http\Controllers;

use App\Models\Investor;
use App\Models\InvestorTransaction;
use App\Models\Purchase;
use App\Models\PurchaseItem;
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

        // Order by latest purchase date
        $purchases = $query->latest()->paginate(50);

        return Inertia::render('purchases/index', [
            'purchases'       => $purchases,
            'paginationLinks' => $purchases->linkCollection(),
            'search'          => $request->search,
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
            ->select('id', 'name')
            ->get()
            ->map(function ($investor) {
                $investor->current_balance = (float) Purchase::where('investor_id', $investor->id)->sum('total');
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

            // Create purchase items
            foreach ($validated['items'] as $item) {
                $createdItem = $purchase->items()->create($item);

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
            ->select('id', 'name')
            ->get()
            ->map(function ($investor) {
                $investor->current_balance = (float) Purchase::where('investor_id', $investor->id)->sum('total');
                return $investor;
            });

        // Get the supplier transaction linked to this purchase
        $supplierTransaction = SupplierTransaction::where('purchase_id', $purchase->id)->first();

        return Inertia::render('purchases/edit', [
            'purchase'  => $purchase,
            'suppliers' => $suppliers,
            'investors' => $investors,
            'amount_paid' => $supplierTransaction ? $supplierTransaction->amount : 0, // Add amount_paid to the response
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

            foreach ($validated['items'] as $itemData) {
                if (isset($itemData['id']) && !empty($itemData['id']) && in_array($itemData['id'], $existingItemIds)) {
                    // Update existing item
                    $item = PurchaseItem::find($itemData['id']);
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
