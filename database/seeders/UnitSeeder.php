<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Unit;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            ['name' => 'Kilogramme', 'symbol' => 'kg', 'type' => 'mass', 'conversion_factor' => 1, 'base_unit_id' => null],
            ['name' => 'Gramme', 'symbol' => 'g', 'type' => 'mass', 'conversion_factor' => 0.001, 'base_unit_id' => 1],
            ['name' => 'Litre', 'symbol' => 'L', 'type' => 'volume', 'conversion_factor' => 1, 'base_unit_id' => null],
            ['name' => 'Millilitre', 'symbol' => 'mL', 'type' => 'volume', 'conversion_factor' => 0.001, 'base_unit_id' => 3],
            ['name' => 'Unité', 'symbol' => 'u', 'type' => 'unit', 'conversion_factor' => 1, 'base_unit_id' => null],
            ['name' => 'Plateau (30 œufs)', 'symbol' => 'plt', 'type' => 'unit', 'conversion_factor' => 30, 'base_unit_id' => 5],
        ];

        foreach ($units as $unit) {
            Unit::firstOrCreate(
                ['symbol' => $unit['symbol']],
                $unit
            );
        }
    }
}