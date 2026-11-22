<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\TwoFactorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/**
 * Second step of an e-mail/password sign-in when 2FA is on. LoginController leaves the
 * user id in the session (SESSION_KEY); only a valid code (app or recovery) signs in.
 */
class TwoFactorChallengeController extends Controller
{
    public const SESSION_KEY = 'login.two_factor';

    public const TTL_MINUTES = 10;

    public const MAX_ATTEMPTS = 5;

    public function __invoke(Request $request, TwoFactorService $twoFactor): UserResource|JsonResponse
    {
        $request->validate(['code' => ['required', 'string', 'max:32']]);

        // Without the SPA's cookie session there is no password step to continue.
        $pending = $request->hasSession() ? $request->session()->get(self::SESSION_KEY) : null;
        $user = $pending && $pending['expires_at'] > now()->timestamp ? User::find($pending['id']) : null;

        if (! $user?->hasTwoFactorEnabled()) {
            if ($request->hasSession()) {
                $request->session()->forget(self::SESSION_KEY);
            }

            return response()->json(['message' => __('auth.two_factor.expired'), 'code' => 'two_factor_expired'], 422);
        }

        if (! $twoFactor->verifyAny($user, $request->string('code'))) {
            $pending['attempts']++;
            if ($pending['attempts'] >= self::MAX_ATTEMPTS) {
                $request->session()->forget(self::SESSION_KEY);

                return response()->json(['message' => __('auth.two_factor.too_many_attempts'), 'code' => 'two_factor_expired'], 422);
            }
            $request->session()->put(self::SESSION_KEY, $pending);

            throw ValidationException::withMessages(['code' => __('auth.two_factor.invalid')]);
        }

        $request->session()->forget(self::SESSION_KEY);
        Auth::guard('web')->login($user, $pending['remember']);
        $request->session()->regenerate();

        return new UserResource($user->load('plan'));
    }
}
