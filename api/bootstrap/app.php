<?php

use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\ImpersonationReadOnly;
use App\Http\Middleware\TrackLastSeen;
use App\Models\AdminAlert;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Sanctum SPA authentication: cookie session + CSRF for requests from the frontend.
        $middleware->statefulApi();
        $middleware->alias(['verified.email' => EnsureEmailIsVerified::class, 'admin' => EnsureAdmin::class]);
        // After the session starts (statefulApi): read-only support access and "último acesso".
        $middleware->api(append: [ImpersonationReadOnly::class, TrackLastSeen::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Every reported (unexpected) error also becomes an alert in the admin (SPEC 6.5).
        $exceptions->report(fn (Throwable $e) => AdminAlert::recordException($e));

        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Friendly pt-BR messages for the SPA.
        $exceptions->render(fn (AuthenticationException $e, Request $request) => response()->json([
            'message' => __('auth.unauthenticated'),
        ], 401));

        $exceptions->render(function (ThrottleRequestsException $e, Request $request) {
            $seconds = (int) ($e->getHeaders()['Retry-After'] ?? 60);

            return response()->json([
                'message' => __('auth.throttle', ['seconds' => $seconds]),
                'retry_after' => $seconds,
            ], 429, $e->getHeaders());
        });
    })->create();
