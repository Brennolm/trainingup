<?php

namespace App\Services;

use App\Models\Exercise;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Example image of an exercise (start and end positions side by side), stored on the private
 * `local` disk under exercises/ and served by ExerciseMediaController. Every file gets a new name,
 * so a new image means a new URL and files can be cached forever.
 *
 * Two sources: uploads in the admin, and the image library that ships with the code
 * (database/data/exercise-images/{slug}.jpg), copied in by syncLibrary() on every deploy.
 */
class ExerciseMedia
{
    public const DIR = 'exercises';

    /** Upload rules (size in KB). The admin shrinks images before sending. */
    public const RULES = ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:1024', 'dimensions:max_width=2000,max_height=2000'];

    /** Library files are named {slug}-lib-{content hash}.jpg; uploads get a random suffix instead. */
    private const LIBRARY_MARK = '-lib-';

    public static function disk(): Filesystem
    {
        return Storage::disk('local');
    }

    public static function libraryPath(): string
    {
        return database_path('data/exercise-images');
    }

    public function store(Exercise $exercise, UploadedFile $file): void
    {
        $extension = strtolower($file->guessExtension() ?: $file->getClientOriginalExtension());
        $name = $exercise->slug.'-'.Str::lower(Str::random(12)).'.'.$extension;

        if (self::disk()->putFileAs(self::DIR, $file, $name) === false) {
            throw new RuntimeException('Could not store the exercise image.');
        }
        $this->replace($exercise, self::DIR.'/'.$name);
    }

    public function remove(Exercise $exercise): void
    {
        $this->replace($exercise, null);
    }

    /**
     * Links each library image to its exercise. Never touches an image uploaded in the admin; an
     * image that came from the library is replaced when the library file changes.
     *
     * @return array{updated: int, kept: int, missing_exercise: list<string>}
     */
    public function syncLibrary(?string $dir = null): array
    {
        $result = ['updated' => 0, 'kept' => 0, 'missing_exercise' => []];
        foreach (glob(($dir ?? self::libraryPath()).'/*.jpg') ?: [] as $source) {
            $slug = basename($source, '.jpg');
            $exercise = Exercise::where('slug', $slug)->first();
            if (! $exercise) {
                $result['missing_exercise'][] = $slug;

                continue;
            }

            $current = $exercise->image_path;
            $hasFile = $current && self::disk()->exists($current);
            $wanted = self::DIR.'/'.$slug.self::LIBRARY_MARK.substr(hash_file('sha256', $source), 0, 12).'.jpg';
            $fromLibrary = $hasFile && str_contains(basename($current), self::LIBRARY_MARK);
            if (($hasFile && ! $fromLibrary) || $current === $wanted) {
                $result['kept']++;

                continue;
            }

            if (self::disk()->put($wanted, file_get_contents($source)) === false) {
                throw new RuntimeException("Could not store the library image of {$slug}.");
            }
            $this->replace($exercise, $wanted);
            $result['updated']++;
        }

        return $result;
    }

    public static function url(?string $path): ?string
    {
        return $path ? url('/api/exercise-media/'.basename($path)) : null;
    }

    private function replace(Exercise $exercise, ?string $path): void
    {
        $old = $exercise->image_path;
        $exercise->update(['image_path' => $path]);
        if ($old && $old !== $path) {
            self::disk()->delete($old);
        }
    }
}
