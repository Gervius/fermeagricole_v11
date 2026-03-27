<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceItem extends Model
{
    protected $fillable = [
        'invoice_id', 'description', 'quantity', 
        'unit_price', 'total', 'itemable_id', 'itemable_type'
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Permet de récupérer l'objet lié (soit un Flock, soit une catégorie d'oeufs)
     */
    public function itemable(): MorphTo
    {
        return $this->morphTo();
    }
}
