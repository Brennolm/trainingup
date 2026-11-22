<?php

namespace App\Http\Middleware;

use App\Services\Impersonation;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * SPEC 6.5: during "Ver como usuário" nothing can be changed or downloaded. Only leaving the
 * impersonation is allowed. An expired impersonation is closed here (log gets its end time).
 */
class ImpersonationReadOnly
{
    /** Read-only routes that would still hand out the user's data in bulk. */
    private const BLOCKED_READS = ['api/profile/export'];

    public function __construct(private Impersonation $impersonation) {}

    public function handle(Request $request, Closure $next): Response
    {
        $data = $this->impersonation->sessionData($request);
        if ($data === null) {
            return $next($request);
        }

        if ($this->impersonation->isExpired($data)) {
            $this->impersonation->stop($request);

            return $next($request);
        }

        $leaving = $request->isMethod('DELETE') && $request->is('api/admin/impersonation');
        $write = ! in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true);
        if (! $leaving && ($write || $request->is(...self::BLOCKED_READS))) {
            return response()->json([
                'message' => __('admin.impersonation.read_only'),
                'code' => 'impersonation_read_only',
            ], 403);
        }

        return $next($request);
    }
}
