<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AnalyticalAccount extends Model
{
    protected $fillable = ['code', 'name', 'target_id', 'target_type', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function target(): MorphTo
    {
        return $this->morphTo();
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(AnalyticalAllocation::class);
    }
}
