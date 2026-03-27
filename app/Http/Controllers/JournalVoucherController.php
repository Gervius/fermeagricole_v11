<?php

namespace App\Http\Controllers;

use App\Models\JournalVoucher;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\JournalVouchersExport;

class JournalVoucherController extends Controller
{
    use AuthorizesRequests;
    public function __construct()
    {
        
    }

    public function index(Request $request)
    {
        $vouchers = JournalVoucher::with('creator')
            ->when($request->status, fn($q, $status) => $q->where('status', $status))
            ->orderBy('date', 'desc')
            ->paginate(20)
            ->through(fn($v) => [
                'id' => $v->id,
                'voucher_number' => $v->voucher_number,
                'status' => $v->status,
                'date' => $v->date->format('Y-m-d'), // On garde le format Y-m-d pour le constructeur Date de JS
                'description' => $v->description,
                'created_by' => $v->creator->name,
                'entries_count' => $v->entries()->count(),
                // AJOUT DES CHAMPS MANQUANTS ICI :
                'source_type' => $v->source_type,
                'source_id' => $v->source_id,
            ]);

        return Inertia::render('JournalVouchers/Index', [
            'vouchers' => $vouchers,
            'filters' => $request->only(['status'])
        ]);
    }

    /**
     * Vue spécifiquement pour la révision comptable (Vouchers en attente)
     */
    public function reviewIndex(Request $request)
    {
        // Seuls certains rôles devraient y avoir accès (ex: Gestionnaire, Admin)
        // La protection se fera idéalement via un middleware sur les routes web.php

        $vouchers = JournalVoucher::with(['creator', 'entries.account'])
            ->where('status', 'draft')
            ->orderBy('created_at', 'asc')
            ->paginate(15);

        $accounts = \App\Models\Account::where('is_active', true)->get(['id', 'code', 'name']);

        return Inertia::render('Accounting/Review', [
            'draftVouchers' => $vouchers,
            'accounts' => $accounts
        ]);
    }

    /**
     * Mise à jour manuelle des lignes comptables avant validation.
     */
    public function update(Request $request, JournalVoucher $journalVoucher)
    {
        if ($journalVoucher->status !== 'draft') {
            return back()->withErrors(['message' => 'Seule une écriture en brouillon peut être modifiée.']);
        }

        $validated = $request->validate([
            'description' => 'required|string',
            'entries' => 'required|array|min:2',
            'entries.*.id' => 'nullable|integer|exists:journal_entries,id',
            'entries.*.account_id' => 'required|integer|exists:accounts,id',
            'entries.*.debit' => 'required|numeric|min:0',
            'entries.*.credit' => 'required|numeric|min:0',
            'entries.*.description' => 'required|string',
        ]);

        \DB::transaction(function () use ($journalVoucher, $validated) {
            $journalVoucher->update(['description' => $validated['description']]);

            // Récupérer les IDs envoyés pour savoir ce qui doit être gardé
            $receivedIds = collect($validated['entries'])->pluck('id')->filter()->toArray();
            
            // Supprimer les lignes retirées
            $journalVoucher->entries()->whereNotIn('id', $receivedIds)->delete();

            // Mettre à jour ou Créer les nouvelles lignes
            foreach ($validated['entries'] as $entryData) {
                $journalVoucher->entries()->updateOrCreate(
                    ['id' => $entryData['id'] ?? null],
                    [
                        'account_id' => $entryData['account_id'],
                        'debit' => $entryData['debit'],
                        'credit' => $entryData['credit'],
                        'description' => $entryData['description'],
                    ]
                );
            }
        });

        return back()->with('success', 'Écriture mise à jour.');
    }

    /**
     * Fige l'écriture (Génère le N° de pièce et passe en posted)
     */
    public function post(JournalVoucher $journalVoucher)
    {
        if ($journalVoucher->status !== 'draft') {
            return back()->withErrors(['message' => 'L\'écriture est déjà validée.']);
        }

        // Vérifier l'équilibre Débit / Crédit
        $totalDebit = $journalVoucher->entries()->sum('debit');
        $totalCredit = $journalVoucher->entries()->sum('credit');

        if (bccomp($totalDebit, $totalCredit, 2) !== 0) {
            return back()->withErrors(['message' => 'L\'écriture n\'est pas équilibrée (Total Débit != Total Crédit).']);
        }

        $journalVoucher->update([
            'voucher_number' => JournalVoucher::generateVoucherNumber(),
            'status' => 'posted'
        ]);

        return back()->with('success', 'L\'écriture a été postée avec succès au Grand Livre.');
    }

    public function show(JournalVoucher $journalVoucher)
    {
        $journalVoucher->load('creator', 'entries.account');
        return Inertia::render('JournalVouchers/Show', ['voucher' => $journalVoucher]);
    }

    public function exportExcel()
    {
        return Excel::download(new JournalVouchersExport, 'Journal_Comptable_' . date('Y_m_d') . '.xlsx');
    }
}
