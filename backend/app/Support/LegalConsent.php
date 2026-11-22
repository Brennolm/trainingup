<?php

namespace App\Support;

use App\Enums\ConsentType;
use App\Models\User;
use Illuminate\Http\Request;

/** LGPD: which version of the Terms and Privacy Policy each user accepted (SPEC 2.6). */
class LegalConsent
{
    /** Types accepted together at sign-up (one checkbox). */
    public const TYPES = [ConsentType::Terms, ConsentType::Privacy];

    public static function currentVersion(ConsentType $type): string
    {
        return (string) config("trainingup.legal_versions.{$type->value}");
    }

    /** Records acceptance of the current versions, with date, IP and browser. */
    public static function record(User $user, Request $request): void
    {
        foreach (self::TYPES as $type) {
            $user->consents()->create([
                'type' => $type,
                'version' => self::currentVersion($type),
                'accepted_at' => now(),
                'ip_address' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 500),
            ]);
        }
    }

    /** LGPD art. 11: specific consent for health data, required before any questionnaire answer is saved. */
    public static function hasHealthConsent(User $user): bool
    {
        return $user->consents()
            ->where('type', ConsentType::HealthData)
            ->where('version', self::currentVersion(ConsentType::HealthData))
            ->exists();
    }

    public static function recordHealth(User $user, Request $request): void
    {
        $user->consents()->create([
            'type' => ConsentType::HealthData,
            'version' => self::currentVersion(ConsentType::HealthData),
            'accepted_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
        ]);
    }

    /** True when the user hasn't accepted the current version of some document yet. */
    public static function isOutdated(User $user): bool
    {
        foreach (self::TYPES as $type) {
            $accepted = $user->consents()
                ->where('type', $type)
                ->where('version', self::currentVersion($type))
                ->exists();
            if (! $accepted) {
                return true;
            }
        }

        return false;
    }
}
