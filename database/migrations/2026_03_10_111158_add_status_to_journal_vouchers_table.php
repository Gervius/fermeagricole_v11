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
        Schema::table('journal_vouchers', function (Blueprint $table) {
            $table->enum('status', ['draft', 'posted', 'cancelled'])->default('draft')->after('date');
            $table->string('voucher_number')->nullable()->change(); // Rendre nullable pour les brouillons
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('journal_vouchers', function (Blueprint $table) {
            $table->dropColumn('status');
            $table->string('voucher_number')->nullable(false)->change();
        });
    }
};
