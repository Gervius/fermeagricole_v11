<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountingRuleLine extends Model
{
    protected $fillable = [
        'accounting_rule_id',
        'type',
        'account_resolution_type',
        'account_id',
        'dynamic_account_placeholder',
        'amount_source',
        'percentage',
        'description_template',
        'analytical_target_source',
    ];

    protected function casts(): array
    {
        return [
            'percentage' => 'decimal:2',
        ];
    }

    public function rule(): BelongsTo
    {
        return $this->belongsTo(AccountingRule::class, 'accounting_rule_id');
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }
}
