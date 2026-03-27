<?php

namespace App\Observers;

use App\Models\StockMouvement;
use App\Services\UnitConversionService;
use Illuminate\Support\Facades\DB;

class StockMouvementObserver
{
    protected $conversionService;

    public function __construct(UnitConversionService $conversionService)
    {
        $this->conversionService = $conversionService;
    }

    public function created(StockMouvement $movement)
    {
        // Rien à la création, car le mouvement est en pending
    }

    public function updated(StockMouvement $movement)
    {
        // Ne déclencher que si le statut passe à 'approved'
        if ($movement->wasChanged('status') && $movement->status === 'approved') {
            $this->applyMovement($movement);
        }
    }

    protected function applyMovement(StockMouvement $movement)
    {
        $ingredient = $movement->ingredient;
        $unit = $movement->unit;
        $defaultUnit = $ingredient->defaultUnit;

        // Conversion dans l'unité par défaut
        $quantityInDefaultUnit = $this->conversionService->convert(
            $movement->quantity,
            $unit,
            $defaultUnit
        );

        switch ($movement->type) {
            case 'in':
                // Entrée : mise à jour du PMP
                $priceInDefaultUnit = $movement->unit_price;
                if ($unit->id !== $defaultUnit->id && $movement->unit_price) {
                    // Convertir le prix unitaire
                    $priceInDefaultUnit = $movement->unit_price * $this->conversionService->convert(1, $unit, $defaultUnit);
                }

                $oldValue = $ingredient->current_stock * $ingredient->pmp;
                $newValue = $quantityInDefaultUnit * ($priceInDefaultUnit ?: 0);
                $newStock = $ingredient->current_stock + $quantityInDefaultUnit;

                if ($newStock > 0) {
                    $ingredient->pmp = ($oldValue + $newValue) / $newStock;
                }
                $ingredient->current_stock = $newStock;
                break;

            case 'out':
                // Sortie : on ne modifie pas le PMP, on décrémente simplement le stock
                $ingredient->current_stock -= $quantityInDefaultUnit;
                break;

            case 'adjust':
                // Ajustement : on fixe le stock à la nouvelle quantité, et on recalcule le PMP si c'est une entrée nette ?
                // Pour un ajustement, on considère que la valeur du stock est ajustée, donc on peut soit garder l'ancien PMP,
                // soit recalculer. Ici, on va simplement modifier le stock sans toucher au PMP (sauf si l'ajustement est une entrée avec prix).
                if ($movement->unit_price && $movement->unit_price > 0) {
                    // Traiter comme une entrée avec prix
                    $priceInDefaultUnit = $movement->unit_price;
                    if ($unit->id !== $defaultUnit->id) {
                        $priceInDefaultUnit = $movement->unit_price * $this->conversionService->convert(1, $unit, $defaultUnit);
                    }
                    $oldValue = $ingredient->current_stock * $ingredient->pmp;
                    $newValue = $quantityInDefaultUnit * $priceInDefaultUnit;
                    $newStock = $quantityInDefaultUnit; // On remplace le stock

                    if ($newStock > 0) {
                        $ingredient->pmp = ($oldValue + $newValue) / $newStock;
                    } else {
                        $ingredient->pmp = 0;
                    }
                    $ingredient->current_stock = $newStock;
                } else {
                    // Ajustement sans prix : on remplace juste la quantité, le PMP reste inchangé
                    $ingredient->current_stock = $quantityInDefaultUnit;
                }
                break;
        }

        $ingredient->save();
    }
}