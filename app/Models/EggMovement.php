<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class EggMovement extends Model
{
    protected $fillable = [
        'date', 'type', 'quantity', 
        'source_id', 'source_type', 'notes', 'created_by'
    ];

    /**
     * La source peut être un DailyRecord (Entrée) ou un InvoiceItem (Sortie)
     */
    public function source(): MorphTo
    {
        return $this->morphTo();
    }
}