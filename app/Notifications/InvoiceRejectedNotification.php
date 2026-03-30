<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Invoice;

class InvoiceRejectedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public Invoice $invoice;
    public string $comments;

    public function __construct(Invoice $invoice, string $comments)
    {
        $this->invoice = $invoice;
        $this->comments = $comments;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
                    ->subject('Facture rejetée')
                    ->error()
                    ->line('Votre facture #'.$this->invoice->id.' a été rejetée.')
                    ->line('Motif : ' . $this->comments)
                    ->action('Modifier la facture', url('/invoices/'.$this->invoice->id));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'invoice_id' => $this->invoice->id,
            'message' => 'Votre facture a été rejetée',
            'comments' => $this->comments,
        ];
    }
}
