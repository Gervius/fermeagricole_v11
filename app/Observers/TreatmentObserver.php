<?php

namespace App\Observers;

use App\Models\Treatment;

class TreatmentObserver
{
    /**
     * Handle the Treatment "created" event.
     */
    public function created(Treatment $treatment): void
    {
        $this->handleAccounting($treatment);
    }

    /**
     * Handle the Treatment "updated" event.
     */
    public function updated(Treatment $treatment): void
    {
        $this->handleAccounting($treatment);
    }

    private function handleAccounting(Treatment $treatment): void
    {
        // On ne déclenche l'action que si le statut passe à 'approved'
        if ($treatment->wasChanged('status') && $treatment->status === 'approved' && $treatment->cost > 0) {
            
            // 1. Générer l'écriture comptable en DRAFT
            $voucher = \App\Models\JournalVoucher::create([
                'voucher_number' => null,
                'status' => 'draft',
                'date' => $treatment->treatment_date,
                'description' => "Frais Vétérinaires - Soin pour lot " . ($treatment->flock->name ?? 'Inconnu'),
                'source_id' => $treatment->id,
                'source_type' => \App\Models\Treatment::class,
                'created_by' => $treatment->approved_by ?? auth()->id(),
            ]);

            // Récupérer des comptes par défaut
            $vetExpenseAccount = \App\Models\Account::where('code', 'like', '622%')->first() 
                ?? \App\Models\Account::firstOrCreate(['code' => '622000', 'name' => 'Frais Vétérinaires', 'type' => 'expense']);
            $bankAccount = \App\Models\Account::where('code', 'like', '512%')->first()
                ?? \App\Models\Account::firstOrCreate(['code' => '512000', 'name' => 'Banque', 'type' => 'asset']);

            // 2. Créer les JournalEntries (Débit Frais Vet / Crédit Banque)
            $voucher->entries()->create([
                'account_id' => $vetExpenseAccount->id,
                'debit' => $treatment->cost,
                'credit' => 0,
                'description' => "Charge - Soin vétérinaire " . $treatment->treatment_type,
            ]);

            $voucher->entries()->create([
                'account_id' => $bankAccount->id,
                'debit' => 0,
                'credit' => $treatment->cost,
                'description' => "Paiement (attente) - " . $treatment->veterinarian,
            ]);
        }
    }

    /**
     * Handle the Treatment "deleted" event.
     */
    public function deleted(Treatment $treatment): void
    {
        //
    }

    /**
     * Handle the Treatment "restored" event.
     */
    public function restored(Treatment $treatment): void
    {
        //
    }

    /**
     * Handle the Treatment "force deleted" event.
     */
    public function forceDeleted(Treatment $treatment): void
    {
        //
    }
}
