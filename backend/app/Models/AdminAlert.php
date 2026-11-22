<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/**
 * SPEC 6.5: alerts for the admin. Messages never carry personal or health data: errors keep only
 * the exception class, a short message and where it happened.
 */
#[Fillable(['type', 'fingerprint', 'message', 'occurrences', 'last_occurred_at', 'resolved_at', 'resolved_by'])]
class AdminAlert extends Model
{
    public const APP_ERROR = 'app_error';

    public const BACKUP_FAILED = 'backup_failed';

    public const MAIL_FAILED = 'mail_failed';

    public const DEPLOY_FAILED = 'deploy_failed';

    protected function casts(): array
    {
        return [
            'occurrences' => 'integer',
            'last_occurred_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    /** Opens an alert, or counts one more occurrence of the same open alert. Never throws. */
    public static function record(string $type, string $message): void
    {
        try {
            $message = Str::limit(trim($message), 1000);
            $fingerprint = hash('sha256', $type.'|'.$message);

            $open = self::where('fingerprint', $fingerprint)->whereNull('resolved_at')->first();
            if ($open) {
                $open->increment('occurrences', 1, ['last_occurred_at' => now()]);

                return;
            }

            self::create([
                'type' => $type,
                'fingerprint' => $fingerprint,
                'message' => $message,
                'last_occurred_at' => now(),
            ]);
        } catch (Throwable $e) {
            // The database may be the problem itself: the log still has it.
            Log::warning('Could not record admin alert', ['type' => $type, 'error' => $e->getMessage()]);
        }
    }

    /** Unexpected exception → app_error. SQL errors keep only the error code (bindings may hold user data). */
    public static function recordException(Throwable $e): void
    {
        $detail = $e instanceof QueryException
            ? 'SQLSTATE '.($e->errorInfo[0] ?? '?').' / '.($e->errorInfo[1] ?? '?')
            : Str::limit($e->getMessage(), 300);
        $where = Str::after($e->getFile(), base_path().DIRECTORY_SEPARATOR).':'.$e->getLine();

        self::record(self::APP_ERROR, class_basename($e).': '.$detail.' ('.str_replace('\\', '/', $where).')');
    }
}
