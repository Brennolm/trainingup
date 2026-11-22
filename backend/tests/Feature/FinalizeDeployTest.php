<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class FinalizeDeployTest extends TestCase
{
    private string $dir;

    protected function setUp(): void
    {
        parent::setUp();
        $this->dir = sys_get_temp_dir().'/tu-deploy-'.uniqid();
        File::ensureDirectoryExists($this->dir);
        config([
            'deploy.version_file' => $this->dir.'/DEPLOY_VERSION',
            'deploy.marker_file' => $this->dir.'/marker/deployed_version',
            'deploy.cache' => false,
        ]);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->dir);
        parent::tearDown();
    }

    public function test_does_nothing_without_a_version_file(): void
    {
        $this->artisan('deploy:finalize')->assertSuccessful();

        $this->assertFalse(Schema::hasTable('users'));
        $this->assertFileDoesNotExist(config('deploy.marker_file'));
    }

    public function test_runs_migrations_and_records_a_new_version(): void
    {
        file_put_contents(config('deploy.version_file'), "abc123\n");

        $this->artisan('deploy:finalize')->assertSuccessful();

        $this->assertTrue(Schema::hasTable('users'));
        $this->assertSame('abc123', file_get_contents(config('deploy.marker_file')));
    }

    public function test_skips_a_version_that_was_already_finalized(): void
    {
        file_put_contents(config('deploy.version_file'), 'abc123');
        File::ensureDirectoryExists(dirname(config('deploy.marker_file')));
        file_put_contents(config('deploy.marker_file'), 'abc123');

        $this->artisan('deploy:finalize')->assertSuccessful();

        $this->assertFalse(Schema::hasTable('users'));
    }

    public function test_first_deploy_works_with_database_cache_on_an_empty_database(): void
    {
        // Regression: clearing the database cache before migrating failed with "table cache not found".
        config(['deploy.cache' => true, 'cache.default' => 'database']);
        file_put_contents(config('deploy.version_file'), 'first');

        try {
            $this->artisan('deploy:finalize')->assertSuccessful();
            $this->assertTrue(Schema::hasTable('cache'));
        } finally {
            // optimize writes bootstrap cache files; never leave them behind in the working copy.
            $this->artisan('optimize:clear');
        }
    }

    public function test_force_runs_again_for_the_same_version(): void
    {
        file_put_contents(config('deploy.version_file'), 'abc123');
        File::ensureDirectoryExists(dirname(config('deploy.marker_file')));
        file_put_contents(config('deploy.marker_file'), 'abc123');

        $this->artisan('deploy:finalize', ['--force' => true])->assertSuccessful();

        $this->assertTrue(Schema::hasTable('users'));
    }
}
