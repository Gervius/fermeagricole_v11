<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\AccountingRule;
use App\Models\Account;

class AccountingRuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Assurons-nous que les comptes de base existent pour notre démo SYSCOHADA
        $salesAccount = Account::firstOrCreate(['code' => '701000'], ['name' => 'Ventes de produits', 'type' => 'revenue']);
        $purchaseAccount = Account::firstOrCreate(['code' => '601000'], ['name' => 'Achat de marchandises', 'type' => 'expense']);

        // --- REGLE 1 : Vente de Marchandises ---
        $ruleSale = AccountingRule::firstOrCreate(
            ['event_type' => 'invoice_sale_approved'],
            ['name' => 'Facture de Vente (Oeufs/Poules)', 'description' => 'Génère les écritures lors de l\'approbation d\'une facture de vente', 'is_active' => true]
        );

        if ($ruleSale->lines()->count() === 0) {
            // Débit: Compte Client (Dynamique)
            $ruleSale->lines()->create([
                'type' => 'debit',
                'account_resolution_type' => 'dynamic',
                'dynamic_account_placeholder' => 'partner_account',
                'amount_source' => 'total',
                'percentage' => 100,
                'description_template' => 'Créance Client - Facture {{number}}',
            ]);

            // Crédit: Ventes (Fixe 701)
            $ruleSale->lines()->create([
                'type' => 'credit',
                'account_resolution_type' => 'fixed',
                'account_id' => $salesAccount->id,
                'amount_source' => 'total',
                'percentage' => 100,
                'description_template' => 'Vente de produits - Facture {{number}}',
                'analytical_target_source' => 'flock', // Ventilation analytique
            ]);
        }

        // --- REGLE 2 : Achat de Marchandises / Lot ---
        $rulePurchase = AccountingRule::firstOrCreate(
            ['event_type' => 'invoice_purchase_approved'],
            ['name' => 'Facture d\'Achat (Fournisseur)', 'description' => 'Génère les écritures lors de l\'approbation d\'une facture d\'achat (ex: Génération)', 'is_active' => true]
        );

        if ($rulePurchase->lines()->count() === 0) {
            // Débit: Achat (Fixe 601)
            $rulePurchase->lines()->create([
                'type' => 'debit',
                'account_resolution_type' => 'fixed',
                'account_id' => $purchaseAccount->id,
                'amount_source' => 'total',
                'percentage' => 100,
                'description_template' => 'Achat marchandises - Facture {{number}}',
                'analytical_target_source' => 'flock',
            ]);

            // Crédit: Compte Fournisseur (Dynamique)
            $rulePurchase->lines()->create([
                'type' => 'credit',
                'account_resolution_type' => 'dynamic',
                'dynamic_account_placeholder' => 'partner_account',
                'amount_source' => 'total',
                'percentage' => 100,
                'description_template' => 'Dette Fournisseur - Facture {{number}}',
            ]);
        }

        // --- REGLE 3 : Paiement Reçu ---
        $rulePaymentIn = AccountingRule::firstOrCreate(
            ['event_type' => 'payment_received'],
            ['name' => 'Encaissement Client (Mobile Money, Espèces)', 'description' => 'Génère les écritures de trésorerie', 'is_active' => true]
        );

        if ($rulePaymentIn->lines()->count() === 0) {
            // Débit: Trésorerie (Dynamique)
            $rulePaymentIn->lines()->create([
                'type' => 'debit',
                'account_resolution_type' => 'dynamic',
                'dynamic_account_placeholder' => 'payment_method_account',
                'amount_source' => 'amount',
                'percentage' => 100,
                'description_template' => 'Encaissement via Trésorerie',
            ]);

            // Crédit: Compte Client (Dynamique)
            $rulePaymentIn->lines()->create([
                'type' => 'credit',
                'account_resolution_type' => 'dynamic',
                'dynamic_account_placeholder' => 'partner_account',
                'amount_source' => 'amount',
                'percentage' => 100,
                'description_template' => 'Règlement Client',
            ]);
        }
    }
}
