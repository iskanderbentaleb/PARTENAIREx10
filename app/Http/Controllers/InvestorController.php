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

        $investors = $query
            ->with(['transactions', 'purchases', 'sales'])
            ->latest("name")
            ->paginate(50);

        // Calculate balances for each investor
        $investors->getCollection()->transform(function ($investor) {
            // ALL transactions (both manual and automatic from purchases/sales)
            $allIn = $investor->transactions->where('type', 'In')->sum('amount');
            $allOut = $investor->transactions->where('type', 'Out')->sum('amount');

            // Purchase and sales totals (for profit calculation and tracking)
            $totalPurchases = $investor->purchases->sum('total');
            $totalSales = $investor->sales->sum('total');

            // Calculate profit (sales revenue - purchase cost)
            $profit = $totalSales - $totalPurchases;

            // Available cash = Total In - Total Out (from ALL transactions)
            $availableCash = $allIn - $allOut;

            // Cash in process: Purchases that haven't been sold yet
            $cashInProcess = max($totalPurchases - $totalSales, 0);

            // Total capital = Available cash + Cash in process
            $totalCapital = $availableCash + $cashInProcess;

            // Attach values
            $investor->available_cash = $availableCash;
            $investor->cash_in_process = $cashInProcess;
            $investor->total_capital = $totalCapital;
            $investor->profit = $profit;
            $investor->total_invested = $allIn;
            $investor->total_withdrawn = $allOut;

            return $investor;
        });

        // Calculate totals for ALL investors (not just current page)
        $allInvestors = Investor::where('user_id', Auth::id())
            ->with(['transactions', 'purchases', 'sales'])
            ->get();

        $totals = $allInvestors->reduce(function ($carry, $investor) {
            $allIn = $investor->transactions->where('type', 'In')->sum('amount');
            $allOut = $investor->transactions->where('type', 'Out')->sum('amount');
            $totalPurchases = $investor->purchases->sum('total');
            $totalSales = $investor->sales->sum('total');
            $profit = $totalSales - $totalPurchases;
            $availableCash = $allIn - $allOut;
            $cashInProcess = max($totalPurchases - $totalSales, 0);
            $totalCapital = $availableCash + $cashInProcess;

            $carry['totalCapital'] += $totalCapital;
            $carry['availableCash'] += $availableCash;
            $carry['cashInProcess'] += $cashInProcess;
            $carry['profit'] += $profit;
            $carry['totalInvested'] += $allIn;
            $carry['totalWithdrawn'] += $allOut;

            return $carry;
        }, [
            'totalCapital' => 0,
            'availableCash' => 0,
            'cashInProcess' => 0,
            'profit' => 0,
            'totalInvested' => 0,
            'totalWithdrawn' => 0,
        ]);

        return Inertia::render('investors/index', [
            'investors' => $investors,
            'paginationLinks' => $investors->linkCollection(),
            'search' => $request->search,
            'totals' => $totals,
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
