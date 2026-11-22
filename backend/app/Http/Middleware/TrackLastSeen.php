<?php

namespace App\Http\Middleware;

use App\Services\Impersonation;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/** "Último acesso" (SPEC 6.5): at most one write every 5 minutes; support accesses don't count. */
class TrackLastSeen
{
    private const EVERY_MINUTES = 5;

    public function __construct(private Impersonation $impersonation) {}

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! $request->hasSession() || $this->impersonation->sessionData($request) !== null) {
            return $response;
        }

        $user = Auth::guard('web')->user();
        if ($user && ($user->last_seen_at === null || $user->last_seen_at->lt(now()->subMinutes(self::EVERY_MINUTES)))) {
            // Query builder: no model events and no updated_at change.
            DB::table('users')->where('id', $user->id)->update(['last_seen_at' => now()]);
        }

        return $response;
    }
}
