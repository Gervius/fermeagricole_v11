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
        Schema::create('stock_mouvements', function (Blueprint $table) {
           $table->id();
        $table->foreignId('ingredient_id')->constrained()->onDelete('cascade');
        $table->enum('type', ['in', 'out', 'adjust']);
        $table->decimal('quantity', 10, 2);
        $table->foreignId('unit_id')->constrained('units'); // unité saisie
        $table->decimal('unit_price', 10, 2)->nullable();
        $table->text('reason')->nullable();
        $table->string('supplier_name')->nullable()->after('unit_price');
        
        // Workflow d'approbation
        $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
        $table->foreignId('created_by')->constrained('users');
        $table->foreignId('approved_by')->nullable()->constrained('users');
        $table->timestamp('approved_at')->nullable();
        $table->text('rejection_reason')->nullable();
        
        $table->timestamps();

        $table->index(['ingredient_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_mouvements');
    }
};
