<?php

namespace App\Http\Controllers;

use App\Models\Investor;
use App\Models\InvestorTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class InvestorTransactionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = InvestorTransaction::where('user_id', Auth::id())
            ->with(['investor', 'purchase', 'sale']); // eager load relations

        // optional: filter out 0 amounts if you want (like supplier)
        // $query->where('amount', '>', 0);

        if ($request->filled('search')) {
            $searchTerm = '%' . $request->search . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->whereHas('investor', function ($investorQuery) use ($searchTerm) {
                    $investorQuery->where('name', 'like', $searchTerm)
                        ->orWhere('email', 'like', $searchTerm)
                        ->orWhere('phone', 'like', $searchTerm);
                })
                ->orWhere('note', 'like', $searchTerm)
                ->orWhere('amount', 'like', $searchTerm)
                ->orWhereDate('date', $searchTerm) // exact match like 2025-09-22
                ->orWhere('date', 'like', "%{$searchTerm}%")
                ->orWhere('type', 'like', $searchTerm);
            });
        }

        $transactions = $query->latest('updated_at' , 'asc')->paginate(50);

        return Inertia::render('investor_transactions/index', [
            'transactions'    => $transactions,
            'paginationLinks' => $transactions->linkCollection(),
            'search'          => $request->search,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $investors = Investor::where('user_id', auth()->id())
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('investor_transactions/create', [
            'investors' => $investors,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date'        => 'required|date|before_or_equal:today',
            'type'        => 'required|in:In,Out',
            'amount'      => 'required|numeric|min:0.01|max:999999999.99',
            'note'        => 'nullable|string|max:500',
            'investor_id' => [
                'required',
                'exists:investors,id',
                function ($attribute, $value, $fail) {
                    // Ensure the investor belongs to the authenticated user
                    $investorExists = Investor::where('id', $value)
                        ->where('user_id', auth()->id())
                        ->exists();

                    if (!$investorExists) {
                        $fail('The selected investor is invalid.');
                    }
                },
            ],
        ], [
            'date.required' => 'The transaction date is required.',
            'date.before_or_equal' => 'Transaction date cannot be in the future.',
            'amount.min' => 'Amount must be at least :min.',
            'amount.max' => 'Amount cannot exceed :max.',
            'investor_id.required' => 'Please select an investor.',
            'investor_id.exists' => 'The selected investor is invalid.',
        ]);

        $validated['user_id'] = Auth::id();

        try {
            InvestorTransaction::create($validated);

            return redirect()
                ->route('investor_transactions')
                ->with('success', 'Investor transaction created successfully.');

        } catch (\Exception $e) {
            Log::error('Failed to create investor transaction: ' . $e->getMessage());

            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Failed to create transaction. Please try again.');
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $transaction = InvestorTransaction::with('investor')
            ->where('user_id', auth()->id())
            ->findOrFail($id);

        // Prevent editing if linked to purchase or sale
        if ($transaction->purchase_id !== null || $transaction->sale_id !== null) {
            return redirect()->route('investor_transactions')
                ->with('error', 'This transaction is linked to a purchase or sale and cannot be edited.');
        }

        $investors = Investor::where('user_id', auth()->id())
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('investor_transactions/edit', [
            'transaction' => [
                'id'          => $transaction->id,
                'date'        => $transaction->date, // Already formatted as Y-m-d from model
                'type'        => $transaction->type,
                'amount'      => (string) $transaction->amount,
                'note'        => $transaction->note,
                'investor_id' => $transaction->investor_id,
                'purchase_id' => $transaction->purchase_id,
                'sale_id'     => $transaction->sale_id,
                'created_at'  => $transaction->created_at,
                'updated_at'  => $transaction->updated_at,
            ],
            'investors' => $investors,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $transaction = InvestorTransaction::where('user_id', auth()->id())
            ->findOrFail($id);

        // Prevent editing if linked to purchase or sale
        if ($transaction->purchase_id !== null || $transaction->sale_id !== null) {
            return redirect()
                ->route('investor_transactions')
                ->with('error', 'This transaction is linked to a purchase or sale and cannot be updated.');
        }

        $validated = $request->validate([
            'date'        => ['required', 'date', 'before_or_equal:today'],
            'type'        => ['required', Rule::in(['In', 'Out'])],
            'amount'      => ['required', 'numeric', 'min:0.01', 'max:999999999.99'],
            'note'        => ['nullable', 'string', 'max:500'],
            'investor_id' => [
                'required',
                'exists:investors,id',
                function ($attribute, $value, $fail) {
                    $investorExists = Investor::where('id', $value)
                        ->where('user_id', auth()->id())
                        ->exists();

                    if (!$investorExists) {
                        $fail('The selected investor is invalid.');
                    }
                },
            ],
        ], [
            'date.required' => 'The transaction date is required.',
            'date.before_or_equal' => 'Transaction date cannot be in the future.',
            'type.required' => 'Transaction type is required.',
            'type.in' => 'Transaction type must be either In or Out.',
            'amount.required' => 'Amount is required.',
            'amount.numeric' => 'Amount must be a valid number.',
            'amount.min' => 'Amount must be at least :min.',
            'amount.max' => 'Amount cannot exceed :max.',
            'investor_id.required' => 'Please select an investor.',
            'investor_id.exists' => 'The selected investor is invalid.',
            'note.max' => 'Note cannot exceed :max characters.',
        ]);

        try {
            $transaction->update($validated);

            return redirect()
                ->route('investor_transactions')
                ->with('success', 'Investor transaction updated successfully.');

        } catch (\Exception $e) {
            Log::error('Failed to update investor transaction: ' . $e->getMessage(), [
                'transaction_id' => $id,
                'user_id' => auth()->id()
            ]);

            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Failed to update transaction. Please try again.');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $transaction = InvestorTransaction::findOrFail($id);

        if ($transaction->purchase_id !== null || $transaction->sale_id !== null) {
            return redirect()->route('investor_transactions')
                ->with('error', 'This transaction is linked to a purchase or sale and cannot be deleted.');
        }

        $transaction->delete();

        return redirect()->route('investor_transactions')
            ->with('success', 'Investor transaction deleted successfully.');
    }
}
