<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // SPEC 4/6.3: one row per version; each reassessment creates a new version (draft until completed).
        // Allowed values: App\Support\QuestionnaireOptions. Metric units only (SPEC 2.3).
        Schema::create('questionnaires', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version');

            // 1. About you
            $table->string('sex', 10)->nullable();
            $table->decimal('height_cm', 5, 1)->nullable();
            $table->decimal('weight_kg', 5, 2)->nullable();

            // 3. Routine
            $table->string('work_activity', 20)->nullable();

            // 4. Goal
            $table->string('goal', 20)->nullable();
            $table->string('goal_pace', 20)->nullable();

            // 5. Training (equipment and injuries: phase 8)
            $table->string('experience', 20)->nullable();
            $table->json('training_days')->nullable();
            $table->unsignedSmallInteger('session_minutes')->nullable();
            $table->string('training_location', 20)->nullable();
            $table->boolean('wants_cardio')->nullable();
            $table->string('cardio_preference', 20)->nullable();

            // 6. Diet (foods the user doesn't eat: phase 10)
            $table->json('diet_restrictions')->nullable();
            $table->unsignedTinyInteger('meals_per_day')->nullable();
            $table->string('diet_split', 20)->nullable();

            // 7. Summary
            $table->timestamp('disclaimer_accepted_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'version']);
        });

        // SPEC 5.1: answers are sensitive health data, stored encrypted. The result stays readable
        // so the app (and later the admin metrics) can tell who is blocked without decrypting.
        Schema::create('health_screenings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('questionnaire_id')->unique()->constrained()->cascadeOnDelete();
            $table->text('answers');
            $table->string('result', 10);
            $table->timestamps();
        });

        // Every change to the answers after they were first saved, with explicit confirmation.
        Schema::create('health_screening_rectifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('health_screening_id')->constrained()->cascadeOnDelete();
            $table->text('previous_answers');
            $table->text('new_answers');
            $table->string('previous_result', 10);
            $table->string('new_result', 10);
            $table->timestamp('confirmed_at');
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('health_screening_rectifications');
        Schema::dropIfExists('health_screenings');
        Schema::dropIfExists('questionnaires');
    }
};
