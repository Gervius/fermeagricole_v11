<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Observers\IngredientObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;

#[ObservedBy([IngredientObserver::class])]
class Ingredient extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'reference',
        'default_unit_id',
        'current_stock',
        'pmp',
        'min_stock',
        'max_stock',
        'low_stock_threshold',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'current_stock' => 'decimal:2',
            'min_stock' => 'decimal:2',
            'max_stock' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function defaultUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'default_unit_id');
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(StockMouvement::class);
    }

    public function recipes()
    {
        return $this->belongsToMany(Recipe::class, 'recipe_ingredients');
    }

    // app/Models/Ingredient.php

    public function updatePmpAfterEntry(float $quantity, float $unitPrice, Unit $unit): void
    {
        // Convertir la quantité et le prix dans l'unité par défaut de l'ingrédient
        $conversionService = app(UnitConversionService::class);
        
        $quantityInDefaultUnit = $conversionService->convert($quantity, $unit, $this->defaultUnit);
        
        // Le prix unitaire doit être exprimé dans l'unité du mouvement, mais pour le PMP on a besoin du prix dans l'unité par défaut
        // Si l'unité du mouvement est différente de l'unité par défaut, il faut aussi convertir le prix.
        // Exemple : achat de 1000 kg à 200 FCFA/kg, l'unité par défaut est la tonne (1000 kg). Le prix par tonne sera 200 * 1000 = 200 000 FCFA/tonne.
        // Plus généralement, on convertit le prix unitaire dans l'unité par défaut en multipliant par le facteur de conversion.
        $priceInDefaultUnit = $unitPrice;
        if ($unit->id !== $this->default_unit_id) {
            // Pour convertir un prix unitaire, on utilise le même facteur de conversion que pour la quantité
            $priceInDefaultUnit = $unitPrice * $conversionService->convert(1, $unit, $this->defaultUnit);
        }

        $oldValue = $this->current_stock * $this->pmp;
        $newValue = $quantityInDefaultUnit * $priceInDefaultUnit;
        $newStock = $this->current_stock + $quantityInDefaultUnit;

        if ($newStock > 0) {
            $this->pmp = ($oldValue + $newValue) / $newStock;
        }
        $this->current_stock = $newStock;
    }
}
