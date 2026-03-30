<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Invoice;

class InvoiceSubmittedNotification extends Notification implements ShouldQueue
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
                    ->subject('Nouvelle facture en attente d\'approbation')
                    ->line('La facture #'.$this->invoice->id.' a été soumise pour approbation.')
                    ->action('Voir la facture', url('/invoices/'.$this->invoice->id))
                    ->line('Merci !');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'invoice_id' => $this->invoice->id,
            'message' => 'Nouvelle facture en attente d\'approbation',
            'amount' => $this->invoice->total,
        ];
    }
}
