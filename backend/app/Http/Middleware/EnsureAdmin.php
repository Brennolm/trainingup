<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Admin panel (SPEC 6.5). While impersonating, the request user is the other user, so it is refused. */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => __('admin.forbidden')], 403);
        }

        return $next($request);
    }
}
