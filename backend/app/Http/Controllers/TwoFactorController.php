<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Services\TwoFactorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Profile → Segurança → Verificação em duas etapas.
 * Enable (password) → scan QR → confirm a code → recovery codes shown once.
 * Disable needs password + code (app or recovery).
 */
class TwoFactorController extends Controller
{
    public function __construct(private readonly TwoFactorService $twoFactor) {}

    /** Starts setup: new secret (not active yet) + QR code. */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->password === null) {
            return response()->json(['message' => __('auth.two_factor.needs_password'), 'code' => 'needs_password'], 422);
        }
        if ($user->hasTwoFactorEnabled()) {
            return response()->json(['message' => __('auth.two_factor.already_enabled')], 409);
        }

        $request->validate(['password' => ['required', 'string', 'current_password:web']]);

        $secret = $this->twoFactor->generateSecret();
        $user->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        $url = $this->twoFactor->otpauthUrl($user, $secret);

        return response()->json(['data' => [
            'secret' => $secret,
            'otpauth_url' => $url,
            'qr_svg' => $this->twoFactor->qrSvg($url),
        ]]);
    }

    /** First code from the app turns 2FA on and returns the recovery codes. */
    public function confirm(Request $request): JsonResponse
    {
        $user = $request->user();
        $request->validate(['code' => ['required', 'string']]);

        if ($user->hasTwoFactorEnabled()) {
            return response()->json(['message' => __('auth.two_factor.already_enabled')], 409);
        }
        if ($user->two_factor_secret === null) {
            return response()->json(['message' => __('auth.two_factor.not_started')], 409);
        }
        if (! $this->twoFactor->verifyTotp($user, $request->string('code'))) {
            throw ValidationException::withMessages(['code' => __('auth.two_factor.invalid')]);
        }

        $user->forceFill(['two_factor_confirmed_at' => now()])->save();
        $codes = $this->twoFactor->regenerateRecoveryCodes($user);

        return response()->json([
            'data' => new UserResource($user->load('plan')),
            'recovery_codes' => $codes,
        ]);
    }

    public function destroy(Request $request): UserResource
    {
        $user = $request->user();
        $request->validate([
            'password' => ['required', 'string', 'current_password:web'],
            'code' => ['required', 'string'],
        ]);

        if ($user->hasTwoFactorEnabled() && ! $this->twoFactor->verifyAny($user, $request->string('code'))) {
            throw ValidationException::withMessages(['code' => __('auth.two_factor.invalid')]);
        }

        $this->twoFactor->disable($user);

        return new UserResource($user->load('plan'));
    }

    public function recoveryCodes(Request $request): JsonResponse
    {
        $user = $request->user();
        $request->validate(['password' => ['required', 'string', 'current_password:web']]);

        if (! $user->hasTwoFactorEnabled()) {
            return response()->json(['message' => __('auth.two_factor.not_enabled')], 409);
        }

        return response()->json([
            'data' => new UserResource($user->load('plan')),
            'recovery_codes' => $this->twoFactor->regenerateRecoveryCodes($user),
        ]);
    }
}
