<?php

namespace App\Http\Controllers;

use App\Models\Consent;
use App\Services\TwoFactorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** LGPD rights (SPEC 2.6): export my data and delete my account. */
class AccountController extends Controller
{
    /**
     * Everything stored about the user, as a JSON download. Each new phase that stores personal
     * data (questionnaire, plans, workout logs…) adds its section here.
     */
    public function export(Request $request): JsonResponse
    {
        $user = $request->user()->load(['plan', 'consents']);

        $data = [
            'exported_at' => now()->toIso8601String(),
            'account' => [
                'name' => $user->name,
                'email' => $user->email,
                'birth_date' => $user->birth_date?->toDateString(),
                'created_at' => $user->created_at?->toIso8601String(),
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                'plan' => $user->plan?->slug,
                'google_linked' => $user->google_id !== null,
                'two_factor_enabled' => $user->hasTwoFactorEnabled(),
            ],
            'preferences' => [
                'theme' => $user->theme->value,
                'weight_unit' => $user->weight_unit->value,
                'length_unit' => $user->length_unit->value,
                'locale' => $user->locale,
            ],
            'consents' => $user->consents->sortBy('accepted_at')->values()->map(fn (Consent $c) => [
                'type' => $c->type->value,
                'version' => $c->version,
                'accepted_at' => $c->accepted_at->toIso8601String(),
                'ip_address' => $c->ip_address,
                'user_agent' => $c->user_agent,
            ]),
        ];

        $filename = 'training-up-meus-dados-'.now()->format('Y-m-d').'.json';

        return response()->json($data, 200, [
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    /**
     * Deletes the account and everything linked to it, right away (docs/DECISIONS.md).
     * Confirmation: current password (or the word EXCLUIR for Google-only accounts) + 2FA code if on.
     */
    public function destroy(Request $request, TwoFactorService $twoFactor): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'password' => $user->password !== null ? ['required', 'string', 'current_password:web'] : ['nullable'],
            'confirmation' => $user->password === null
                ? ['required', 'string', Rule::in([config('trainingup.delete_confirmation_word')])]
                : ['nullable'],
            'code' => $user->hasTwoFactorEnabled() ? ['required', 'string'] : ['nullable'],
        ], [
            'confirmation.in' => __('account.delete.confirmation'),
            'confirmation.required' => __('account.delete.confirmation'),
        ]);

        if ($user->hasTwoFactorEnabled() && ! $twoFactor->verifyAny($user, $request->string('code'))) {
            throw ValidationException::withMessages(['code' => __('auth.two_factor.invalid')]);
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        DB::transaction(function () use ($user) {
            // Other devices' sessions and API tokens; consents and codes go by ON DELETE CASCADE.
            DB::table('sessions')->where('user_id', $user->id)->delete();
            DB::table('password_reset_tokens')->where('email', $user->email)->delete();
            $user->tokens()->delete();
            $user->delete();
        });
        Cache::forget('two-factor-last:'.$user->id);

        return response()->json(['message' => __('account.delete.done')]);
    }
}
