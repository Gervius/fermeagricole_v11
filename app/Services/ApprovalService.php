<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\User;
use App\Models\WorkflowStep;
use App\Models\InvoiceApproval;
use Illuminate\Support\Facades\DB;
use App\Notifications\InvoiceSubmittedNotification;
use App\Notifications\InvoiceApprovedNotification;
use App\Notifications\InvoiceRejectedNotification;

class ApprovalService
{
    /**
     * Soumet une facture pour approbation. Elle passe de "draft" à "pending_approval".
     */
    public function submit(Invoice $invoice): void
    {
        if ($invoice->status !== 'draft') {
            throw new \Exception("Seules les factures en brouillon peuvent être soumises.");
        }

        $firstStep = WorkflowStep::where('is_active', true)->orderBy('order')->first();

        if (! $firstStep) {
            $invoice->status = 'approved';
            $invoice->approved_by = auth()->id();
            $invoice->approved_at = now();
            $invoice->save();
        } else {
            $invoice->status = 'pending_approval';
            $invoice->workflow_step_id = $firstStep->id;
            $invoice->save();

            $this->notifyApprovers($invoice, $firstStep);
        }
    }

    /**
     * Approuve l'étape en cours pour la facture par un utilisateur donné.
     */
    public function approve(Invoice $invoice, int $userId): void
    {
        if ($invoice->status !== 'pending_approval') {
            throw new \Exception("La facture n'est pas en attente d'approbation.");
        }

        $currentStepId = $invoice->workflow_step_id;
        $currentStep = WorkflowStep::find($currentStepId);

        DB::transaction(function () use ($invoice, $userId, $currentStep) {
            InvoiceApproval::create([
                'invoice_id' => $invoice->id,
                'workflow_step_id' => $currentStep->id,
                'user_id' => $userId,
                'action' => 'approved',
                'comments' => null,
            ]);

            $nextStep = WorkflowStep::where('is_active', true)
                ->where('order', '>', $currentStep->order)
                ->orderBy('order')
                ->first();

            if ($nextStep) {
                $invoice->workflow_step_id = $nextStep->id;
                $invoice->save();

                $this->notifyApprovers($invoice, $nextStep);
            } else {
                $invoice->status = 'approved';
                $invoice->workflow_step_id = null;
                $invoice->approved_by = $userId;
                $invoice->approved_at = now();
                $invoice->save();

                if ($invoice->creator) {
                    $invoice->creator->notify(new InvoiceApprovedNotification($invoice));
                }
            }
        });
    }

    /**
     * Rejette la facture avec un commentaire obligatoire.
     */
    public function reject(Invoice $invoice, int $userId, string $comments): void
    {
        if ($invoice->status !== 'pending_approval') {
            throw new \Exception("La facture n'est pas en attente d'approbation.");
        }

        $currentStepId = $invoice->workflow_step_id;
        $currentStep = WorkflowStep::find($currentStepId);

        DB::transaction(function () use ($invoice, $userId, $currentStep, $comments) {
            InvoiceApproval::create([
                'invoice_id' => $invoice->id,
                'workflow_step_id' => $currentStep->id,
                'user_id' => $userId,
                'action' => 'rejected',
                'comments' => $comments,
            ]);

            $invoice->status = 'draft';
            $invoice->workflow_step_id = null;
            $invoice->save();

            if ($invoice->creator) {
                $invoice->creator->notify(new InvoiceRejectedNotification($invoice, $comments));
            }
        });
    }

    /**
     * Notifie les approbateurs d'une étape spécifique
     */
    protected function notifyApprovers(Invoice $invoice, WorkflowStep $step): void
    {
        $roleName = $step->role->name;

        // Spatie package
        $approvers = User::role($roleName)->get();

        foreach ($approvers as $approver) {
            $approver->notify(new InvoiceSubmittedNotification($invoice));
        }
    }
}
