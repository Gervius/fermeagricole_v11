<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\JournalEntry;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class AccountController extends Controller
{
    use AuthorizesRequests;   

    public function index()
    {
        $accounts = Account::all()->map(function ($account) {
            $debit = JournalEntry::where('account_id', $account->id)->sum('debit');
            $credit = JournalEntry::where('account_id', $account->id)->sum('credit');
            $balance = $debit - $credit;
            return [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'type' => $account->type,
                'is_active' => $account->is_active,
                'debit' => $debit,
                'credit' => $credit,
                'balance' => $balance,
            ];
        });

        // Simuler une pagination pour respecter la structure Frontend
        $paginatedAccounts = new \Illuminate\Pagination\LengthAwarePaginator(
            $accounts,
            $accounts->count(),
            100, // per_page
            1    // current_page
        );

        return Inertia::render('Settings/Accounts/Index', ['accounts' => $paginatedAccounts]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:accounts',
            'name' => 'required|string|max:255',
            'type' => 'required|in:asset,liability,equity,revenue,expense',
            'is_active' => 'boolean',
        ]);

        Account::create($validated);

        return redirect()->back()->with('success', 'Compte créé avec succès.');
    }

    public function update(Request $request, Account $account)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:accounts,code,' . $account->id,
            'name' => 'required|string|max:255',
            'type' => 'required|in:asset,liability,equity,revenue,expense',
            'is_active' => 'boolean',
        ]);

        $account->update($validated);

        return redirect()->back()->with('success', 'Compte mis à jour.');
    }

    public function destroy(Account $account)
    {
        // La vérification de sécurité est gérée par le AccountObserver (interdit si transactions existantes)
        try {
            $account->delete();
            return redirect()->back()->with('success', 'Compte supprimé.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['message' => $e->getMessage()]);
        }
    }

    public function show(Account $account)
    {
        // Détail des mouvements du compte
        $entries = JournalEntry::where('account_id', $account->id)
            ->with('voucher')
            ->orderBy('voucher.date')
            ->get()
            ->map(fn($entry) => [
                'date' => $entry->voucher->date->format('d/m/Y'),
                'voucher' => $entry->voucher->voucher_number,
                'description' => $entry->description ?? $entry->voucher->description,
                'debit' => $entry->debit,
                'credit' => $entry->credit,
            ]);

        return Inertia::render('Settings/Accounts/Show', [
            'account' => $account,
            'entries' => $entries,
        ]);
    }
}