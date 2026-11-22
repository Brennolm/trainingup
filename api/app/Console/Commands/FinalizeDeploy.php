<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Runs post-deploy tasks once per published version.
 *
 * Hostinger's Git deployment only pulls files, so migrations and caches run here, triggered by
 * the scheduler right after a new DEPLOY_VERSION is published.
 */
class FinalizeDeploy extends Command
{
    protected $signature = 'deploy:finalize {--force : Run even if this version was already finalized}';

    protected $description = 'Run migrations and rebuild caches when a new deploy version is published';

    public function handle(): int
    {
        $versionFile = config('deploy.version_file');

        if (! is_file($versionFile)) {
            $this->info('No deploy version file found; nothing to do.');

            return self::SUCCESS;
        }

        $version = trim((string) file_get_contents($versionFile));
        $markerFile = config('deploy.marker_file');
        $finalized = is_file($markerFile) ? trim((string) file_get_contents($markerFile)) : null;

        if ($version === $finalized && ! $this->option('force')) {
            return self::SUCCESS;
        }

        $useCache = (bool) config('deploy.cache');

        try {
            if ($useCache) {
                $this->call('optimize:clear');
            }
            $this->call('package:discover');
            $this->call('migrate', ['--force' => true]);
            if ($useCache) {
                $this->call('optimize');
            }
        } catch (Throwable $e) {
            Log::error('Deploy finalize failed', ['version' => $version, 'error' => $e->getMessage()]);
            $this->error('Deploy finalize failed: '.$e->getMessage());

            return self::FAILURE;
        }

        File::ensureDirectoryExists(dirname($markerFile));
        file_put_contents($markerFile, $version);

        Log::info('Deploy finalized', ['version' => $version]);
        $this->info("Deploy {$version} finalized.");

        return self::SUCCESS;
    }
}
