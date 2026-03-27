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
        Schema::create('analytical_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journal_entry_id')->constrained()->onDelete('cascade');
            $table->foreignId('analytical_account_id')->constrained();
            $table->decimal('percentage', 5, 2)->nullable(); // % d'affectation (si partiel)
            $table->decimal('amount', 15, 2)->nullable();    // Montant fixe (alternative)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('analytical_allocations');
    }
};
