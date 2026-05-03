<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wheels', function (Blueprint $table) {
            $table->string('hub_style', 16)->default('classic');
            $table->string('pointer_style', 16)->default('classic');
            $table->string('peg_style', 16)->default('dots');
        });
    }

    public function down(): void
    {
        Schema::table('wheels', function (Blueprint $table) {
            $table->dropColumn(['hub_style', 'pointer_style', 'peg_style']);
        });
    }
};
