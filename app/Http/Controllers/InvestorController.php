<?php

namespace App\Http\Controllers;

use App\Exports\InvestorReportExport;
use App\Models\Investor;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;

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
            ->with([
                'transactions',
                'purchases' => function($query) {
                    $query->with('items');
                },
                'sales'
            ])
            ->latest("name")
            ->paginate(50);





        // Calculate balances for each investor
        $investors->getCollection()->transform(function ($investor) {
            // ALL transactions (both manual and automatic from purchases/sales)
            $allIn = $investor->transactions->where('type', 'In')->sum('amount');
            $allOut = $investor->transactions->where('type', 'Out')->sum('amount');

            // Purchase and sales totals
            $totalPurchases = $investor->purchases->sum('total');
            $totalSales = $investor->sales->sum('total');

            // CORRECTED: Calculate actual profit (sales revenue - cost of goods sold)
            $costOfGoodsSold = 0;
            foreach ($investor->purchases as $purchase) {
                if ($purchase->relationLoaded('items') && $purchase->items) {
                    foreach ($purchase->items as $item) {
                        // Cost of goods sold = quantity sold × purchase price
                        $costOfGoodsSold += $item->quantity_selled * $item->unit_price_with_discount;
                    }
                }
            }

            $profit = $totalSales - $costOfGoodsSold;

            // Available cash = Total In - Total Out (from ALL transactions)
            $availableCash = $allIn - $allOut;

            // Cash in process = Remaining inventory value at purchase price
            $cashInProcess = 0;
            foreach ($investor->purchases as $purchase) {
                if ($purchase->relationLoaded('items') && $purchase->items) {
                    foreach ($purchase->items as $item) {
                        $remainingQuantity = $item->quantity - $item->quantity_selled;
                        if ($remainingQuantity > 0) {
                            $cashInProcess += $remainingQuantity * $item->unit_price_with_discount;
                        }
                    }
                }
            }

            // Total capital = Available cash + Cash in process
            $totalCapital = $availableCash + $cashInProcess;

            // Attach values
            $investor->available_cash = $availableCash;
            $investor->cash_in_process = $cashInProcess;
            $investor->total_capital = $totalCapital;
            $investor->profit = $profit;
            $investor->total_invested = $allIn;
            $investor->total_withdrawn = $allOut;
            $investor->cost_of_goods_sold = $costOfGoodsSold; // For reference

            return $investor;
        });








        // Calculate totals for ALL investors (not just current page)
        $allInvestors = Investor::where('user_id', Auth::id())
            ->with([
                'transactions',
                'purchases' => function($query) {
                    $query->with('items');
                },
                'sales'
            ])
            ->get();

        $totals = $allInvestors->reduce(function ($carry, $investor) {
            $allIn = $investor->transactions->where('type', 'In')->sum('amount');
            $allOut = $investor->transactions->where('type', 'Out')->sum('amount');
            $totalPurchases = $investor->purchases->sum('total');
            $totalSales = $investor->sales->sum('total');

            // CORRECTED: Calculate cost of goods sold for totals
            $costOfGoodsSold = 0;
            foreach ($investor->purchases as $purchase) {
                if ($purchase->relationLoaded('items') && $purchase->items) {
                    foreach ($purchase->items as $item) {
                        $costOfGoodsSold += $item->quantity_selled * $item->unit_price_with_discount;
                    }
                }
            }

            $profit = $totalSales - $costOfGoodsSold;
            $availableCash = $allIn - $allOut;

            // Cash in process calculation
            $cashInProcess = 0;
            foreach ($investor->purchases as $purchase) {
                if ($purchase->relationLoaded('items') && $purchase->items) {
                    foreach ($purchase->items as $item) {
                        $remainingQuantity = $item->quantity - $item->quantity_selled;
                        if ($remainingQuantity > 0) {
                            $cashInProcess += $remainingQuantity * $item->unit_price_with_discount;
                        }
                    }
                }
            }

            $totalCapital = $availableCash + $cashInProcess;

            $carry['totalCapital'] += $totalCapital;
            $carry['availableCash'] += $availableCash;
            $carry['cashInProcess'] += $cashInProcess;
            $carry['profit'] += $profit;
            $carry['totalInvested'] += $allIn;
            $carry['totalWithdrawn'] += $allOut;
            $carry['costOfGoodsSold'] += $costOfGoodsSold; // For reference

            return $carry;
        }, [
            'totalCapital' => 0,
            'availableCash' => 0,
            'cashInProcess' => 0,
            'profit' => 0,
            'totalInvested' => 0,
            'totalWithdrawn' => 0,
            'costOfGoodsSold' => 0,
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


    public function print(string $id, Request $request)
    {
        $investor = Investor::where('user_id', Auth::id())
            ->with([
                'transactions' => function($query) {
                    $query->orderBy('created_at', 'desc');
                },
                'purchases' => function($query) {
                    $query->with('items');
                },
                'sales',
                'user'
            ])
            ->findOrFail($id);

        $admin = User::findOrFail(auth()->id());

        // Apply the EXACT same transformation as in the index method
        // ALL transactions (both manual and automatic from purchases/sales)
        $allIn = $investor->transactions->where('type', 'In')->sum('amount');
        $allOut = $investor->transactions->where('type', 'Out')->sum('amount');

        // Purchase and sales totals
        $totalPurchases = $investor->purchases->sum('total');
        $totalSales = $investor->sales->sum('total');

        // CORRECTED: Calculate actual profit (sales revenue - cost of goods sold)
        $costOfGoodsSold = 0;
        foreach ($investor->purchases as $purchase) {
            if ($purchase->relationLoaded('items') && $purchase->items) {
                foreach ($purchase->items as $item) {
                    // Cost of goods sold = quantity sold × purchase price
                    $costOfGoodsSold += $item->quantity_selled * $item->unit_price_with_discount;
                }
            }
        }

        $profit = $totalSales - $costOfGoodsSold;

        // Available cash = Total In - Total Out (from ALL transactions)
        $availableCash = $allIn - $allOut;

        // Cash in process = Remaining inventory value at purchase price
        $cashInProcess = 0;
        foreach ($investor->purchases as $purchase) {
            if ($purchase->relationLoaded('items') && $purchase->items) {
                foreach ($purchase->items as $item) {
                    $remainingQuantity = $item->quantity - $item->quantity_selled;
                    if ($remainingQuantity > 0) {
                        $cashInProcess += $remainingQuantity * $item->unit_price_with_discount;
                    }
                }
            }
        }

        // Total capital = Available cash + Cash in process
        $totalCapital = $availableCash + $cashInProcess;

        // Attach values EXACTLY like in index method
        $investor->available_cash = $availableCash;
        $investor->cash_in_process = $cashInProcess;
        $investor->total_capital = $totalCapital;
        $investor->profit = $profit;
        $investor->total_invested = $allIn;
        $investor->total_withdrawn = $allOut;
        $investor->cost_of_goods_sold = $costOfGoodsSold;

        // Get date range from request if provided
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        // Filter transactions by date range if provided and maintain order
        $filteredTransactions = $investor->transactions;
        if ($startDate && $endDate) {
            $filteredTransactions = $investor->transactions->filter(function ($transaction) use ($startDate, $endDate) {
                $transactionDate = \Carbon\Carbon::parse($transaction->date);
                return $transactionDate >= $startDate && $transactionDate <= $endDate;
            });
        }

        // Ensure transactions are sorted by created_at (most recent first)
        $filteredTransactions = $filteredTransactions->sortByDesc('created_at');

        $data = [
            'investor' => $investor,
            'admin' => $admin,
            'financialSummary' => [
                'totalCapital' => $totalCapital,
                'availableCash' => $availableCash,
                'cashInProcess' => $cashInProcess,
                'profit' => $profit,
                // Include these for reference if needed
                'totalInvested' => $allIn,
                'totalWithdrawn' => $allOut,
                'totalPurchases' => $totalPurchases,
                'totalSales' => $totalSales,
                'costOfGoodsSold' => $costOfGoodsSold,
            ],
            'transactions' => $filteredTransactions,
            'startDate' => $startDate,
            'endDate' => $endDate,
        ];

        $html = view('pdf.investor', $data)->render();

        $pdf = Pdf::loadHTML($html)
            ->setPaper('A4', 'landscape')
            ->setOption('defaultFont', 'Times New Roman')
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('isRemoteEnabled', true);

        $dateSuffix = $startDate && $endDate ? "_{$startDate}_to_{$endDate}" : '';
        return $pdf->stream("rapport-investisseur-{$investor->name}{$dateSuffix}.pdf");
    }

    public function export(string $id, Request $request)
    {
        $investor = Investor::where('user_id', Auth::id())
            ->with([
                'transactions' => function($query) {
                    $query->orderBy('created_at', 'desc');
                },
                'purchases' => function($query) {
                    $query->with('items');
                },
                'sales',
                'user'
            ])
            ->findOrFail($id);

        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        $dateSuffix = $startDate && $endDate ? "_{$startDate}_to_{$endDate}" : '';
        $fileName = "rapport-investisseur-{$investor->name}{$dateSuffix}-" . now()->format('Y-m-d') . '.xlsx';

        return Excel::download(new InvestorReportExport($investor, $startDate, $endDate), $fileName);
    }

    /**
     * Prevent users from accessing other users' suppliers.
     */
    private function authorizeInvestor(Investor $investor)
    {
        abort_unless($investor->user_id === Auth::id(), 403, 'Unauthorized access');
    }
}
