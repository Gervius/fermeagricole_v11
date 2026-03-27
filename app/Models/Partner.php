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

    // App\Models\Partner.php

    public function getStatement($startDate = null, $endDate = null)
    {
        // 1. Préparation de la requête des Factures (Débit)
        $invoices = DB::table('invoices')
            ->select(
                'date',
                DB::raw("CONCAT('Facture ', number) as description"),
                'total as debit',
                DB::raw('0 as credit')
            )
            ->where('partner_id', $this->id)
            ->whereNotIn('status', ['draft', 'cancelled']);

        // 2. Préparation de la requête des Paiements (Crédit)
        $payments = DB::table('payments')
            ->join('invoices', 'payments.invoice_id', '=', 'invoices.id')
            ->select(
                'payments.payment_date as date',
                DB::raw("CONCAT('Paiement facture ', invoices.number) as description"),
                DB::raw('0 as debit'),
                'payments.amount as credit'
            )
            ->where('invoices.partner_id', $this->id);

        // 3. Union des deux et filtres optionnels
        // On crée une requête de base pour pouvoir appliquer les filtres globalement
        $query = $invoices->unionAll($payments);

        // Note: Pour filtrer sur une UNION en SQL, il est parfois préférable 
        // d'encapsuler, mais ici on peut filtrer avant l'union ou via une subquery
        
        $results = DB::table(DB::raw("({$query->toSql()}) as combined"))
            ->mergeBindings($query) // Très important pour conserver les IDs et statuts
            ->orderBy('date', 'asc');

        if ($startDate) {
            $results->where('date', '>=', $startDate);
        }
        if ($endDate) {
            $results->where('date', '<=', $endDate);
        }

        $lines = $results->get();
        
        // 4. Calcul du solde progressif
        $balance = 0;
        return $lines->map(function ($line) use (&$balance) {
            $balance += ($line->debit - $line->credit);
            return [
                'date' => $line->date,
                'description' => $line->description,
                'debit' => (float) $line->debit,
                'credit' => (float) $line->credit,
                'balance' => (float) $balance,
            ];
        })->toArray();
    }

}
