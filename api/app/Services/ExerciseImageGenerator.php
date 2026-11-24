<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Generates the example image of an exercise (start and end positions side by side) with the
 * OpenAI images API, editing the official base photo (our gym and our model). Local tool only:
 * the API key lives in the local .env and the images go to the library that ships with the code
 * (ExerciseMedia::libraryPath()).
 *
 * The technique of each exercise is in database/data/exercise-image-specs.json:
 * {slug: {name, scene, view, start, end, rule, checks}}; `checks` is what the reviewer
 * confirms (pt-BR), not sent to the API. `end` is the movement that leads to the end
 * position, written as a verb phrase ("lowers the bar to the chest").
 */
class ExerciseImageGenerator
{
    public const ENDPOINT = 'https://api.openai.com/v1/images/edits';

    public const MODEL = 'gpt-image-2';

    public const QUALITIES = ['low', 'medium', 'high'];

    private const VIEWS = [
        'side' => 'both seen in side profile',
        'three-quarter' => 'both seen at a three-quarter angle',
        'front' => 'both facing the camera',
    ];

    public static function specsPath(): string
    {
        return database_path('data/exercise-image-specs.json');
    }

    public static function basePhoto(): string
    {
        return base_path('../docs/brand/academia/modelo-oficial-maos-vazias.png');
    }

    /** Where the images are saved: the library that ships with the code. */
    public function library(): string
    {
        return ExerciseMedia::libraryPath();
    }

    /** @return array<string, array{name: string, scene: ?string, view: string, start: string, end: string, rule: ?string, checks: string}> */
    public function specs(): array
    {
        return json_decode((string) file_get_contents(self::specsPath()), true, flags: JSON_THROW_ON_ERROR);
    }

    /** @param array{name: string, scene: ?string, view: string, start: string, end: string, rule: ?string, checks: string} $spec */
    public function prompt(array $spec): string
    {
        $lines = [
            'Edit the attached photo. Keep exactly the same gym: same wall, same TRAINING UP logo fully visible and uncovered, same lighting, same floor. Keep the same man: same face, hair, beard, body and skin tone, plain black t-shirt, plain black shorts, white sneakers, no watch, no logos.',
            'Show the same man TWICE, side by side below the logo, same size, full body visible, '.self::VIEWS[$spec['view']].', performing '.(preg_match('/^(?!one)[aeiou]/i', $spec['name']) ? 'an' : 'a')." {$spec['name']}.",
            $spec['scene']
                ? "Equipment: {$spec['scene']}. Each figure has his own identical equipment."
                : 'Equipment: only what the positions below describe; otherwise his hands are empty.',
            "- LEFT figure (starting position): {$spec['start']}.",
            '- RIGHT figure (end position): same setup, frozen at the end of this movement: '
                .(str_starts_with($spec['end'], 'his ') ? '' : 'he ')."{$spec['end']}.",
        ];
        if ($spec['rule']) {
            $lines[] = "Technique: {$spec['rule']}";
        }
        $lines[] = 'Realistic gym equipment and correct exercise technique. Nothing covers the logo.';
        $lines[] = 'Photorealistic, square 1:1, no text, no arrows, no labels.';

        return implode("\n", $lines);
    }

    /**
     * Generates the image and saves it as {library}/{slug}.jpg. Returns the saved path.
     *
     * @param  array{name: string, scene: ?string, view: string, start: string, end: string, rule: ?string, checks: string}  $spec
     */
    public function generate(string $slug, array $spec, string $quality): string
    {
        $key = config('services.openai.key');
        if (! $key) {
            throw new RuntimeException('OPENAI_API_KEY is not set.');
        }

        $response = Http::withToken($key)
            ->timeout(300)
            ->attach('image[]', (string) file_get_contents(self::basePhoto()), 'base.png', ['Content-Type' => 'image/png'])
            ->post(self::ENDPOINT, [
                'model' => self::MODEL,
                'prompt' => $this->prompt($spec),
                'size' => '1024x1024',
                'quality' => $quality,
                'n' => 1,
            ]);
        if ($response->failed()) {
            throw new RuntimeException('OpenAI error '.$response->status().': '.$response->json('error.message', 'no message'));
        }

        $image = @imagecreatefromstring((string) base64_decode((string) $response->json('data.0.b64_json'), true));
        if (! $image) {
            throw new RuntimeException('OpenAI returned no readable image.');
        }

        $path = $this->library()."/{$slug}.jpg";
        $saved = imagejpeg($image, $path, 85);
        imagedestroy($image);
        if (! $saved) {
            throw new RuntimeException("Could not save {$path}.");
        }

        return $path;
    }
}
