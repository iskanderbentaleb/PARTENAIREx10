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
        $query = Supplier::where('user_id', Auth::id());

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

        // Keep pagination at 30
        $suppliers = $query->latest("name")->paginate(50);

        return Inertia::render('suppliers/index', [
            'suppliers'       => $suppliers, // pass paginator, not items()
            'paginationLinks' => $suppliers->linkCollection(),
            'search'          => $request->search,
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
}
