<?php

namespace App\Observers;

use App\Models\Invoice;
use App\Models\InvoiceAuditLog;
use App\Services\AccountingService;

class InvoiceObserver
{
    /**
     * Listen to the Invoice created event.
     */
    public function created(Invoice $invoice): void
    {
        $this->logAudit($invoice, 'created', null, $invoice->getAttributes());
    }

    /**
     * Listen to the Invoice updated event.
     */
    public function updated(Invoice $invoice): void
    {
        $changes = $invoice->getChanges();
        $original = array_intersect_key($invoice->getOriginal(), $changes);

        // Accounting hooks (legacy/existing)
        if ($invoice->wasChanged('status') && in_array($invoice->status, ['approved', 'issued'])) {
            try {
                app(AccountingService::class)->createForInvoice($invoice);
            } catch (\Exception $e) {
                // Ignore for now to not block workflow refactor
            }
        }

        if ($invoice->wasChanged('status') && $invoice->status === 'cancelled') {
            try {
                app(AccountingService::class)->cancelInvoice($invoice);
            } catch (\Exception $e) {
                // Ignore for now
            }
        }

        // Audit Logging
        $action = 'modified';
        if ($invoice->wasChanged('status')) {
            $action = match($invoice->status) {
                'pending_approval' => 'submitted',
                'approved' => 'approved',
                'rejected' => 'rejected',
                'issued' => 'issued',
                'cancelled' => 'cancelled',
                default => 'modified',
            };
        }

        $this->logAudit($invoice, $action, $original, $changes);
    }

    /**
     * Create the audit log entry.
     */
    protected function logAudit(Invoice $invoice, string $action, ?array $oldValues, ?array $newValues): void
    {
        // Don't log if no meaningful changes
        if (empty($oldValues) && empty($newValues) && $action === 'modified') {
            return;
        }

        InvoiceAuditLog::create([
            'invoice_id' => $invoice->id,
            'user_id' => auth()->id(),
            'action' => $action,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'comments' => null,
        ]);
    }
}
