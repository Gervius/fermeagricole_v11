<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('view invoices');
    }

    public function view(User $user, Invoice $invoice): bool
    {
        return $user->can('view invoices');
    }

    public function create(User $user): bool
    {
        return $user->can('create invoices');
    }

    public function update(User $user, Invoice $invoice): bool
    {
        // Seulement si brouillon et créateur ou admin
        return $invoice->status === 'draft' 
            && $user->can('edit invoices') 
            && ($user->id === $invoice->created_by || $user->hasRole('Admin'));
    }

    public function delete(User $user, Invoice $invoice): bool
    {
        return $invoice->status === 'draft' 
            && $user->can('delete invoices') 
            && ($user->id === $invoice->created_by || $user->hasRole('Admin'));
    }

    public function approve(User $user, Invoice $invoice): bool
    {
        return $invoice->status === 'draft' && $user->can('approve invoices');
    }

    public function cancel(User $user, Invoice $invoice): bool
    {
        return $invoice->status === 'sent' 
            && $invoice->paid_amount == 0 
            && $user->can('cancel invoices');
    }


    public function addPayment(User $user, Invoice $invoice): bool
    {
        return $invoice->payment_status !== 'paid' && $user->can('add payments');
    }
}