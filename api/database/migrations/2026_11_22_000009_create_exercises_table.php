<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // SPEC 4 (Treino): exercise base, edited in the admin. Names are content in pt-BR.
        Schema::create('exercises', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 120)->unique();
            $table->string('name', 120);
            $table->string('primary_muscle', 30)->index();
            $table->json('secondary_muscles');
            $table->string('movement_pattern', 30)->index();
            $table->json('equipment');
            $table->string('level', 20);
            $table->json('contraindications');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exercises');
    }
};
