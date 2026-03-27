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
        Schema::create('egg_movements', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            
            // Type de mouvement pour la logique métier
            // in: Production (via DailyRecord)
            // out: Vente (via InvoiceItem)
            // loss: Œufs cassés ou invendables
            // adjust: Correction manuelle d'inventaire
            $table->enum('type', ['in', 'out', 'loss', 'adjust']);
            
            $table->integer('quantity'); // Nombre d'œufs (positif ou négatif selon le type)
            
            // Polymorphisme pour lier à la source du mouvement
            // source_type pourra être "App\Models\DailyRecord" ou "App\Models\InvoiceItem"
            $table->nullableMorphs('source'); 
            
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            // Index pour accélérer les rapports de stock par date
            $table->index(['date', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('egg_movements');
    }
};
