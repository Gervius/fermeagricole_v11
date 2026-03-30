<?php

use App\Models\Invoice;
use App\Models\User;
use App\Models\Partner;
use App\Models\WorkflowStep;
use App\Services\ApprovalService;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Notification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Notifications\InvoiceSubmittedNotification;
use App\Notifications\InvoiceApprovedNotification;
use App\Notifications\InvoiceRejectedNotification;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->approvalService = app(ApprovalService::class);
    Notification::fake();

    // Seed test roles
    $this->managerRole = Role::firstOrCreate(['name' => 'manager']);
    $this->directorRole = Role::firstOrCreate(['name' => 'director']);

    // Create users
    $this->creator = User::factory()->create();

    $this->managerUser = User::factory()->create();
    $this->managerUser->assignRole('manager');

    $this->directorUser = User::factory()->create();
    $this->directorUser->assignRole('director');

    // Create Workflow
    $this->step1 = WorkflowStep::create([
        'name' => 'Step 1',
        'role_id' => $this->managerRole->id,
        'order' => 1,
    ]);

    $this->step2 = WorkflowStep::create([
        'name' => 'Step 2',
        'role_id' => $this->directorRole->id,
        'order' => 2,
    ]);

    $partner = Partner::create([
        'name' => 'Test Partner',
        'type' => 'customer',
        'is_active' => true,
    ]);

    // Create Invoice
    $this->invoice = Invoice::create([
        'type' => 'sale',
        'partner_id' => $partner->id,
        'date' => now(),
        'subtotal' => 100,
        'total' => 100,
        'status' => 'draft',
        'payment_status' => 'unpaid',
        'created_by' => $this->creator->id,
    ]);
});

test('submit invoice triggers workflow and notifies step 1 approvers', function () {
    $this->approvalService->submit($this->invoice);

    expect($this->invoice->fresh()->status)->toBe('pending_approval')
        ->and($this->invoice->fresh()->workflow_step_id)->toBe($this->step1->id);

    Notification::assertSentTo(
        [$this->managerUser], InvoiceSubmittedNotification::class
    );
});

test('approve invoice goes to next step and notifies step 2 approvers', function () {
    $this->approvalService->submit($this->invoice);
    $this->approvalService->approve($this->invoice->fresh(), $this->managerUser->id);

    expect($this->invoice->fresh()->status)->toBe('pending_approval')
        ->and($this->invoice->fresh()->workflow_step_id)->toBe($this->step2->id);

    Notification::assertSentTo(
        [$this->directorUser], InvoiceSubmittedNotification::class
    );
});

test('approve invoice on last step finishes workflow', function () {
    $this->approvalService->submit($this->invoice);
    $this->approvalService->approve($this->invoice->fresh(), $this->managerUser->id);
    $this->approvalService->approve($this->invoice->fresh(), $this->directorUser->id);

    expect($this->invoice->fresh()->status)->toBe('approved')
        ->and($this->invoice->fresh()->workflow_step_id)->toBeNull();

    Notification::assertSentTo(
        [$this->creator], InvoiceApprovedNotification::class
    );
});

test('reject invoice resets to draft and notifies creator', function () {
    $this->approvalService->submit($this->invoice);
    $this->approvalService->reject($this->invoice->fresh(), $this->managerUser->id, 'Missing info');

    expect($this->invoice->fresh()->status)->toBe('draft')
        ->and($this->invoice->fresh()->workflow_step_id)->toBeNull();

    Notification::assertSentTo(
        [$this->creator], InvoiceRejectedNotification::class
    );
});
