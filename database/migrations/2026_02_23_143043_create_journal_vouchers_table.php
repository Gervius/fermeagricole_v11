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
        Schema::create('journal_vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('voucher_number')->unique();   // Numéro de pièce comptable (ex: VT-2025-0001)
            $table->date('date');                           // Date de l'écriture
            $table->text('description')->nullable();        // Libellé général
            $table->morphs('source');                       // Lien vers l'élément source (egg_sale, etc.)
            $table->foreignId('created_by')->constrained('users'); // Utilisateur ayant généré l'écriture
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('journal_vouchers');
    }
};
