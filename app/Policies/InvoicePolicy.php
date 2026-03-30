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
        return $invoice->status === 'draft' 
            && $user->can('edit invoices') 
            && ($user->id === $invoice->created_by || $user->hasRole('admin'));
    }

    public function delete(User $user, Invoice $invoice): bool
    {
        return $invoice->status === 'draft' 
            && $user->can('delete invoices') 
            && ($user->id === $invoice->created_by || $user->hasRole('admin'));
    }

    public function submit(User $user, Invoice $invoice): bool
    {
        return $invoice->status === 'draft'
            && ($user->id === $invoice->created_by || $user->hasRole('admin'));
    }

    public function approve(User $user, Invoice $invoice): bool
    {
        if ($invoice->status !== 'pending_approval' || !$invoice->workflowStep) {
            return false;
        }

        $requiredRoleId = $invoice->workflowStep->role_id;
        $roleName = \Spatie\Permission\Models\Role::find($requiredRoleId)?->name;

        return $roleName && ($user->hasRole($roleName) || $user->hasRole('admin'));
    }

    public function cancel(User $user, Invoice $invoice): bool
    {
        return !in_array($invoice->status, ['cancelled', 'paid'])
            && $user->can('cancel invoices');
    }

    public function addPayment(User $user, Invoice $invoice): bool
    {
        return in_array($invoice->status, ['issued', 'approved'])
            && $invoice->payment_status !== 'paid'
            && $user->can('add payments');
    }
}
