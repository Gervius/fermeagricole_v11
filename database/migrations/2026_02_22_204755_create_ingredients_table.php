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
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // ex: Maïs, Soja, etc.
            $table->string('reference')->nullable(); // code interne
            $table->foreignId('default_unit_id')->constrained('units'); // unité de stock par défaut
            $table->decimal('current_stock', 10, 2)->default(0); // stock actuel dans l'unité par défaut
            $table->decimal('min_stock', 10, 2)->nullable(); // seuil d'alerte
            $table->decimal('max_stock', 10, 2)->nullable(); // capacité max
            $table->decimal('low_stock_threshold', 10, 2); // seuil de pénurie
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ingredients');
    }
};
