<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Account;

class AccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Basé sur le SYSCOHADA (plan simplifié pour la ferme)
        $accounts = [
            ['code' => '411100', 'name' => 'Clients ordinaires', 'type' => 'asset'],
            ['code' => '512000', 'name' => 'Banque', 'type' => 'asset'],
            ['code' => '521000', 'name' => 'Caisse', 'type' => 'asset'],
            ['code' => '521100', 'name' => 'Mobile Money (Orange/Wave)', 'type' => 'asset'],
            ['code' => '701000', 'name' => 'Ventes de produits finis', 'type' => 'revenue'],
            ['code' => '702000', 'name' => 'Ventes de réformes', 'type' => 'revenue'],
            ['code' => '601000', 'name' => 'Achats de matières premières', 'type' => 'expense'],
            ['code' => '622000', 'name' => 'Frais Vétérinaires & Soins', 'type' => 'expense'],
            ['code' => '604000', 'name' => 'Achats de cheptel (Poules)', 'type' => 'expense'],
            ['code' => '401100', 'name' => 'Fournisseurs', 'type' => 'liability'],
            ['code' => '571000', 'name' => 'Caisse', 'type' => 'asset'],
            ['code' => '581100', 'name' => 'Mobile Money (Orange)', 'type' => 'asset'],
            ['code' => '581200', 'name' => 'Mobile Money (Wave)', 'type' => 'asset'],
        ];

        foreach ($accounts as $acc) {
            Account::firstOrCreate(
                ['code' => $acc['code']],
                $acc
            );
        }
    }
}
