<?php

namespace App\Http\Controllers;

use App\Services\ExerciseMedia;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Serves an exercise image. Public (not personal data; <img> loads it without the session), cached
 * for a year because every new image gets a new name.
 */
class ExerciseMediaController extends Controller
{
    public function __invoke(string $file): BinaryFileResponse
    {
        abort_unless(preg_match('/^[a-z0-9-]+\.(jpe?g|png|webp)$/', $file), 404);

        $path = ExerciseMedia::DIR.'/'.$file;
        abort_unless(ExerciseMedia::disk()->exists($path), 404);

        return response()->file(ExerciseMedia::disk()->path($path), [
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }
}
