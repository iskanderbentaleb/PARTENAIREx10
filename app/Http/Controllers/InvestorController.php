<?php

namespace App\Http\Controllers;

use App\Models\Investor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class InvestorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Investor::where('user_id', Auth::id());

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
        $investors = $query->latest("name")->paginate(50);

        return Inertia::render('investors/index', [
            'investors'       => $investors, // pass paginator, not items()
            'paginationLinks' => $investors->linkCollection(),
            'search'          => $request->search,
        ]);
    }

    /**
     * Show the form to create a new supplier.
     */
    public function create()
    {
        return Inertia::render('investors/create');
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

        Investor::create($validated);

        return redirect()
            ->route('investors')
            ->with('success', 'Investor created successfully.');
    }

    /**
     * Show the form to edit an existing supplier.
     */
    public function edit(string $id)
    {
        $investor = Investor::findOrFail($id);
        $this->authorizeInvestor($investor);

        return Inertia::render('investors/edit', [
            'investor' => $investor,
        ]);
    }

    /**
     * Update the specified supplier.
     */
    public function update(Request $request, string $id)
    {
        $investor = Investor::findOrFail($id);
        $this->authorizeInvestor($investor);

        $validated = $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => 'nullable|email|unique:suppliers,email,' . $investor->id,
            'phone'   => 'nullable|string|max:30',
            'address' => 'nullable|string|max:255',
            'notes'   => 'nullable|string',
        ]);

        $investor->update($validated);

        return redirect()
            ->route('investors')
            ->with('success', 'Investor updated successfully.');
    }

    /**
     * Delete the specified supplier.
     */
    public function destroy(string $id)
    {
        $investor = Investor::findOrFail($id);
        $this->authorizeInvestor($investor); // Pass the model instance
        $investor->delete();
    }

    /**
     * Prevent users from accessing other users' suppliers.
     */
    private function authorizeInvestor(Investor $investor)
    {
        abort_unless($investor->user_id === Auth::id(), 403, 'Unauthorized access');
    }
}
