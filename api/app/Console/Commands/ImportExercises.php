<?php

namespace App\Console\Commands;

use App\Services\ExerciseImporter;
use Illuminate\Console\Command;
use RuntimeException;

/** Adds the exercises of a CSV that are not in the base yet (never overwrites admin edits). */
class ImportExercises extends Command
{
    protected $signature = 'exercises:import {file? : CSV path (default: database/data/exercises.csv)}';

    protected $description = 'Import new exercises from the reviewed CSV';

    public function handle(ExerciseImporter $importer): int
    {
        $file = $this->argument('file') ?? database_path('data/exercises.csv');

        try {
            $result = $importer->import($file);
        } catch (RuntimeException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info("Exercises created: {$result['created']}; already in the base: {$result['skipped']}.");

        return self::SUCCESS;
    }
}
