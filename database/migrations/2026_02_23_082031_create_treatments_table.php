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
        Schema::create('treatments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flock_id')->constrained()->onDelete('cascade');
            $table->date('treatment_date');
            $table->string('veterinarian')->nullable();
            $table->string('treatment_type')->nullable(); // vaccination, soin, etc.
            $table->text('description')->nullable();
            $table->decimal('cost', 10, 2)->nullable();
            $table->string('invoice_reference')->nullable();
            
            // Statut et approbation
            $table->enum('status', ['draft', 'approved', 'rejected'])->default('draft');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            
            $table->timestamps();
            $table->softDeletes(); // pour pouvoir supprimer les brouillons
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('treatments');
    }
};
