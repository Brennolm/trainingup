<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirect;
use Throwable;

/**
 * "Continuar com Google" (SPEC 6.2, phase 4). Browser-redirect flow on the API domain; the
 * session cookie is shared with the SPA (SESSION_DOMAIN=.trainingup.com.br).
 *
 * - Known Google account → signs in.
 * - Existing e-mail → links Google automatically (Google confirms the e-mail) and signs in.
 * - New e-mail → keeps Google data in the session and sends the user to /completar-cadastro
 *   (birth date + terms); the account is only created there, so under-18s never get one.
 * - intent=link (from the profile) → links Google to the signed-in account.
 */
class GoogleAuthController extends Controller
{
    public const PENDING_KEY = 'google_pending';

    private const INTENT_KEY = 'google_intent';

    public function redirect(Request $request): SymfonyRedirect
    {
        $intent = $request->query('intent') === 'link' && Auth::guard('web')->check() ? 'link' : 'login';
        $request->session()->put(self::INTENT_KEY, $intent);

        return Socialite::driver('google')->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        $intent = $request->session()->pull(self::INTENT_KEY, 'login');

        try {
            $google = Socialite::driver('google')->user();
        } catch (Throwable $e) {
            Log::warning('Google sign-in failed', ['error' => $e->getMessage()]);

            return $this->toFrontend($intent === 'link' ? '/perfil?google=erro' : '/entrar?erro=google');
        }

        $email = mb_strtolower(trim((string) $google->getEmail()));
        $raw = $google->getRaw();
        $emailVerified = (bool) ($raw['email_verified'] ?? $raw['verified_email'] ?? false);

        if ($email === '' || ! $emailVerified) {
            return $this->toFrontend($intent === 'link' ? '/perfil?google=erro' : '/entrar?erro=google_email');
        }

        if ($intent === 'link' && ($current = Auth::guard('web')->user())) {
            return $this->link($current, (string) $google->getId());
        }

        $user = User::where('google_id', $google->getId())->first()
            ?? User::where('email', $email)->first();

        if ($user) {
            $user->forceFill([
                'google_id' => $google->getId(),
                'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();

            Auth::guard('web')->login($user, remember: true);
            $request->session()->regenerate();

            return $this->toFrontend('/hoje');
        }

        $request->session()->put(self::PENDING_KEY, [
            'google_id' => (string) $google->getId(),
            'name' => trim((string) ($google->getName() ?: strstr($email, '@', true))),
            'email' => $email,
            'expires_at' => now()->addMinutes(30)->timestamp,
        ]);

        return $this->toFrontend('/completar-cadastro');
    }

    private function link(User $current, string $googleId): RedirectResponse
    {
        $owner = User::where('google_id', $googleId)->first();
        if ($owner && $owner->isNot($current)) {
            return $this->toFrontend('/perfil?google=em_uso');
        }

        $current->forceFill(['google_id' => $googleId])->save();

        return $this->toFrontend('/perfil?google=vinculado');
    }

    private function toFrontend(string $path): RedirectResponse
    {
        return redirect()->away(rtrim((string) config('app.frontend_url'), '/').$path);
    }
}
