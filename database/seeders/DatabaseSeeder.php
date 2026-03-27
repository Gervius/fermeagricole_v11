<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // D'abord les permissions et rôles (indépendants)
            RoleAndPermissionSeeder::class,

            // Ensuite les données de base (comptes, bâtiments, unités)
            AccountSeeder::class,
            BuildingSeeder::class,
            UnitSeeder::class, // si vous avez un seeder pour les unités
            IngredientSeeder::class,
            AccountingRuleSeeder::class,
            // Puis les autres données si nécessaires
            // FlockSeeder::class, // (si vous voulez des lots de démo)
        ]);
    }
}