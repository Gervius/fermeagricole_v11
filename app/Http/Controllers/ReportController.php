<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\JournalEntry;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Barryvdh\DomPDF\Facade\Pdf;



class ReportController extends Controller
{
    use AuthorizesRequests;

    public function balance(Request $request)
    {
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        $entriesQuery = JournalEntry::query()
            ->when($startDate, fn($q) => $q->whereHas('voucher', fn($q) => $q->where('date', '>=', $startDate)))
            ->when($endDate, fn($q) => $q->whereHas('voucher', fn($q) => $q->where('date', '<=', $endDate)));

        $accounts = Account::all()->map(function ($account) use ($entriesQuery) {
            $debit = (clone $entriesQuery)->where('account_id', $account->id)->sum('debit');
            $credit = (clone $entriesQuery)->where('account_id', $account->id)->sum('credit');
            
            $balance = $debit - $credit;
            
            // Calcul des soldes débiteurs/créditeurs selon la nature du compte
            if (in_array($account->type, ['asset', 'expense'])) {
                $solde_debiteur = $balance > 0 ? $balance : 0;
                $solde_crediteur = $balance < 0 ? abs($balance) : 0;
            } else {
                // liability, equity, revenue
                $solde_crediteur = $balance < 0 ? abs($balance) : 0;
                $solde_debiteur = $balance > 0 ? $balance : 0;
            }

            return [
                'code' => $account->code,
                'name' => $account->name,
                'debit' => $debit,
                'credit' => $credit,
                'balance' => $balance,
                'solde_debiteur' => $solde_debiteur,
                'solde_crediteur' => $solde_crediteur,
            ];
        });

        $totalDebit = $accounts->sum('debit');
        $totalCredit = $accounts->sum('credit');

        return Inertia::render('Reports/Balance', [
            'accounts' => $accounts,
            'totalDebit' => $totalDebit,
            'totalCredit' => $totalCredit,
            'filters' => ['start_date' => $startDate, 'end_date' => $endDate],
        ]);
    }

    public function incomeStatement(Request $request)
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        $entriesQuery = JournalEntry::query()
            ->whereHas('voucher', fn($q) => $q->where('status', 'posted')->whereBetween('date', [$startDate, $endDate]));

        $revenueAccounts = Account::where('type', 'revenue')->get();
        $expenseAccounts = Account::where('type', 'expense')->get();

        $revenues = $revenueAccounts->map(function ($account) use ($entriesQuery) {
            $credit = (clone $entriesQuery)->where('account_id', $account->id)->sum('credit');
            $debit = (clone $entriesQuery)->where('account_id', $account->id)->sum('debit');
            $balance = $credit - $debit; // Pour un compte de produit, le solde est créditeur
            return [
                'code' => $account->code,
                'name' => $account->name,
                'amount' => $balance,
            ];
        })->filter(fn($item) => $item['amount'] != 0);

        $expenses = $expenseAccounts->map(function ($account) use ($entriesQuery) {
            $debit = (clone $entriesQuery)->where('account_id', $account->id)->sum('debit');
            $credit = (clone $entriesQuery)->where('account_id', $account->id)->sum('credit');
            $balance = $debit - $credit; // Pour une charge, le solde est débiteur
            return [
                'code' => $account->code,
                'name' => $account->name,
                'amount' => $balance,
            ];
        })->filter(fn($item) => $item['amount'] != 0);

        $totalRevenue = $revenues->sum('amount');
        $totalExpense = $expenses->sum('amount');
        $netIncome = $totalRevenue - $totalExpense;

        return Inertia::render('Reports/IncomeStatement', [
            'revenues' => $revenues->values(),
            'expenses' => $expenses->values(),
            'totalRevenue' => $totalRevenue,
            'totalExpense' => $totalExpense,
            'netIncome' => $netIncome,
            'filters' => ['start_date' => $startDate, 'end_date' => $endDate],
        ]);
    }

    public function agingReport(Request $request)
    {
        $asOfDate = $request->get('as_of_date', now()->toDateString());

        $invoices = Invoice::with('partner')
            ->where('status', '!=', 'cancelled')
            ->where('payment_status', '!=', 'paid')
            ->where('date', '<=', $asOfDate)
            ->get();

        $aging = $invoices->groupBy('partner_id')->map(function ($invoices, $partnerId) use ($asOfDate) {
            $partner = $invoices->first()->partner;
            $total = 0;
            $buckets = [
                '0_30' => 0,
                '31_60' => 0,
                '61_90' => 0,
                '90_plus' => 0,
            ];

            foreach ($invoices as $invoice) {
                $dueDate = $invoice->due_date ?? $invoice->date;
                $daysOverdue = max(0, \Carbon\Carbon::parse($asOfDate)->diffInDays($dueDate, false));
                $amountDue = $invoice->remaining_amount;

                $total += $amountDue;
                if ($daysOverdue <= 30) $buckets['0_30'] += $amountDue;
                elseif ($daysOverdue <= 60) $buckets['31_60'] += $amountDue;
                elseif ($daysOverdue <= 90) $buckets['61_90'] += $amountDue;
                else $buckets['90_plus'] += $amountDue;
            }

            return [
                'partner_id' => $partnerId,
                'partner_name' => $partner->name,
                'total_due' => $total,
                'buckets' => $buckets,
            ];
        })->values();

        return Inertia::render('Reports/Aging', [
            'aging' => $aging,
            'as_of_date' => $asOfDate,
        ]);
    }

    public function downloadBalancePdf(Request $request)
    {
        // Optionnel : $this->authorize('view accounting');
        
        $accounts = Account::withSum('journalEntries as debit', 'debit')
            ->withSum('journalEntries as credit', 'credit')
            ->get()
            ->map(function ($account) {
                $balance = ($account->debit ?? 0) - ($account->credit ?? 0);
                
                if (in_array($account->type, ['asset', 'expense'])) {
                    $account->solde_debiteur = $balance > 0 ? $balance : 0;
                    $account->solde_crediteur = $balance < 0 ? abs($balance) : 0;
                } else {
                    $account->solde_crediteur = $balance < 0 ? abs($balance) : 0;
                    $account->solde_debiteur = $balance > 0 ? $balance : 0;
                }
                return $account;
            });

        $totalDebit = $accounts->sum('debit');
        $totalCredit = $accounts->sum('credit');

        $pdf = Pdf::loadView('pdfs.balance', compact('accounts', 'totalDebit', 'totalCredit'));
        
        return $pdf->download('Balance_Generale_' . date('Y_m_d') . '.pdf');
    }


    public function downloadIncomeStatementPdf(Request $request)
    {
        $this->authorize('view reports');

        $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        // Agrégation unique des mouvements par compte
        $entries = JournalEntry::query()
            ->whereHas('voucher', fn($q) => $q->where('status', 'posted')
                ->whereBetween('date', [$startDate, $endDate]))
            ->select('account_id', DB::raw('SUM(debit) as total_debit'), DB::raw('SUM(credit) as total_credit'))
            ->groupBy('account_id')
            ->get()
            ->keyBy('account_id');

        $revenueAccounts = Account::where('type', 'revenue')->get();
        $expenseAccounts = Account::where('type', 'expense')->get();

        $revenues = $revenueAccounts->map(function ($account) use ($entries) {
            $row = $entries->get($account->id);
            $debit = $row->total_debit ?? 0;
            $credit = $row->total_credit ?? 0;
            $balance = $credit - $debit; // Solde créditeur pour les produits
            return [
                'code' => $account->code,
                'name' => $account->name,
                'amount' => $balance,
            ];
        })->filter(fn($item) => $item['amount'] != 0);

        $expenses = $expenseAccounts->map(function ($account) use ($entries) {
            $row = $entries->get($account->id);
            $debit = $row->total_debit ?? 0;
            $credit = $row->total_credit ?? 0;
            $balance = $debit - $credit; // Solde débiteur pour les charges
            return [
                'code' => $account->code,
                'name' => $account->name,
                'amount' => $balance,
            ];
        })->filter(fn($item) => $item['amount'] != 0);

        $totalRevenue = $revenues->sum('amount');
        $totalExpense = $expenses->sum('amount');
        $netIncome = $totalRevenue - $totalExpense;

        $pdf = Pdf::loadView('pdfs.income-statement', compact(
            'revenues', 'expenses', 'totalRevenue', 'totalExpense', 'netIncome', 'startDate', 'endDate'
        ));

        return $pdf->download('compte_resultat_' . $startDate . '_' . $endDate . '.pdf');
    }
}