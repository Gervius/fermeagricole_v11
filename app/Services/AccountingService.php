<?php

namespace App\Services;

use App\Models\Account;
use App\Models\JournalVoucher;
use App\Models\JournalEntry;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\EggMovement;
use App\Models\Flock;
use App\Models\AccountingRule;
use App\Models\AccountingRuleLine;
use Illuminate\Support\Facades\DB;

class AccountingService
{
    /**
     * Exécute une règle comptable paramétrée pour un événement donné.
     *
     * @param string $eventType Ex: 'invoice_sale_approved', 'payment_received'
     * @param \Illuminate\Database\Eloquent\Model $sourceDocument Le document source (Invoice, Payment, etc.)
     * @param string $description Description générale de l'écriture
     * @param string $date Date de l'écriture (Y-m-d)
     */
    public function executeRule(string $eventType, $sourceDocument, string $description, string $date)
    {
        $rule = AccountingRule::where('event_type', $eventType)
            ->where('is_active', true)
            ->with('lines')
            ->first();

        if (!$rule) {
            // Pas de règle active configurée, on ne génère pas d'écriture.
            // On pourrait logger l'information.
            return null;
        }

        DB::transaction(function () use ($rule, $sourceDocument, $description, $date) {
            $voucher = JournalVoucher::create([
                'voucher_number' => JournalVoucher::generateVoucherNumber(),
                'status' => 'draft',
                'date' => $date,
                'description' => $description,
                'source_id' => $sourceDocument->id,
                'source_type' => get_class($sourceDocument),
                'created_by' => auth()->id() ?? 1,
            ]);

            foreach ($rule->lines as $line) {
                // 1. Résolution du montant
                $baseAmount = $this->resolveAmount($line->amount_source, $sourceDocument);
                $calculatedAmount = $baseAmount * ($line->percentage / 100);

                if ($calculatedAmount <= 0) {
                    continue; // On ignore les lignes à 0
                }

                // 2. Résolution du compte
                $accountId = $this->resolveAccount($line, $sourceDocument);

                if (!$accountId) {
                    throw new \Exception("Impossible de résoudre le compte pour la ligne de règle {$line->id} ({$rule->name}).");
                }

                // 3. Définir le texte de l'écriture
                $entryDescription = $line->description_template
                    ? str_replace('{{number}}', $sourceDocument->number ?? '', $line->description_template)
                    : $description;

                // 4. Créer la ligne d'écriture
                $entry = $voucher->entries()->create([
                    'account_id' => $accountId,
                    'debit' => $line->type === 'debit' ? $calculatedAmount : 0,
                    'credit' => $line->type === 'credit' ? $calculatedAmount : 0,
                    'description' => $entryDescription,
                ]);

                // 5. Ventilation analytique (optionnelle)
                if ($line->analytical_target_source && class_exists(\App\Models\AnalyticalAccount::class)) {
                    $this->applyAnalyticalAllocation($entry, $line->analytical_target_source, $sourceDocument, $calculatedAmount);
                }
            }
        });
    }

    private function resolveAmount(string $amountSource, $sourceDocument): float
    {
        // On récupère la propriété dynamiquement
        if (isset($sourceDocument->{$amountSource})) {
            return (float) $sourceDocument->{$amountSource};
        }

        // Alias spécifiques au métier si les noms de colonnes divergent
        if ($amountSource === 'amount_paid' && isset($sourceDocument->amount)) {
            return (float) $sourceDocument->amount; // Pour les paiements
        }

        if ($amountSource === 'purchase_cost' && isset($sourceDocument->purchase_cost)) {
            return (float) $sourceDocument->purchase_cost; // Pour les flocks
        }

        return 0;
    }

    private function resolveAccount(AccountingRuleLine $line, $sourceDocument): ?int
    {
        if ($line->account_resolution_type === 'fixed') {
            return $line->account_id;
        }

        // Cas 'dynamic'
        $placeholder = $line->dynamic_account_placeholder;

        if ($placeholder === 'partner_account') {
            // Pour une facture, le partner est direct
            $partner = null;
            $invoiceType = 'sale';

            if (isset($sourceDocument->partner_id) && $sourceDocument->partner) {
                $partner = $sourceDocument->partner;
                $invoiceType = $sourceDocument->type ?? 'sale';
            }
            // Pour un paiement, le partner passe par la facture associée
            elseif (isset($sourceDocument->invoice) && $sourceDocument->invoice && $sourceDocument->invoice->partner) {
                $partner = $sourceDocument->invoice->partner;
                $invoiceType = $sourceDocument->invoice->type ?? 'sale';
            }

            if ($partner) {
                // Si le Partner a directement un `account_id` :
                if (isset($partner->account_id)) {
                    return $partner->account_id;
                }

                // Fallback de sécurité (création automatique d'un compte lié au nom du fournisseur/client)
                $typePrefix = $invoiceType === 'purchase' ? '401' : '411';
                $fallbackAcc = Account::firstOrCreate(
                    ['code' => $typePrefix . '-' . $partner->id],
                    ['name' => $partner->name, 'type' => ($typePrefix === '401' ? 'liability' : 'asset')]
                );
                return $fallbackAcc->id;
            }
        }

        if ($placeholder === 'payment_method_account') {
            // Mapping de méthode de paiement (Espèces, Mobile Money, Banque) vers un compte
            if (isset($sourceDocument->method)) {
                $methodToAccount = [
                    'Espèces' => '571%',
                    'Orange Money' => '5811%',
                    'Wave' => '5812%',
                    'Virement' => '512%',
                ];
                $pattern = $methodToAccount[$sourceDocument->method] ?? '571%';
                $acc = Account::where('code', 'like', $pattern)->first();
                if ($acc) return $acc->id;
            }
        }

        return null;
    }

    private function applyAnalyticalAllocation(\App\Models\JournalEntry $entry, string $targetSource, $sourceDocument, float $amount)
    {
        if ($targetSource === 'flock' && isset($sourceDocument->items)) {
            // Recherche d'un lot dans les items de facture
            foreach ($sourceDocument->items as $item) {
                if ($item->itemable_type === Flock::class) {
                    $flock = Flock::find($item->itemable_id);
                    if ($flock) {
                        $analyticalAcc = \App\Models\AnalyticalAccount::firstOrCreate(
                            ['target_id' => $flock->id, 'target_type' => Flock::class],
                            ['code' => 'LOT-' . $flock->id, 'name' => 'Suivi Lot ' . $flock->name]
                        );

                        \App\Models\AnalyticalAllocation::create([
                            'journal_entry_id' => $entry->id,
                            'analytical_account_id' => $analyticalAcc->id,
                            'amount' => $amount, // idéalement propotionnel à l'item, mais ici simplifié
                            'percentage' => 100,
                        ]);
                        break;
                    }
                }
            }
        }
    }

    /**
     * Maintien de l'ancienne méthode pour compatibilité métier (mouvements de stocks)
     * mais on délègue la partie purement comptable au moteur.
     */
    public function createForInvoice(Invoice $invoice)
    {
        // 1. Génération comptable via les règles dynamiques
        $eventType = $invoice->type === 'sale' ? 'invoice_sale_approved' : 'invoice_purchase_approved';
        $desc = ($invoice->type === 'sale' ? "Vente" : "Achat") . " - Facture n° " . $invoice->number;

        $this->executeRule($eventType, $invoice, $desc, $invoice->date->format('Y-m-d'));

        // 2. Gestion métier spécifique : Mouvements de stock
        foreach ($invoice->items as $item) {
            if ($item->itemable_type === EggMovement::class) {
                // Vente d'oeufs
                EggMovement::create([
                    'date' => $invoice->date,
                    'type' => 'out',
                    'quantity' => (int) $item->quantity, // toujours positif, le type indique la sortie
                    'source_id' => $item->id,
                    'source_type' => get_class($item),
                    'created_by' => $invoice->approved_by ?? auth()->id(),
                    'notes' => "Vente d'oeufs - Facture {$invoice->number}",
                ]);
            } elseif ($item->itemable_type === Flock::class) {
                // Vente de poules
                $flock = Flock::find($item->itemable_id);
                if ($flock) {
                    // Vérifier si le lot est terminé
                    if ($flock->calculated_quantity <= 0) {
                        $flock->status = 'completed';
                        $flock->ended_at = now();
                        $flock->end_reason = 'sale';
                        $flock->save();
                    }

                    // L'analytique est maintenant gérée par le moteur de règles.
                }
            }
        }
    }

    /**
     * Génère l'écriture comptable pour un paiement.
     */
    public function createForPayment(Payment $payment)
    {
        $invoice = $payment->invoice;
        $eventType = $invoice && $invoice->type === 'purchase' ? 'payment_sent' : 'payment_received';
        $desc = "Paiement - {$payment->method}" . ($invoice ? " - Facture {$invoice->number}" : "");

        $this->executeRule($eventType, $payment, $desc, $payment->payment_date->format('Y-m-d'));
    }

    /**
     * Annule les effets d'une facture (à appeler lors du passage à cancelled).
     */
    public function cancelInvoice(Invoice $invoice)
    {
        // Trouver le voucher associé (s'il existe)
        $voucher = JournalVoucher::where('source_id', $invoice->id)
            ->where('source_type', Invoice::class)
            ->first();

        if ($voucher) {
            // Option 1 : Marquer le voucher comme annulé
            $voucher->update(['status' => 'cancelled']); // à ajouter dans la migration si besoin

            // Option 2 : Créer des écritures inverses
            // ...
        }

        // Inverser les mouvements de stock
        foreach ($invoice->items as $item) {
            if ($item->itemable_type === EggMovement::class) {
                // Créer un mouvement d'entrée pour compenser la sortie
                EggMovement::create([
                    'date' => now(),
                    'type' => 'in', // ou 'adjust' selon votre logique
                    'quantity' => $item->quantity,
                    'source_id' => $item->id,
                    'source_type' => get_class($item),
                    'created_by' => auth()->id(),
                    'notes' => "Annulation facture {$invoice->number}",
                ]);
            } elseif ($item->itemable_type === Flock::class) {
                $flock = Flock::find($item->itemable_id);
                if ($flock && $flock->status === 'completed' && $flock->end_reason === 'sale') {
                    // Remettre le lot en actif ? Cela dépend de votre logique.
                    // Peut-être simplement recalculer la quantité.
                }
            }
        }
    }
}