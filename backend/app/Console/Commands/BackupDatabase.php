<?php

namespace App\Console\Commands;

use App\Models\AdminAlert;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Str;

/**
 * Dumps the MySQL/MariaDB database to a gzip file and keeps only the newest N backups.
 */
class BackupDatabase extends Command
{
    protected $signature = 'backup:database';

    protected $description = 'Dump the database to storage and prune old backups';

    public function handle(): int
    {
        $connection = config('database.default');
        $db = config("database.connections.{$connection}");

        if (! in_array($db['driver'] ?? null, ['mysql', 'mariadb'], true)) {
            $this->warn("Backup skipped: driver [{$db['driver']}] is not MySQL/MariaDB.");

            return self::SUCCESS;
        }

        $dir = config('deploy.backup_path');
        File::ensureDirectoryExists($dir);
        $file = $dir.'/db-'.now()->format('Y-m-d-His').'.sql.gz';

        // Password goes through MYSQL_PWD so it never shows up in the process list.
        $result = Process::env(['MYSQL_PWD' => (string) $db['password']])
            ->timeout(900)
            ->run([
                'bash', '-c',
                'set -o pipefail; mysqldump --single-transaction --quick --no-tablespaces -h "$1" -P "$2" -u "$3" "$4" | gzip > "$5"',
                'backup',
                (string) $db['host'],
                (string) $db['port'],
                (string) $db['username'],
                (string) $db['database'],
                $file,
            ]);

        if ($result->failed()) {
            File::delete($file);
            Log::error('Database backup failed', ['error' => trim($result->errorOutput())]);
            AdminAlert::record(AdminAlert::BACKUP_FAILED, 'Database backup failed: '.Str::limit(trim($result->errorOutput()), 300));
            $this->error('Database backup failed.');

            return self::FAILURE;
        }

        $removed = $this->prune($dir, (int) config('deploy.backup_keep'));
        Log::info('Database backup created', ['file' => basename($file), 'pruned' => $removed]);
        $this->info('Backup created: '.basename($file));

        return self::SUCCESS;
    }

    /** Keeps the newest $keep backups (file names sort by date) and returns how many were removed. */
    private function prune(string $dir, int $keep): int
    {
        $files = glob($dir.'/db-*.sql.gz') ?: [];
        rsort($files);
        $old = array_slice($files, max($keep, 1));
        File::delete($old);

        return count($old);
    }
}
