<?php

use App\Services\ExerciseImporter;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Loads the reviewed exercise base once per environment (production runs it in
     * deploy:finalize). After that, the admin panel is the source of truth. Tests start empty and
     * import the CSV explicitly (ExerciseTest).
     */
    public function up(): void
    {
        if (app()->runningUnitTests()) {
            return;
        }

        app(ExerciseImporter::class)->import(database_path('data/exercises.csv'));
    }

    public function down(): void
    {
        // Data stays: exercises may already have been edited in the admin.
    }
};
