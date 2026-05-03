<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wheel_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wheel_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->string('image_path')->nullable();
            $table->unsignedSmallInteger('weight')->default(1);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index(['wheel_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wheel_items');
    }
};
