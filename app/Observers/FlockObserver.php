<?php

namespace App\Observers;

use App\Models\Flock;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use Illuminate\Support\Str;

class FlockObserver
{
    /**
     * Handle the Flock "created" event.
     */
    public function created(Flock $flock): void
    {
        if ($flock->status === 'active' && !$flock->invoice_id && $flock->supplier_id && $flock->purchase_cost > 0) {
            $this->generateSupplierInvoice($flock);
        }
    }

    /**
     * Handle the Flock "updated" event.
     */
    public function updated(Flock $flock): void
    {
        // Si le lot passe à 'active', qu'il n'a pas encore de facture, et qu'il a un fournisseur et un coût
        if ($flock->wasChanged('status') && $flock->status === 'active' && !$flock->invoice_id && $flock->supplier_id && $flock->purchase_cost > 0) {
            $this->generateSupplierInvoice($flock);
        }
    }

    protected function generateSupplierInvoice(Flock $flock)
    {
        $invoice = Invoice::create([
            'number' => 'ACH-' . date('Y') . '-' . strtoupper(Str::random(4)),
            'type' => 'purchase',
            'partner_id' => $flock->supplier_id,
            'date' => $flock->arrival_date,
            'due_date' => $flock->arrival_date->copy()->addDays(30), // Par défaut 30 jours
            'subtotal' => $flock->purchase_cost,
            'tax_rate' => 0,
            'tax_amount' => 0,
            'total' => $flock->purchase_cost,
            'status' => 'sent', // ou 'draft' selon le workflow souhaité, 'sent' permet d'être en attente de paiement
            'payment_status' => 'unpaid',
            'created_by' => $flock->approved_by ?? $flock->created_by,
            'approved_by' => $flock->approved_by,
            'approved_at' => now(),
            'notes' => "Facture générée automatiquement pour l'achat de la génération: " . $flock->name,
        ]);

        InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'itemable_type' => Flock::class,
            'itemable_id' => $flock->id,
            'description' => "Achat du lot de poules: " . $flock->name,
            'quantity' => $flock->initial_quantity,
            'unit_price' => $flock->initial_quantity > 0 ? ($flock->purchase_cost / $flock->initial_quantity) : 0,
            'total' => $flock->purchase_cost,
        ]);

        // Mettre à jour le lot sans déclencher d'événements infinis
        $flock->updateQuietly(['invoice_id' => $invoice->id]);
    }

    /**
     * Handle the Flock "deleted" event.
     */
    public function deleted(Flock $flock): void
    {
        //
    }

    /**
     * Handle the Flock "restored" event.
     */
    public function restored(Flock $flock): void
    {
        //
    }

    /**
     * Handle the Flock "force deleted" event.
     */
    public function forceDeleted(Flock $flock): void
    {
        //
    }
}
