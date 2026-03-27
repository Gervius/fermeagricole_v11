<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Model;

class JournalVoucher extends Model
{
    protected $fillable = [
        'voucher_number',
        'date',
        'status',
        'description',
        'source_id',
        'source_type',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    public function entries(): HasMany
    {
        return $this->hasMany(JournalEntry::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public static function generateVoucherNumber(): string
    {
        $year = date('Y');
        $month = date('m');
        
        // On cherche le dernier numéro pour ce mois parmi ceux qui ONT un numéro (posted)
        $last = self::whereNotNull('voucher_number')
                    ->where('voucher_number', 'like', "VT-{$year}{$month}-%")
                    ->orderBy('voucher_number', 'desc')
                    ->first();
                    
        $nextNumber = $last ? (int) substr($last->voucher_number, -4) + 1 : 1;
        return 'VT-' . $year . $month . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }
    
}
