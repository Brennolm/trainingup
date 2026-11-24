<?php

namespace App\Console\Commands;

use App\Services\ExerciseImageGenerator;
use App\Services\ExerciseMedia;
use Illuminate\Console\Command;
use Throwable;

/**
 * Local tool: generates the missing exercise images with the OpenAI API (it costs money: about
 * US$ 0.06 per image at medium quality) and links them to their exercises (same as exercises:images).
 */
class GenerateExerciseImages extends Command
{
    protected $signature = 'exercises:generate-images
        {slugs?* : Only these exercises (default: all without an image in the library)}
        {--quality=medium : low, medium or high}
        {--force : Generate again even when the library already has the image}
        {--dry-run : Only print the prompts, without calling the API}';

    protected $description = 'Generates the exercise images (start and end positions) with the OpenAI API';

    public function handle(ExerciseImageGenerator $generator, ExerciseMedia $media): int
    {
        $quality = (string) $this->option('quality');
        if (! in_array($quality, ExerciseImageGenerator::QUALITIES, true)) {
            $this->error('Quality must be low, medium or high.');

            return self::FAILURE;
        }

        $specs = $generator->specs();
        $slugs = $this->argument('slugs') ?: array_keys($specs);
        if ($unknown = array_diff($slugs, array_keys($specs))) {
            $this->error('Unknown exercises: '.implode(', ', $unknown).'.');

            return self::FAILURE;
        }

        $library = $generator->library();
        $todo = array_values(array_filter(
            $slugs,
            fn ($slug) => $this->option('force') || ! file_exists("{$library}/{$slug}.jpg"),
        ));

        if ($this->option('dry-run')) {
            foreach ($todo as $slug) {
                $this->line("== {$slug}");
                $this->line($generator->prompt($specs[$slug]));
            }
            $this->info(count($todo).' prompts.');

            return self::SUCCESS;
        }

        $failed = [];
        foreach ($todo as $i => $slug) {
            $this->line(sprintf('[%d/%d] %s', $i + 1, count($todo), $slug));
            try {
                $generator->generate($slug, $specs[$slug], $quality);
            } catch (Throwable $e) {
                $failed[] = $slug;
                $this->warn("  {$e->getMessage()}");
            }
        }

        $this->info(sprintf('Generated %d, failed %d.', count($todo) - count($failed), count($failed)));
        if ($failed) {
            $this->warn('Failed: '.implode(' ', $failed));
        }
        $sync = $media->syncLibrary($library);
        $this->info(sprintf('Exercise images: %d updated, %d kept.', $sync['updated'], $sync['kept']));

        return $failed ? self::FAILURE : self::SUCCESS;
    }
}
