<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Invoice;

class InvoiceApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public Invoice $invoice;

    public function __construct(Invoice $invoice)
    {
        $this->invoice = $invoice;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
                    ->subject('Facture approuvée')
                    ->line('Votre facture #'.$this->invoice->id.' a été approuvée.')
                    ->action('Voir la facture', url('/invoices/'.$this->invoice->id));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'invoice_id' => $this->invoice->id,
            'message' => 'Votre facture a été approuvée',
            'amount' => $this->invoice->total,
        ];
    }
}
