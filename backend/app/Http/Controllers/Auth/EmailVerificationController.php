<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Services\EmailVerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailVerificationController extends Controller
{
    public function __construct(private EmailVerificationService $verification) {}

    public function verify(Request $request): JsonResponse
    {
        $request->validate(['code' => ['required', 'string', 'digits:'.config('trainingup.verification.code_length')]]);
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => __('auth.verification.already_verified'),
                'data' => new UserResource($user->load('plan')),
            ]);
        }

        $result = $this->verification->verify($user, $request->string('code')->toString());

        if ($result !== EmailVerificationService::OK) {
            $message = __("auth.verification.{$result}");

            return response()->json(['message' => $message, 'code' => $result, 'errors' => ['code' => [$message]]], 422);
        }

        return response()->json([
            'message' => __('auth.verification.verified'),
            'data' => new UserResource($user->load('plan')),
        ]);
    }

    public function resend(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => __('auth.verification.already_verified')]);
        }

        $wait = $this->verification->secondsUntilResend($user);
        if ($wait > 0) {
            return response()->json([
                'message' => __('auth.verification.wait', ['seconds' => $wait]),
                'retry_after' => $wait,
            ], 429);
        }

        if (! $this->verification->send($user)) {
            return response()->json(['message' => __('auth.verification.send_failed')], 503);
        }

        return response()->json([
            'message' => __('auth.verification.sent'),
            'retry_after' => (int) config('trainingup.verification.resend_cooldown_seconds'),
        ]);
    }
}
