<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Blocks the app for accounts that have not confirmed their e-mail yet (SPEC 6.2). */
class EnsureEmailIsVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->hasVerifiedEmail()) {
            return response()->json([
                'message' => __('auth.email_unverified'),
                'code' => 'email_unverified',
            ], 403);
        }

        return $next($request);
    }
}
