<?php

namespace App\Observers;

use App\Models\Payment;
use App\Services\AccountingService;

class PaymentObserver
{
    /**
     * Handle the Payment "created" event.
     */
    public function created(Payment $payment): void
    {
        $this->updateInvoicePaymenttatus($payment->invoice);
        app(AccountingService::class)->createForPayment($payment);
    }

    /**
     * Handle the Payment "updated" event.
     */
    public function updated(Payment $payment): void
    {
        $this->updateInvoicePaymenttatus($payment->invoice);
    }

    /**
     * Handle the Payment "deleted" event.
     */
    public function deleted(Payment $payment): void
    {
        $this->updateInvoicePaymenttatus($payment->invoice);
    }

    /**
     * Handle the Payment "restored" event.
     */
    public function restored(Payment $payment): void
    {
        $this->updateInvoicePaymenttatus($payment->invoice);
    }

    /**
     * Handle the Payment "force deleted" event.
     */
    public function forceDeleted(Payment $payment): void
    {
        $this->updateInvoicePaymenttatus($payment->invoice);
    }

    private function updateInvoicePaymenttatus($invoice): void
    {
        if (!$invoice) return;

        $totalPaid = $invoice->payments()->sum('amount');
        
        if ($totalPaid >= $invoice->total) {
            $invoice->payment_status = 'paid';
        } elseif ($totalPaid > 0) {
            $invoice->payment_status = 'partial';
        } else {
            $invoice->payment_status = 'unpaid';
        }

        $invoice->save();
    }
}
