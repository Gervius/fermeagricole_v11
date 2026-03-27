<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->string('name'); 
            $table->string('symbol'); // ex: kg, g, L, mL, etc.
            $table->string('type')->default('poids'); // mass, volume, unit
            $table->decimal('conversion_factor', 10, 4)->nullable(); // facteur de conversion vers l'unité de base
            $table->foreignId('base_unit_id')->nullable()->constrained('units'); // unité de base (ex: kg pour g)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
