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
        Schema::create('accounting_rule_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('accounting_rule_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['debit', 'credit']); // type d'opération
            $table->enum('account_resolution_type', ['fixed', 'dynamic']); // Est-ce un compte en dur ou calculé dynamiquement
            $table->foreignId('account_id')->nullable()->constrained('accounts'); // Si "fixed", ID du compte SYSCOHADA (ex: 4111)
            $table->string('dynamic_account_placeholder')->nullable(); // Si "dynamic", placeholder (ex: partner_account, payment_method_account)
            $table->string('amount_source'); // ex: total_ht, tax_amount, total_ttc, amount
            $table->decimal('percentage', 5, 2)->default(100); // 100% de amount_source par défaut
            $table->string('description_template')->nullable(); // "Vente {{number}}"
            $table->string('analytical_target_source')->nullable(); // (Optionnel) flock, building
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounting_rule_lines');
    }
};
