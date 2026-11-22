<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Password policy (docs/DECISIONS.md): at least 8 characters with a letter and a number.
        Password::defaults(fn () => Password::min(8)->letters()->numbers());

        $this->configureRateLimiting();
    }

    /** SPEC 2.5: rate limiting on login, sign-up, verification codes and password recovery. */
    private function configureRateLimiting(): void
    {
        $emailAndIp = fn (Request $r) => mb_strtolower((string) $r->input('email')).'|'.$r->ip();

        RateLimiter::for('login', fn (Request $r) => [
            Limit::perMinute(5)->by('login:'.$emailAndIp($r)),
            Limit::perMinute(20)->by('login-ip:'.$r->ip()),
        ]);

        RateLimiter::for('register', fn (Request $r) => [
            Limit::perMinute(5)->by('register:'.$r->ip()),
            Limit::perDay(50)->by('register-day:'.$r->ip()),
        ]);

        RateLimiter::for('password-email', fn (Request $r) => [
            Limit::perMinute(3)->by('pwd-email:'.$emailAndIp($r)),
            Limit::perHour(20)->by('pwd-email-ip:'.$r->ip()),
        ]);

        RateLimiter::for('google', fn (Request $r) => Limit::perMinute(20)->by('google:'.$r->ip()));

        RateLimiter::for('password-reset', fn (Request $r) => Limit::perMinute(10)->by('pwd-reset:'.$r->ip()));

        // The code itself allows 5 attempts; this only stops scripted hammering.
        RateLimiter::for('verify-code', fn (Request $r) => Limit::perMinute(10)->by('verify:'.($r->user()?->id ?? $r->ip())));

        // The 60-second cooldown is enforced by EmailVerificationService; this caps daily volume.
        RateLimiter::for('resend-code', fn (Request $r) => Limit::perHour(10)->by('resend:'.($r->user()?->id ?? $r->ip())));
    }
}
