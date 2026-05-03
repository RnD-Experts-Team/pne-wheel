<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wheels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('brand_name')->nullable();
            $table->string('brand_logo_path')->nullable();
            $table->string('address')->nullable();
            $table->string('theme', 32)->default('dark');
            $table->string('brand_color', 9)->nullable();
            $table->unsignedSmallInteger('number_of_fields')->nullable();
            $table->boolean('sound_enabled')->default(true);
            $table->boolean('confetti_enabled')->default(true);
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wheels');
    }
};
