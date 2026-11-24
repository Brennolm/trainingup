<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Exercise;
use App\Models\User;
use App\Services\ExerciseMedia;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ExerciseMediaTest extends TestCase
{
    use RefreshDatabase;

    private Exercise $exercise;

    private User $admin;

    private string $library;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        $this->admin = User::factory()->create(['role' => Role::Admin]);
        $this->exercise = Exercise::create([
            'slug' => 'prancha',
            'name' => 'Prancha',
            'primary_muscle' => 'abs',
            'secondary_muscles' => [],
            'movement_pattern' => 'core',
            'equipment' => [],
            'level' => 'beginner',
            'contraindications' => [],
        ]);

        // A throwaway image library instead of database/data/exercise-images.
        $this->library = storage_path('framework/testing/exercise-images-'.uniqid());
        File::ensureDirectoryExists($this->library);
        $this->app->bind(ExerciseMedia::class, fn () => new class($this->library) extends ExerciseMedia
        {
            public function __construct(private string $dir) {}

            public function syncLibrary(?string $dir = null): array
            {
                return parent::syncLibrary($dir ?? $this->dir);
            }
        });
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->library);
        parent::tearDown();
    }

    private function upload(UploadedFile $file)
    {
        return $this->actingAs($this->admin)
            ->post("/api/admin/exercises/{$this->exercise->id}/image", ['file' => $file], ['Accept' => 'application/json']);
    }

    public function test_admin_uploads_an_image_that_is_served_publicly_and_cached(): void
    {
        $response = $this->upload(UploadedFile::fake()->image('foto.jpg', 800, 800))
            ->assertOk()
            ->assertJsonPath('message', 'Imagem enviada.');

        $url = $response->json('data.image_url');
        $this->assertMatchesRegularExpression('#/api/exercise-media/prancha-[a-z0-9]{12}\.jpg$#', $url);
        $this->assertArrayNotHasKey('video_url', $response->json('data'));
        Storage::disk('local')->assertExists($this->exercise->fresh()->image_path);

        // The library shows it too, and anyone can load the file (no session in <img>).
        $this->actingAs(User::factory()->create())->getJson('/api/exercises')->assertJsonPath('data.0.image_url', $url);
        $this->app['auth']->forgetGuards();
        $file = $this->get(parse_url($url, PHP_URL_PATH));
        $file->assertOk();
        $this->assertStringContainsString('max-age=31536000', $file->headers->get('Cache-Control'));
        $this->assertStringContainsString('immutable', $file->headers->get('Cache-Control'));
    }

    public function test_a_new_upload_replaces_the_old_file_and_remove_deletes_it(): void
    {
        $this->upload(UploadedFile::fake()->image('a.png', 400, 400));
        $old = $this->exercise->fresh()->image_path;

        $this->upload(UploadedFile::fake()->image('b.webp', 400, 400))->assertOk();
        $new = $this->exercise->fresh()->image_path;
        $this->assertNotSame($old, $new);
        Storage::disk('local')->assertMissing($old);
        Storage::disk('local')->assertExists($new);

        $this->actingAs($this->admin)->deleteJson("/api/admin/exercises/{$this->exercise->id}/image")
            ->assertOk()
            ->assertJsonPath('data.image_url', null)
            ->assertJsonPath('message', 'Imagem removida.');
        Storage::disk('local')->assertMissing($new);
    }

    public function test_upload_validation(): void
    {
        $this->upload(UploadedFile::fake()->create('foto.gif', 100, 'image/gif'))
            ->assertUnprocessable()
            ->assertJsonPath('errors.file.0', 'O arquivo deve ser do tipo: jpg, jpeg, png, webp.');
        $this->upload(UploadedFile::fake()->image('grande.jpg', 2400, 1000))
            ->assertUnprocessable()
            ->assertJsonPath('errors.file.0', 'O arquivo deve ter no máximo 2000 × 2000 pixels.');
        $this->upload(UploadedFile::fake()->image('pesada.jpg', 500, 500)->size(1500))
            ->assertUnprocessable()
            ->assertJsonPath('errors.file.0', 'O arquivo não pode ter mais de 1024 KB.');
        $this->upload(UploadedFile::fake()->create('execucao.mp4', 300, 'video/mp4'))
            ->assertUnprocessable();

        $this->actingAs($this->admin)
            ->post("/api/admin/exercises/{$this->exercise->id}/video", [], ['Accept' => 'application/json'])
            ->assertNotFound();
        $this->assertNull($this->exercise->fresh()->image_path);
    }

    public function test_only_admins_upload(): void
    {
        $this->actingAs(User::factory()->create())
            ->post("/api/admin/exercises/{$this->exercise->id}/image", [
                'file' => UploadedFile::fake()->image('foto.jpg'),
            ], ['Accept' => 'application/json'])
            ->assertForbidden();
    }

    public function test_media_route_only_serves_existing_exercise_images(): void
    {
        $this->get('/api/exercise-media/nada-aqui.jpg')->assertNotFound();
        $this->get('/api/exercise-media/..%2F..%2F.env')->assertNotFound();
        $this->get('/api/exercise-media/script.php')->assertNotFound();
        $this->get('/api/exercise-media/video.mp4')->assertNotFound();
    }

    public function test_library_images_are_linked_on_deploy_without_overwriting_admin_uploads(): void
    {
        $other = $this->exercise->replicate()->fill(['slug' => 'ponte-gluteo', 'name' => 'Ponte de glúteo']);
        $other->save();
        File::put("{$this->library}/prancha.jpg", 'library v1');
        File::put("{$this->library}/ponte-gluteo.jpg", 'library bridge');
        File::put("{$this->library}/nao-existe.jpg", 'orphan');

        // Ponte already has an image uploaded in the admin: it stays.
        $this->exercise = $other;
        $this->upload(UploadedFile::fake()->image('admin.jpg', 300, 300))->assertOk();
        $uploaded = $other->fresh()->image_path;

        $this->artisan('exercises:images')
            ->expectsOutput('Exercise images: 1 updated, 1 kept.')
            ->expectsOutput('No exercise with slug nao-existe.')
            ->assertSuccessful();

        $plank = Exercise::where('slug', 'prancha')->first()->image_path;
        $this->assertMatchesRegularExpression('#^exercises/prancha-lib-[a-f0-9]{12}\.jpg$#', $plank);
        $this->assertSame('library v1', Storage::disk('local')->get($plank));
        $this->assertSame($uploaded, $other->fresh()->image_path);

        // Running again changes nothing; a new library version replaces the old file.
        $this->artisan('exercises:images')->expectsOutput('Exercise images: 0 updated, 2 kept.');
        File::put("{$this->library}/prancha.jpg", 'library v2');
        $this->artisan('exercises:images')->expectsOutput('Exercise images: 1 updated, 1 kept.');
        $newPlank = Exercise::where('slug', 'prancha')->first()->image_path;
        $this->assertNotSame($plank, $newPlank);
        Storage::disk('local')->assertMissing($plank);
        $this->assertSame('library v2', Storage::disk('local')->get($newPlank));
    }
}
