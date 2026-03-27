<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Recipe extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'yield',
        'unit_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'yield' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function ingredients()
    {
        return $this->belongsToMany(Ingredient::class, 'recipe_ingredients')
            ->withPivot('quantity', 'unit_id')
            ->withTimestamps();
    }

    public function productions(): HasMany
    {
        return $this->hasMany(FeedProduction::class);
    }
}
