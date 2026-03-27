<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('daily_records', function (Blueprint $table) {
            $table->foreignId('feed_type_id')->nullable()->constrained('recipes')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('daily_records', function (Blueprint $table) {
            $table->dropForeign(['feed_type_id']);
            $table->dropColumn(['feed_type_id']);
        });
    }
};
