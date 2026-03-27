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
        Schema::table('invoices', function (Blueprint $table) {
            // On ajoute un type pour différencier Achat et Vente (SYSCOHADA)
            $table->enum('type', ['sale', 'purchase'])->default('sale')->after('number');
        });

        Schema::table('flocks', function (Blueprint $table) {
            // Un lot (génération) acheté chez un fournisseur (Partner)
            $table->foreignId('supplier_id')->nullable()->constrained('partners')->onDelete('set null')->after('building_id');
            // Facture d'achat générée automatiquement
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->onDelete('set null')->after('supplier_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('flocks', function (Blueprint $table) {
            $table->dropForeign(['invoice_id']);
            $table->dropForeign(['supplier_id']);
            $table->dropColumn(['invoice_id', 'supplier_id']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
