<?php

namespace Tests\Feature;

use Illuminate\Process\PendingProcess;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use Tests\TestCase;

class BackupDatabaseTest extends TestCase
{
    private string $dir;

    protected function setUp(): void
    {
        parent::setUp();
        $this->dir = sys_get_temp_dir().'/tu-backup-'.uniqid();
        config([
            'deploy.backup_path' => $this->dir,
            'deploy.backup_keep' => 7,
            'database.default' => 'backup_test',
            'database.connections.backup_test' => [
                'driver' => 'mysql',
                'host' => 'localhost',
                'port' => '3306',
                'database' => 'tu_db',
                'username' => 'tu_user',
                'password' => 's3cret',
            ],
        ]);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->dir);
        parent::tearDown();
    }

    public function test_dumps_the_database_without_exposing_the_password_in_the_command(): void
    {
        Process::fake();

        $this->artisan('backup:database')->assertSuccessful();

        Process::assertRan(function (PendingProcess $process) {
            $command = implode(' ', (array) $process->command);

            return str_contains($command, 'mysqldump')
                && str_contains($command, 'tu_db')
                && ! str_contains($command, 's3cret')
                && $process->environment['MYSQL_PWD'] === 's3cret';
        });
    }

    public function test_keeps_only_the_newest_seven_backups(): void
    {
        Process::fake();
        File::ensureDirectoryExists($this->dir);
        foreach (range(1, 9) as $day) {
            touch(sprintf('%s/db-2026-11-%02d-030000.sql.gz', $this->dir, $day));
        }

        $this->artisan('backup:database')->assertSuccessful();

        $remaining = array_map('basename', glob($this->dir.'/db-*.sql.gz'));
        sort($remaining);
        $this->assertCount(7, $remaining);
        $this->assertSame('db-2026-11-03-030000.sql.gz', $remaining[0]);
    }

    public function test_fails_and_removes_the_partial_file_when_the_dump_fails(): void
    {
        Process::fake(['*' => Process::result(output: '', errorOutput: 'access denied', exitCode: 2)]);

        $this->artisan('backup:database')->assertFailed();

        $this->assertSame([], glob($this->dir.'/db-*.sql.gz'));
    }

    public function test_skips_non_mysql_connections(): void
    {
        Process::fake();
        config(['database.default' => 'sqlite']);

        $this->artisan('backup:database')->assertSuccessful();

        Process::assertNothingRan();
    }
}
