<?php

namespace App\Observers;

use App\Models\Invoice;
use App\Models\JournalVoucher;
use App\Models\EggMovement;
use App\Services\AccountingService;

class InvoiceObserver
{
    public function updated(Invoice $invoice): void
    {
        if ($invoice->wasChanged('status') && $invoice->status === 'sent') {
            app(AccountingService::class)->createForInvoice($invoice);
        }

        if ($invoice->wasChanged('status') && $invoice->status === 'cancelled') {
            app(AccountingService::class)->cancelInvoice($invoice);
        
        }
    }
}
