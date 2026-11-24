<?php

namespace Tests\Feature;

use App\Models\Exercise;
use App\Services\ExerciseImageGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class GenerateExerciseImagesTest extends TestCase
{
    use RefreshDatabase;

    private string $library;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        config(['services.openai.key' => 'test-key']);

        Exercise::create([
            'slug' => 'prancha',
            'name' => 'Prancha',
            'primary_muscle' => 'abs',
            'secondary_muscles' => [],
            'movement_pattern' => 'core',
            'equipment' => [],
            'level' => 'beginner',
            'contraindications' => [],
        ]);

        // A throwaway library instead of database/data/exercise-images.
        $this->library = storage_path('framework/testing/generated-images-'.uniqid());
        File::ensureDirectoryExists($this->library);
        $this->app->bind(ExerciseImageGenerator::class, fn () => new class($this->library) extends ExerciseImageGenerator
        {
            public function __construct(private string $dir) {}

            public function library(): string
            {
                return $this->dir;
            }
        });
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->library);
        parent::tearDown();
    }

    private function fakeImage(): string
    {
        $image = imagecreatetruecolor(8, 8);
        ob_start();
        imagepng($image);

        return base64_encode((string) ob_get_clean());
    }

    public function test_every_catalog_exercise_has_a_spec(): void
    {
        $generator = new ExerciseImageGenerator;
        $specs = $generator->specs();
        $slugs = array_map(
            fn ($line) => explode(';', $line)[0],
            array_slice(file(database_path('data/exercises.csv'), FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES), 1),
        );
        $slugs[0] = ltrim($slugs[0], "\u{FEFF}");

        $this->assertEqualsCanonicalizing($slugs, array_keys($specs));
        foreach ($specs as $slug => $spec) {
            $this->assertNotSame('', $spec['start'], $slug);
            $this->assertNotSame('', $spec['end'], $slug);
            $this->assertContains($spec['view'], ['side', 'three-quarter', 'front'], $slug);
            $this->assertStringNotContainsString('clip', $generator->prompt($spec), $slug);
        }
    }

    public function test_prompt_has_both_positions_equipment_and_rule(): void
    {
        $prompt = (new ExerciseImageGenerator)->prompt([
            'name' => 'push-up',
            'scene' => null,
            'view' => 'side',
            'start' => 'in a high plank',
            'end' => 'lowers the chest to the floor',
            'rule' => 'The hips never sag.',
        ]);

        $this->assertStringContainsString('performing a push-up', $prompt);
        $this->assertStringContainsString('side profile', $prompt);
        $this->assertStringContainsString('Equipment: only what the positions below describe; otherwise his hands are empty.', $prompt);
        $this->assertStringContainsString('LEFT figure (starting position): in a high plank.', $prompt);
        $this->assertStringContainsString('the end of this movement: he lowers the chest to the floor.', $prompt);
        $this->assertStringContainsString('Technique: The hips never sag.', $prompt);
        $this->assertStringContainsString('TRAINING UP logo', $prompt);
    }

    public function test_dry_run_prints_prompts_without_calling_the_api(): void
    {
        Http::fake();
        File::put("{$this->library}/flexao.jpg", 'already there');

        $this->artisan('exercises:generate-images', ['slugs' => ['prancha', 'flexao'], '--dry-run' => true])
            ->expectsOutput('== prancha')
            ->doesntExpectOutput('== flexao')
            ->expectsOutput('1 prompts.')
            ->assertSuccessful();
        Http::assertNothingSent();
    }

    public function test_generates_missing_images_and_links_them(): void
    {
        Http::fake([ExerciseImageGenerator::ENDPOINT => Http::response(['data' => [['b64_json' => $this->fakeImage()]]])]);

        $this->artisan('exercises:generate-images', ['slugs' => ['prancha']])
            ->expectsOutput('[1/1] prancha')
            ->expectsOutput('Generated 1, failed 0.')
            ->expectsOutput('Exercise images: 1 updated, 0 kept.')
            ->assertSuccessful();

        Http::assertSent(fn (Request $request) => $request->url() === ExerciseImageGenerator::ENDPOINT
            && $request->hasHeader('Authorization', 'Bearer test-key')
            && collect($request->data())->contains(fn ($part) => $part['name'] === 'quality' && $part['contents'] === 'medium')
            && collect($request->data())->contains(fn ($part) => $part['name'] === 'image[]'));

        $this->assertSame(IMAGETYPE_JPEG, getimagesize("{$this->library}/prancha.jpg")[2]);
        $this->assertStringContainsString('prancha-lib-', Exercise::where('slug', 'prancha')->first()->image_path);

        // Already in the library: skipped unless --force.
        $this->artisan('exercises:generate-images', ['slugs' => ['prancha']])->expectsOutput('Generated 0, failed 0.');
        Http::assertSentCount(1);
        $this->artisan('exercises:generate-images', ['slugs' => ['prancha'], '--force' => true, '--quality' => 'high'])
            ->assertSuccessful();
        Http::assertSentCount(2);
    }

    public function test_api_errors_are_reported_and_the_command_fails(): void
    {
        Http::fake([ExerciseImageGenerator::ENDPOINT => Http::response(['error' => ['message' => 'Billing hard limit reached']], 400)]);

        $this->artisan('exercises:generate-images', ['slugs' => ['prancha']])
            ->expectsOutput('  OpenAI error 400: Billing hard limit reached')
            ->expectsOutput('Generated 0, failed 1.')
            ->expectsOutput('Failed: prancha')
            ->assertFailed();
        $this->assertFileDoesNotExist("{$this->library}/prancha.jpg");
    }

    public function test_bad_input_fails_before_calling_the_api(): void
    {
        Http::fake();

        $this->artisan('exercises:generate-images', ['slugs' => ['nada']])
            ->expectsOutput('Unknown exercises: nada.')
            ->assertFailed();
        $this->artisan('exercises:generate-images', ['--quality' => 'ultra'])
            ->expectsOutput('Quality must be low, medium or high.')
            ->assertFailed();

        config(['services.openai.key' => null]);
        $this->artisan('exercises:generate-images', ['slugs' => ['prancha']])
            ->expectsOutput('  OPENAI_API_KEY is not set.')
            ->assertFailed();
        Http::assertNothingSent();
    }
}
