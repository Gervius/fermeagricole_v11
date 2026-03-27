<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Observers\InvoiceObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;

#[ObservedBy([InvoiceObserver::class])]
class Invoice extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'number', 'type', 'customer_name', 'partner_id', 'date', 'due_date',
        'subtotal', 'tax_rate', 'tax_amount', 'total',
        'status', 'payment_status', 'notes', 'created_by', 'approved_by'
    ];

    protected $casts = [
        'date' => 'date',
        'due_date' => 'date',
        'subtotal' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Calcul du reste à payer pour l'UI
    public function getRemainingAmountAttribute(): float
    {
        return $this->total - $this->payments()->sum('amount');
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function isApproved(): bool
    {
        return $this->status === 'sent';
    }

    public function getCanAddPaymentAttribute(): bool
    {
        return $this->status !== 'cancelled' && $this->remaining_amount > 0;
    }
}