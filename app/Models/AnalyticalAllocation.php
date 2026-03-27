<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnalyticalAllocation extends Model
{
    public $timestamps = false;

    protected $fillable = ['journal_entry_id', 'analytical_account_id', 'percentage', 'amount'];

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class);
    }

    public function analyticalAccount():BelongsTo
    {
        return $this->belongsTo(AnalyticalAccount::class);
    }
}
