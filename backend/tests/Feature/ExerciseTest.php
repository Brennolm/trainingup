<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Exercise;
use App\Models\User;
use App\Services\ExerciseImporter;
use App\Support\ExerciseOptions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class ExerciseTest extends TestCase
{
    use RefreshDatabase;

    private function csv(string $rows): string
    {
        $path = tempnam(sys_get_temp_dir(), 'exercises');
        file_put_contents($path, "\u{FEFF}".implode(';', ExerciseImporter::COLUMNS)."\r\n".$rows);

        return $path;
    }

    private function exercise(array $overrides = []): Exercise
    {
        static $n = 0;
        $n++;

        return Exercise::create($overrides + [
            'slug' => "exercicio-{$n}",
            'name' => "Exercício {$n}",
            'primary_muscle' => 'chest',
            'secondary_muscles' => ['triceps'],
            'movement_pattern' => 'horizontal_push',
            'equipment' => ['dumbbell', 'bench'],
            'level' => 'beginner',
            'contraindications' => ['shoulder'],
            'is_active' => true,
        ]);
    }

    private function payload(array $overrides = []): array
    {
        return $overrides + [
            'name' => 'Supino com pausa',
            'primary_muscle' => 'chest',
            'secondary_muscles' => ['triceps', 'shoulders'],
            'movement_pattern' => 'horizontal_push',
            'equipment' => ['barbell', 'bench'],
            'level' => 'intermediate',
            'contraindications' => ['shoulder', 'wrist'],
        ];
    }

    public function test_the_reviewed_base_imports_cleanly_and_only_once(): void
    {
        $importer = app(ExerciseImporter::class);

        $first = $importer->import(database_path('data/exercises.csv'));
        $this->assertGreaterThanOrEqual(100, $first['created']);
        $this->assertSame(0, $first['skipped']);

        $squat = Exercise::where('slug', 'agachamento-livre')->firstOrFail();
        $this->assertSame('Agachamento livre com barra', $squat->name);
        $this->assertSame(['glutes', 'hamstrings', 'lower_back'], $squat->secondary_muscles);
        $this->assertSame(['barbell'], $squat->equipment);
        $this->assertSame(['knee', 'hip', 'lower_back'], $squat->contraindications);
        $this->assertSame([], Exercise::where('slug', 'prancha')->first()->contraindications);
        $this->assertSame([], Exercise::where('slug', 'flexao')->first()->equipment);

        // Every movement pattern has exercises for the generator (8.3).
        foreach (ExerciseOptions::PATTERNS as $pattern) {
            $this->assertTrue(Exercise::where('movement_pattern', $pattern)->exists(), $pattern);
        }

        $second = $importer->import(database_path('data/exercises.csv'));
        $this->assertSame(0, $second['created']);
        $this->assertSame($first['created'], $second['skipped']);
    }

    public function test_import_never_overwrites_admin_edits(): void
    {
        $this->exercise(['slug' => 'prancha', 'name' => 'Prancha (editada)', 'is_active' => false]);

        app(ExerciseImporter::class)->import($this->csv("prancha;Prancha;abs;;core;;beginner;\n"));

        $plank = Exercise::where('slug', 'prancha')->sole();
        $this->assertSame('Prancha (editada)', $plank->name);
        $this->assertFalse($plank->is_active);
    }

    public function test_an_invalid_row_aborts_the_import_with_its_line(): void
    {
        $file = $this->csv(
            "ok;Exercício ok;abs;;core;;beginner;\n".
            "ruim;Exercício ruim;pescoço;;core;;beginner;\n"
        );

        try {
            app(ExerciseImporter::class)->import($file);
            $this->fail('Expected the import to fail.');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('line 3 (ruim)', $e->getMessage());
        }
        $this->assertSame(0, Exercise::count());

        $this->expectExceptionMessage('duplicated slug');
        app(ExerciseImporter::class)->read($this->csv("a;A;abs;;core;;beginner;\na;B;abs;;core;;beginner;\n"));
    }

    public function test_import_command(): void
    {
        $this->artisan('exercises:import', ['file' => $this->csv("prancha;Prancha;abs;;core;;beginner;\n")])
            ->expectsOutputToContain('Exercises created: 1')
            ->assertSuccessful();

        $this->artisan('exercises:import', ['file' => 'missing.csv'])->assertFailed();
    }

    public function test_the_library_lists_active_exercises_for_signed_in_users(): void
    {
        $this->getJson('/api/exercises')->assertUnauthorized();

        $this->exercise(['name' => 'Remada']);
        $this->exercise(['name' => 'Agachamento']);
        $this->exercise(['name' => 'Desativado', 'is_active' => false]);

        $this->actingAs(User::factory()->create())->getJson('/api/exercises')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'Agachamento')
            ->assertJsonPath('data.0.equipment', ['dumbbell', 'bench'])
            ->assertJsonPath('data.1.name', 'Remada');
    }

    public function test_admin_lists_every_exercise(): void
    {
        $this->exercise(['is_active' => false]);

        $this->actingAs(User::factory()->create())->getJson('/api/admin/exercises')->assertForbidden();
        $this->actingAs(User::factory()->create(['role' => Role::Admin]))->getJson('/api/admin/exercises')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.is_active', false);
    }

    public function test_admin_creates_an_exercise(): void
    {
        $admin = User::factory()->create(['role' => Role::Admin]);
        $this->exercise(['slug' => 'supino-com-pausa', 'name' => 'Outro nome']);

        $this->actingAs($admin)->postJson('/api/admin/exercises', $this->payload(['name' => ' Supino com pausa ']))
            ->assertCreated()
            ->assertJsonPath('data.name', 'Supino com pausa')
            ->assertJsonPath('data.slug', 'supino-com-pausa-2')
            ->assertJsonPath('data.is_active', true)
            ->assertJsonPath('message', 'Exercício criado.');

        $this->actingAs($admin)->postJson('/api/admin/exercises', $this->payload())
            ->assertUnprocessable()
            ->assertJsonPath('errors.name.0', 'Já existe um exercício com este nome.');
    }

    public function test_exercise_validation(): void
    {
        $admin = User::factory()->create(['role' => Role::Admin]);

        $this->actingAs($admin)->postJson('/api/admin/exercises', $this->payload([
            'name' => 'Novo',
            'primary_muscle' => 'neck',
            'secondary_muscles' => ['chest'],
            'movement_pattern' => 'jump',
            'equipment' => ['treadmill'],
            'level' => 'pro',
            'contraindications' => ['back'],
        ]))->assertUnprocessable()->assertJsonValidationErrors([
            'primary_muscle', 'movement_pattern', 'equipment.0', 'level', 'contraindications.0',
        ]);

        $this->actingAs($admin)->postJson('/api/admin/exercises', $this->payload([
            'name' => 'Novo',
            'secondary_muscles' => ['chest'],
        ]))->assertUnprocessable()->assertJsonValidationErrors(['secondary_muscles.0']);

        // Lists are required, even when empty (body weight only, no contraindication).
        $payload = $this->payload(['name' => 'Novo']);
        unset($payload['equipment']);
        $this->actingAs($admin)->postJson('/api/admin/exercises', $payload)
            ->assertUnprocessable()->assertJsonValidationErrors(['equipment']);

        $this->actingAs($admin)->postJson('/api/admin/exercises', $this->payload([
            'name' => 'Novo',
            'equipment' => [],
            'contraindications' => [],
        ]))->assertCreated()->assertJsonPath('data.equipment', []);
    }

    public function test_admin_edits_and_deactivates_an_exercise(): void
    {
        $admin = User::factory()->create(['role' => Role::Admin]);
        $exercise = $this->exercise(['slug' => 'supino', 'name' => 'Supino']);

        $this->actingAs($admin)->putJson("/api/admin/exercises/{$exercise->id}", $this->payload([
            'name' => 'Supino',
            'level' => 'advanced',
            'is_active' => false,
        ]))->assertOk()
            ->assertJsonPath('data.level', 'advanced')
            ->assertJsonPath('data.is_active', false)
            ->assertJsonPath('message', 'Exercício salvo.');

        $exercise->refresh();
        $this->assertSame('supino', $exercise->slug);
        $this->assertSame(['barbell', 'bench'], $exercise->equipment);

        $this->actingAs(User::factory()->create())->getJson('/api/exercises')->assertJsonCount(0, 'data');
    }
}
