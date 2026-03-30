<?php

namespace App\Services;

use App\Models\Invoice;
use Illuminate\Support\Str;

class InvoiceService
{
    /**
     * Crée une nouvelle facture (en statut brouillon).
     */
    public function createDraft(array $data, int $userId): Invoice
    {
        $data['status'] = 'draft';
        $data['created_by'] = $userId;
        $data['number'] = null; // Le numéro sera généré plus tard

        return Invoice::create($data);
    }

    /**
     * Met à jour une facture si elle est en statut brouillon.
     */
    public function updateDraft(Invoice $invoice, array $data): bool
    {
        if ($invoice->status !== 'draft') {
            throw new \Exception("Seules les factures en brouillon peuvent être modifiées.");
        }

        return $invoice->update($data);
    }

    /**
     * Génère un numéro de facture final et passe l'état à "issued".
     */
    public function issueInvoice(Invoice $invoice): Invoice
    {
        if ($invoice->status !== 'approved') {
            throw new \Exception("La facture doit être approuvée avant d'être émise.");
        }

        $invoice->number = $this->generateNextInvoiceNumber();
        $invoice->status = 'issued';
        $invoice->save();

        return $invoice;
    }

    /**
     * Annule une facture.
     */
    public function cancelInvoice(Invoice $invoice): Invoice
    {
        if ($invoice->status === 'cancelled') {
            throw new \Exception("La facture est déjà annulée.");
        }

        $invoice->status = 'cancelled';
        $invoice->save();

        return $invoice;
    }

    /**
     * Génère le numéro séquentiel de la facture.
     */
    protected function generateNextInvoiceNumber(): string
    {
        $year = date('Y');
        $lastInvoice = Invoice::where('number', 'like', "FAC-{$year}-%")
            ->orderBy('id', 'desc')
            ->first();

        if (! $lastInvoice || ! $lastInvoice->number) {
            return "FAC-{$year}-0001";
        }

        $lastNumber = intval(substr($lastInvoice->number, -4));
        $nextNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);

        return "FAC-{$year}-{$nextNumber}";
    }
}
