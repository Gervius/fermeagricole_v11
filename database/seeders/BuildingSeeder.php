<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Building;

class BuildingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         Building::insert([
            ['name' => 'Poulailler Principal', 'capacity' => 10000],
            ['name' => 'Poulailler Secondaire', 'capacity' => 5000],
        ]);
    }
}
