<?php

namespace App\Console\Commands;

use App\Services\ExerciseMedia;
use Illuminate\Console\Command;

/** Runs on every deploy (deploy:finalize); never overwrites an image uploaded in the admin. */
class ExerciseImages extends Command
{
    protected $signature = 'exercises:images';

    protected $description = 'Link the exercise images that ship with the code (database/data/exercise-images) to the exercises';

    public function handle(ExerciseMedia $media): int
    {
        $result = $media->syncLibrary();
        $this->info("Exercise images: {$result['updated']} updated, {$result['kept']} kept.");
        foreach ($result['missing_exercise'] as $slug) {
            $this->warn("No exercise with slug {$slug}.");
        }

        return self::SUCCESS;
    }
}
