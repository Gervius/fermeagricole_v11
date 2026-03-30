<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('workflow_step_id')->nullable()->constrained('workflow_steps')->nullOnDelete();
        });

        // Using string for enum emulation:
        Schema::table('invoices', function (Blueprint $table) {
            // Drop old status
            $table->dropColumn('status');
        });

        Schema::table('invoices', function (Blueprint $table) {
            // Re-add as string to simulate enum ('draft', 'pending_approval', 'approved', 'rejected', 'issued', 'paid', 'cancelled')
            $table->string('status')->default('draft');
            $table->string('number')->nullable()->change(); // number is generated later
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['workflow_step_id']);
            $table->dropColumn('workflow_step_id');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->enum('status', ['draft', 'sent', 'cancelled'])->default('draft');
            $table->string('number')->nullable(false)->change();
        });
    }
};
