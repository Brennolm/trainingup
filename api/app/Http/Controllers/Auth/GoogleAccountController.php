<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Plan;
use App\Models\User;
use App\Support\AgeRule;
use App\Support\LegalConsent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/** JSON side of the Google flow: finish sign-up (birth date + terms) and unlink. */
class GoogleAccountController extends Controller
{
    /** Google data waiting for the user to finish sign-up. */
    public function pending(Request $request): JsonResponse
    {
        $pending = $this->pendingData($request);

        if (! $pending) {
            return response()->json(['message' => __('auth.google.no_pending')], 404);
        }

        return response()->json(['data' => ['name' => $pending['name'], 'email' => $pending['email']]]);
    }

    public function complete(Request $request): JsonResponse
    {
        $pending = $this->pendingData($request);
        if (! $pending) {
            return response()->json(['message' => __('auth.google.no_pending')], 404);
        }

        $request->validate([
            'birth_date' => AgeRule::birthDate(),
            'accept_terms' => ['accepted'],
        ]);

        // The e-mail may have been registered in the meantime (another tab, password sign-up).
        if (User::where('email', $pending['email'])->orWhere('google_id', $pending['google_id'])->exists()) {
            $request->session()->forget(GoogleAuthController::PENDING_KEY);

            return response()->json(['message' => __('auth.google.already_registered')], 409);
        }

        $user = DB::transaction(function () use ($request, $pending) {
            $user = new User([
                'name' => $pending['name'],
                'email' => $pending['email'],
                'birth_date' => $request->input('birth_date'),
            ]);
            $user->forceFill(['google_id' => $pending['google_id'], 'email_verified_at' => now()]);
            $user->plan()->associate(Plan::free());
            $user->save();

            LegalConsent::record($user, $request);

            return $user;
        });

        $request->session()->forget(GoogleAuthController::PENDING_KEY);
        Auth::guard('web')->login($user, remember: true);
        $request->session()->regenerate();

        return (new UserResource($user->load('plan')))->response()->setStatusCode(201);
    }

    public function unlink(Request $request): JsonResponse|UserResource
    {
        $user = $request->user();

        // Without a password, removing Google would lock the user out.
        if ($user->password === null) {
            return response()->json(['message' => __('auth.google.needs_password'), 'code' => 'needs_password'], 422);
        }

        $user->forceFill(['google_id' => null])->save();

        return new UserResource($user->load('plan'));
    }

    /** @return array{google_id: string, name: string, email: string, expires_at: int}|null */
    private function pendingData(Request $request): ?array
    {
        $pending = $request->session()->get(GoogleAuthController::PENDING_KEY);

        if (! is_array($pending) || ($pending['expires_at'] ?? 0) < now()->timestamp) {
            return null;
        }

        return $pending;
    }
}
