<?php

namespace App\Services;

use App\Mail\VerificationCodeMail;
use App\Models\AdminAlert;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

/**
 * 6-digit e-mail verification codes (SPEC 6.2): valid for 15 minutes, at most 5 attempts,
 * resend allowed after 60 seconds. Only an HMAC of the code is stored, and the code itself is
 * never logged.
 */
class EmailVerificationService
{
    public const OK = 'ok';

    public const INVALID = 'invalid';

    public const EXPIRED = 'expired';

    public const TOO_MANY_ATTEMPTS = 'too_many_attempts';

    public const NO_CODE = 'no_code';

    /** Seconds until a new code may be sent (0 = now). */
    public function secondsUntilResend(User $user): int
    {
        $code = $user->emailVerificationCode;
        if (! $code) {
            return 0;
        }

        $availableAt = $code->sent_at->copy()->addSeconds(config('trainingup.verification.resend_cooldown_seconds'));

        return max(0, (int) ceil(now()->diffInSeconds($availableAt, false)));
    }

    /**
     * Creates a fresh code (replacing any previous one) and e-mails it.
     * Returns false when the e-mail could not be sent; the code is kept so the user can retry.
     */
    public function send(User $user): bool
    {
        $length = config('trainingup.verification.code_length');
        $code = str_pad((string) random_int(0, 10 ** $length - 1), $length, '0', STR_PAD_LEFT);

        $user->emailVerificationCode()->updateOrCreate([], [
            'code_hash' => $this->hash($code),
            'attempts' => 0,
            'expires_at' => now()->addMinutes(config('trainingup.verification.ttl_minutes')),
            'sent_at' => now(),
        ]);
        $user->unsetRelation('emailVerificationCode');

        try {
            // Sent synchronously: the queue only runs once a minute on shared hosting.
            Mail::to($user)->send(new VerificationCodeMail($user, $code));

            return true;
        } catch (Throwable $e) {
            Log::error('Verification e-mail failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
            AdminAlert::record(AdminAlert::MAIL_FAILED, 'Verification e-mail: '.class_basename($e).': '.Str::limit($e->getMessage(), 300));

            return false;
        }
    }

    /** Checks a code and marks the e-mail as verified on success. Returns one of the constants. */
    public function verify(User $user, string $code): string
    {
        $record = $user->emailVerificationCode;

        if (! $record) {
            return self::NO_CODE;
        }
        if ($record->attempts >= config('trainingup.verification.max_attempts')) {
            return self::TOO_MANY_ATTEMPTS;
        }
        if ($record->expires_at->isPast()) {
            return self::EXPIRED;
        }
        if (! hash_equals($record->code_hash, $this->hash($code))) {
            $record->increment('attempts');

            return $record->attempts >= config('trainingup.verification.max_attempts')
                ? self::TOO_MANY_ATTEMPTS
                : self::INVALID;
        }

        $user->forceFill(['email_verified_at' => now()])->save();
        $record->delete();
        $user->unsetRelation('emailVerificationCode');

        return self::OK;
    }

    private function hash(string $code): string
    {
        return hash_hmac('sha256', $code, (string) config('app.key'));
    }
}
