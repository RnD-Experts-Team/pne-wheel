<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wheels', function (Blueprint $table) {
            // JSON column storing user-defined colors when theme === 'custom'.
            // Shape: { accent, rim, pointer, sliceColors: string[], textColor }
            $table->json('custom_palette')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('wheels', function (Blueprint $table) {
            $table->dropColumn('custom_palette');
        });
    }
};
