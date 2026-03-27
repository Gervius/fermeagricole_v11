<?php

namespace App\Services;

use App\Models\Unit;
use InvalidArgumentException;

class UnitConversionService
{
    /**
     * Convertit une quantité d'une unité source vers une unité cible.
     *
     * @param float $quantity
     * @param Unit $fromUnit
     * @param Unit $toUnit
     * @return float
     * @throws InvalidArgumentException si les unités ne sont pas compatibles
     */
    public function convert(float $quantity, Unit $fromUnit, Unit $toUnit): float
    {
        if ($fromUnit->id === $toUnit->id) {
            return $quantity;
        }

        // Vérifier que les unités sont du même type
        if ($fromUnit->type !== $toUnit->type) {
            throw new InvalidArgumentException(
                "Impossible de convertir entre des unités de types différents : {$fromUnit->type} -> {$toUnit->type}"
            );
        }

        // Convertir l'unité source vers l'unité de base
        $quantityInBase = $this->toBaseUnit($quantity, $fromUnit);

        // Convertir de l'unité de base vers l'unité cible
        return $this->fromBaseUnit($quantityInBase, $toUnit);
    }

    /**
     * Convertit une quantité d'une unité donnée vers son unité de base.
     *
     * @param float $quantity
     * @param Unit $unit
     * @return float
     */
    private function toBaseUnit(float $quantity, Unit $unit): float
    {
        if (!$unit->base_unit_id) {
            // L'unité est déjà une unité de base
            return $quantity;
        }

        // Appliquer le facteur de conversion
        return $quantity * $unit->conversion_factor;
    }

    /**
     * Convertit une quantité depuis l'unité de base vers une unité dérivée.
     *
     * @param float $quantityInBase
     * @param Unit $unit
     * @return float
     */
    private function fromBaseUnit(float $quantityInBase, Unit $unit): float
    {
        if (!$unit->base_unit_id) {
            // L'unité est déjà une unité de base
            return $quantityInBase;
        }

        // Inverser le facteur de conversion
        return $quantityInBase / $unit->conversion_factor;
    }

    /**
     * Vérifie si deux unités sont compatibles (même type et partagent une base commune).
     *
     * @param Unit $unit1
     * @param Unit $unit2
     * @return bool
     */
    public function areCompatible(Unit $unit1, Unit $unit2): bool
    {
        if ($unit1->type !== $unit2->type) {
            return false;
        }

        // Trouver l'unité de base pour chaque unité
        $base1 = $this->getBaseUnit($unit1);
        $base2 = $this->getBaseUnit($unit2);

        return $base1->id === $base2->id;
    }

    /**
     * Retourne l'unité de base d'une unité (remonte la chaîne jusqu'à l'unité sans base).
     *
     * @param Unit $unit
     * @return Unit
     */
    private function getBaseUnit(Unit $unit): Unit
    {
        while ($unit->base_unit_id) {
            $unit = $unit->baseUnit;
            if (!$unit) {
                throw new InvalidArgumentException("La chaîne de conversion est rompue pour l'unité ID {$unit->id}");
            }
        }
        return $unit;
    }
}