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
        Schema::create('flocks', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // nom du lot (ex: "Génération 2025-03")
            $table->foreignId('building_id')->constrained()->onDelete('restrict');
            $table->date('arrival_date'); // date d'arrivée
            $table->integer('initial_quantity');
            $table->decimal('purchase_cost', 15, 2)->nullable(); // coût d'achat total du lot
            $table->integer('current_quantity')->nullable(); // calculé plus tard via mortalité
            $table->enum('status', ['draft', 'pending', 'active', 'rejected', 'completed'])->default('draft');
            $table->text('notes')->nullable();
            $table->integer('eggs_produced')->default(0)->after('current_quantity');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('analytical_account_id')->nullable()->constrained('analytical_accounts'); // pour comptabilité analytique
            $table->timestamps();
            $table->softDeletes(); // pour archivage éventuel
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('flocks');
    }
};
