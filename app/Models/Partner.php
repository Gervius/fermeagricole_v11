<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Payment;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\DB;

class Partner extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'type',
        'phone',
        'email',
        'address',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function getBalanceAttribute(): float
    {
        // Solde client : Total facturé (non annulé) - Total payé
        $totalInvoiced = $this->invoices()
            ->where('status', '!=', 'cancelled')
            ->sum('total');
            
        $totalPaid = Payment::whereHas('invoice', function ($query) {
                $query->where('partner_id', $this->id)
                      ->where('status', '!=', 'cancelled');
            })->sum('amount');

        return $totalInvoiced - $totalPaid;
    }

    public function getStatement($startDate = null, $endDate = null)
    {
        $query = DB::table(function ($query) {
            // Factures (débit client)
            $query->from('invoices')
                ->select(
                    'date',
                    DB::raw("CONCAT('Facture ', number) as description"),
                    'total as debit',
                    DB::raw('0 as credit'),
                    'total as amount'
                )
                ->where('partner_id', $this->id)
                ->whereNotIn('status', ['draft', 'cancelled']);
        })->unionAll(
            // Paiements (crédit client)
            \DB::table('payments')
                ->join('invoices', 'payments.invoice_id', '=', 'invoices.id')
                ->select(
                    'payments.payment_date as date',
                    DB::raw("CONCAT('Paiement facture ', invoices.number) as description"),
                    DB::raw('0 as debit'),
                    'payments.amount as credit',
                    DB::raw('-payments.amount as amount')
                )
                ->where('invoices.partner_id', $this->id)
        )->orderBy('date');

        if ($startDate) {
            $query->where('date', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('date', '<=', $endDate);
        }

        $lines = $query->get();
        $balance = 0;
        $result = [];
        foreach ($lines as $line) {
            $balance += ($line->debit - $line->credit);
            $result[] = [
                'date' => $line->date,
                'description' => $line->description,
                'debit' => $line->debit,
                'credit' => $line->credit,
                'balance' => $balance,
            ];
        }
        return $result;
    }

}
