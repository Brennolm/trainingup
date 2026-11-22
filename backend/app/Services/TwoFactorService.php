<?php

namespace App\Services;

use App\Models\User;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

/** TOTP (authenticator app) and single-use recovery codes. */
class TwoFactorService
{
    public const RECOVERY_CODES = 8;

    public function __construct(private readonly Google2FA $totp) {}

    public function generateSecret(): string
    {
        return $this->totp->generateSecretKey(32);
    }

    public function otpauthUrl(User $user, string $secret): string
    {
        return $this->totp->getQRCodeUrl(config('app.name'), $user->email, $secret);
    }

    public function qrSvg(string $otpauthUrl): string
    {
        $writer = new Writer(new ImageRenderer(new RendererStyle(240, 1), new SvgImageBackEnd));

        return $writer->writeString($otpauthUrl);
    }

    /**
     * Checks a 6-digit code against the user's secret (±30 s). A code that was already used is
     * rejected (replay), so the same code can't sign in twice.
     */
    public function verifyTotp(User $user, string $code): bool
    {
        $code = preg_replace('/\D/', '', $code);
        if ($user->two_factor_secret === null || strlen($code) !== 6) {
            return false;
        }

        $key = 'two-factor-last:'.$user->id;
        $timestep = $this->totp->verifyKeyNewer($user->two_factor_secret, $code, Cache::get($key, 0), 1);
        if ($timestep === false) {
            return false;
        }

        Cache::put($key, $timestep, now()->addMinutes(5));

        return true;
    }

    /** Uses up a recovery code if it matches one of the user's. */
    public function useRecoveryCode(User $user, string $code): bool
    {
        $hash = $this->hash($code);
        $codes = $user->two_factor_recovery_codes ?? [];

        foreach ($codes as $i => $stored) {
            if (hash_equals($stored, $hash)) {
                unset($codes[$i]);
                $user->forceFill(['two_factor_recovery_codes' => array_values($codes)])->save();

                return true;
            }
        }

        return false;
    }

    /** Either a 6-digit app code or a recovery code. */
    public function verifyAny(User $user, string $code): bool
    {
        return preg_match('/^\s*\d{3}\s?\d{3}\s*$/', $code)
            ? $this->verifyTotp($user, $code)
            : $this->useRecoveryCode($user, $code);
    }

    /**
     * Replaces the recovery codes and returns them in clear text (shown once; only hashes are stored).
     *
     * @return list<string>
     */
    public function regenerateRecoveryCodes(User $user): array
    {
        $codes = collect(range(1, self::RECOVERY_CODES))
            ->map(fn () => $this->randomChunk().'-'.$this->randomChunk())
            ->all();

        $user->forceFill(['two_factor_recovery_codes' => array_map($this->hash(...), $codes)])->save();

        return $codes;
    }

    public function disable(User $user): void
    {
        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();
    }

    /** 5 characters without look-alikes (no 0/O, 1/I/L). */
    private function randomChunk(): string
    {
        $alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        $chunk = '';
        for ($i = 0; $i < 5; $i++) {
            $chunk .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }

        return $chunk;
    }

    /** Case, spaces and dashes don't matter when typing a recovery code. */
    private function hash(string $code): string
    {
        $normalized = Str::upper(preg_replace('/[^A-Za-z0-9]/', '', $code));

        return hash_hmac('sha256', $normalized, config('app.key'));
    }
}
