<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use App\Observers\FlockObserver;

#[ObservedBy([FlockObserver::class])]
class Flock extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'building_id',
        'supplier_id',
        'invoice_id',
        'arrival_date',
        'initial_quantity',
        'purchase_cost',
        'current_quantity',
        'status',
        'standard_mortality_rate',
        'notes',
        'end_reason',
        'ended_at',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'arrival_date' => 'date',
        'approved_at' => 'datetime',
        'ended_at' => 'datetime',
        'purchase_cost' => 'decimal:2',
        'standard_mortality_rate' => 'decimal:2',
    ];

    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Partner::class, 'supplier_id');
    }

    public function purchaseInvoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }

    public function dailyRecords(): HasMany
    {
        return $this->hasMany(DailyRecord::class);
    }

    public function treatments(): HasMany
    {
        return $this->hasMany(Treatment::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function applySale(FlockSale $sale): void
    {
        if ($sale->status !== 'approved') {
            throw new \Exception('Seules les ventes approuvées peuvent être appliquées.');
        }

        $newQuantity = $this->current_quantity - $sale->quantity;
        if ($newQuantity < 0) {
            throw new \Exception('La quantité vendue dépasse l\'effectif actuel.');
        }

        $this->current_quantity = $newQuantity;

        // Si l'effectif devient nul, terminer le lot
        if ($this->current_quantity == 0) {
            $this->status = 'completed';
            $this->ended_at = now();
            $this->end_reason = 'sale';
        }

        $this->save();
    }

    

    // Vérifier si une vente est possible
    public function canSell(int $quantity): bool
    {
        return $this->status === 'active' && $this->calculated_quantity >= $quantity;
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Scope pour les statuts
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active')->whereNull('ended_at');
    }

    // Scope pour les lots actifs (status = 'active' et pas terminés)
    public function scopeActiveOnly($query)
    {
        return $query->where('status', 'active')->whereNull('ended_at');
    }

    // Vérifie si le lot est modifiable (brouillon ou rejeté)
    public function isEditable(): bool
    {
        return in_array($this->status, ['draft', 'rejected']);
    }

    // Vérifie si le lot peut être soumis pour approbation
    public function canBeSubmitted(): bool
    {
        return $this->status === 'draft' || $this->status === 'rejected';
    }

    // Vérifie si le lot peut être approuvé
    public function canBeApproved(): bool
    {
        return $this->status === 'pending';
    }

    // Vérifie si le lot peut être rejeté
    public function canBeRejected(): bool
    {
        return $this->status === 'pending';
    }

    // Vérifie si le lot peut être supprimé (seulement brouillon)
    public function canBeDeleted(): bool
    {
        return $this->status === 'draft';
    }

    // Vérifie si le lot peut être terminé (seulement actif et pas déjà terminé)
    public function canBeEnded(): bool
    {
        return $this->status === 'active' && !$this->ended_at;
    }

    // Vérifie si le lot est actif et pas terminé
    public function isActiveAndRunning(): bool
    {
        return $this->status === 'active' && !$this->ended_at;
    }

    public function invoiceItems(): MorphMany
    {
        // Un lot peut apparaître sur plusieurs lignes de factures (ventes partielles)
        return $this->morphMany(InvoiceItem::class, 'itemable');
    }

    /**
     * Calcul dynamique de l'effectif actuel basé sur l'achat initial et les ventes/pertes
     * C'est plus sûr que de stocker une colonne current_quantity qui peut se désynchroniser.
     */
    public function getCalculatedQuantityAttribute(): int
    {
        $salesCount = $this->invoiceItems()->sum('quantity');
        $lossesCount = $this->dailyRecords()->sum('losses');
        
        return $this->initial_quantity - ($salesCount + $lossesCount);
    }
}
