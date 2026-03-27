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
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();        // Numéro de compte (ex: 512, 701)
            $table->string('name');                       // Intitulé du compte
            $table->enum('type', [
                'asset', 'liability', 'equity', 'revenue', 'expense'
            ])->default('asset');                          // Nature du compte
            $table->boolean('is_active')->default(true);   // Actif ou désactivé
            $table->timestamps();
        });
    
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
