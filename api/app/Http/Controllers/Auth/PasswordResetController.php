<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\AdminAlert;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class PasswordResetController extends Controller
{
    public function sendLink(Request $request): JsonResponse
    {
        $request->merge(['email' => mb_strtolower(trim((string) $request->input('email')))]);
        $request->validate(['email' => ['required', 'string', 'email']]);

        try {
            $status = Password::sendResetLink($request->only('email'));
        } catch (Throwable $e) {
            Log::error('Password reset e-mail failed', ['error' => $e->getMessage()]);
            AdminAlert::record(AdminAlert::MAIL_FAILED, 'Password reset e-mail: '.class_basename($e).': '.Str::limit($e->getMessage(), 300));
            $status = Password::RESET_LINK_SENT;
        }

        if ($status === Password::RESET_THROTTLED) {
            return response()->json(['message' => __('passwords.throttled')], 429);
        }

        // Same answer for existing and unknown e-mails (no account enumeration).
        return response()->json(['message' => __('passwords.sent')]);
    }

    public function reset(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                    // Opening the link proves access to the inbox.
                    'email_verified_at' => $user->email_verified_at ?? now(),
                ])->save();
                event(new PasswordReset($user));
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['token' => __('passwords.token')]);
        }

        return response()->json(['message' => __('passwords.reset')]);
    }
}
