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
        Schema::table('flocks', function (Blueprint $table) {
            // Colonne pour la raison de fin (vente, mortalité, etc.)
            $table->date('sale_date')->nullable()->after('ended_at');
            $table->decimal('sale_price', 15, 2)->nullable()->after('sale_date');
            $table->string('sale_customer')->nullable()->after('sale_price');
            $table->string('sale_invoice_ref')->nullable()->after('sale_customer');
            $table->enum('end_reason', ['sale', 'mortality', 'disease', 'other'])->nullable()->after('notes');
            // Colonne pour la date de fin du lot
            $table->datetime('ended_at')->nullable()->after('end_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('flocks', function (Blueprint $table) {
            $table->dropColumn(['end_reason', 'ended_at' ]);
        });
    }
};
