<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Ingredient;
use App\Models\Unit;

class IngredientSeeder extends Seeder
{
    public function run(): void
    {
        $kg = Unit::where('symbol', 'kg')->first()->id;
        $g = Unit::where('symbol', 'g')->first()->id;
        $L = Unit::where('symbol', 'L')->first()->id;
        $u = Unit::where('symbol', 'u')->first()->id;

        $ingredients = [
            [
                'name' => 'Maïs grain',
                'reference' => 'MAT-001',
                'default_unit_id' => $kg,
                'current_stock' => 5000,
                'min_stock' => 1000,
                'max_stock' => 10000,
                'low_stock_threshold' => 1000,
                'pmp' => 250,
                'description' => 'Maïs jaune, matière première de base',
                'is_active' => true,
            ],
            [
                'name' => 'Soja',
                'reference' => 'MAT-002',
                'default_unit_id' => $kg,
                'current_stock' => 3000,
                'min_stock' => 800,
                'max_stock' => 8000,
                'low_stock_threshold' => 800,
                'pmp' => 400,
                'description' => 'Tourteau de soja, source de protéines',
                'is_active' => true,
            ],
            [
                'name' => 'Calcaire',
                'reference' => 'MAT-003',
                'default_unit_id' => $kg,
                'current_stock' => 1500,
                'min_stock' => 500,
                'max_stock' => 3000,
                'low_stock_threshold' => 500,
                'pmp' => 50,
                'description' => 'Calcaire broyé, source de calcium',
                'is_active' => true,
            ],
            [
                'name' => 'Prémix pondeuse',
                'reference' => 'MAT-004',
                'default_unit_id' => $kg,
                'current_stock' => 500,
                'min_stock' => 200,
                'max_stock' => 1000,
                'low_stock_threshold' => 200,
                'pmp' => 1500,
                'description' => 'Complément minéral et vitaminique',
                'is_active' => true,
            ],
            [
                'name' => 'Huile végétale',
                'reference' => 'MAT-005',
                'default_unit_id' => $L,
                'current_stock' => 800,
                'min_stock' => 200,
                'max_stock' => 1500,
                'low_stock_threshold' => 200,
                'pmp' => 800,
                'description' => 'Huile de soja, source d’énergie',
                'is_active' => true,
            ],
            [
                'name' => 'Lysine',
                'reference' => 'MAT-006',
                'default_unit_id' => $g,
                'current_stock' => 20000,
                'min_stock' => 5000,
                'max_stock' => 50000,
                'low_stock_threshold' => 5000,
                'pmp' => 10,
                'description' => 'Acide aminé essentiel',
                'is_active' => true,
            ],
            [
                'name' => 'Méthionine',
                'reference' => 'MAT-007',
                'default_unit_id' => $g,
                'current_stock' => 15000,
                'min_stock' => 4000,
                'max_stock' => 40000,
                'low_stock_threshold' => 4000,
                'pmp' => 12,
                'description' => 'Acide aminé soufré',
                'is_active' => true,
            ],
            [
                'name' => 'Phosphate bicalcique',
                'reference' => 'MAT-008',
                'default_unit_id' => $kg,
                'current_stock' => 2000,
                'min_stock' => 600,
                'max_stock' => 5000,
                'low_stock_threshold' => 600,
                'pmp' => 350,
                'description' => 'Source de phosphore et calcium',
                'is_active' => true,
            ],
            [
                'name' => 'Sel',
                'reference' => 'MAT-009',
                'default_unit_id' => $kg,
                'current_stock' => 1000,
                'min_stock' => 300,
                'max_stock' => 2000,
                'low_stock_threshold' => 300,
                'pmp' => 100,
                'description' => 'Chlorure de sodium',
                'is_active' => true,
            ],
        ];

        foreach ($ingredients as $ingredient) {
            Ingredient::firstOrCreate(
                ['name' => $ingredient['name']],
                $ingredient
            );
        }

        $this->command->info('Ingrédients créés avec succès.');
    }
}