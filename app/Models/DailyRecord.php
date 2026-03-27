<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use App\Observers\DailyRecordObserver;

#[ObservedBy([DailyRecordObserver::class])]
class DailyRecord extends Model
{
    protected $fillable = [
        'flock_id',
        'date',
        'losses',
        'eggs',
        'feed_type_id',
        'feed_consumed',
        'water_consumed',
        'notes',
        'status',
        'created_by',
        'approved_by',
        'approved_at',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'approved_at' => 'datetime',
        ];
    }

    public function flock(): BelongsTo
    {
        return $this->belongsTo(Flock::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function feedType(): BelongsTo
    {
        return $this->belongsTo(Recipe::class, 'feed_type_id');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Compute average feed consumed per bird (grams)
     */
    public function getAvgFeedPerBirdAttribute(): ?float
    {
        if (!$this->feed_consumed || !$this->flock || $this->flock->current_quantity <= 0) {
            return null;
        }
        // feed_consumed is in kg, convert to grams
        return round(($this->feed_consumed * 1000) / $this->flock->current_quantity, 2);
    }

    /**
     * Compute average water consumed per bird (ml)
     */
    public function getAvgWaterPerBirdAttribute(): ?float
    {
        if (!$this->water_consumed || !$this->flock || $this->flock->current_quantity <= 0) {
            return null;
        }
        // water_consumed is in liters, convert to ml
        return round(($this->water_consumed * 1000) / $this->flock->current_quantity, 2);
    }

    /**
     * Theoretical Norm (placeholder for now)
     */
    public function getTheoreticalNormAttribute(): array
    {
        // Placeholder values: e.g. 115g feed and 230ml water per bird
        return [
            'feed' => 115, // in grams
            'water' => 230, // in ml
        ];
    }

    // Vérifications
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function canBeApproved(): bool
    {
        return $this->status === 'pending';
    }

    public function canBeRejected(): bool
    {
        return $this->status === 'pending';
    }
}
