<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    /** Signs in, or answers two_factor: true when the account asks for an app code first. */
    public function store(LoginRequest $request): UserResource|JsonResponse
    {
        $guard = Auth::guard('web');
        $remember = $request->boolean('remember', true);

        if (! $guard->validate($request->only('email', 'password'))) {
            throw ValidationException::withMessages(['email' => __('auth.failed')]);
        }

        $user = $guard->getLastAttempted();

        if ($user->hasTwoFactorEnabled()) {
            $request->session()->regenerate();
            $request->session()->put(TwoFactorChallengeController::SESSION_KEY, [
                'id' => $user->id,
                'remember' => $remember,
                'attempts' => 0,
                'expires_at' => now()->addMinutes(TwoFactorChallengeController::TTL_MINUTES)->timestamp,
            ]);

            return response()->json(['two_factor' => true]);
        }

        $guard->login($user, $remember);
        $request->session()->regenerate();

        return new UserResource($user->load('plan'));
    }

    public function destroy(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => __('auth.logged_out')]);
    }
}
