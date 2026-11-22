<?php

namespace App\Services;

use App\Models\AdminImpersonationLog;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * SPEC 6.5 "Ver como usuário": the admin stays signed in; while the session holds a valid
 * impersonation, the API answers as the chosen user (guard `impersonation`, see AppServiceProvider)
 * and every write is refused (ImpersonationReadOnly). Each access is logged with its reason.
 */
class Impersonation
{
    public const SESSION_KEY = 'impersonation';

    /** Ends by itself after this long. */
    public const MAX_MINUTES = 60;

    public function start(Request $request, User $admin, User $user, string $reason): AdminImpersonationLog
    {
        $this->stop($request);

        $log = AdminImpersonationLog::create([
            'admin_id' => $admin->id,
            'user_id' => $user->id,
            'reason' => $reason,
            'started_at' => now(),
            'ip_address' => $request->ip(),
        ]);
        $request->session()->put(self::SESSION_KEY, [
            'log_id' => $log->id,
            'admin_id' => $admin->id,
            'user_id' => $user->id,
            'started_at' => $log->started_at->getTimestamp(),
        ]);

        return $log;
    }

    public function stop(Request $request): void
    {
        $data = $request->hasSession() ? $request->session()->pull(self::SESSION_KEY) : null;
        if ($data) {
            AdminImpersonationLog::whereKey($data['log_id'])->whereNull('ended_at')->update(['ended_at' => now()]);
        }
    }

    /** Raw session data, even if expired (writes stay blocked until it is cleaned up). */
    public function sessionData(Request $request): ?array
    {
        return $request->hasSession() ? $request->session()->get(self::SESSION_KEY) : null;
    }

    public function isExpired(array $data): bool
    {
        return now()->getTimestamp() - $data['started_at'] > self::MAX_MINUTES * 60;
    }

    /**
     * Who the API should treat as signed in: the impersonated user while a valid impersonation
     * belongs to this admin; otherwise the real (session) user.
     */
    public function resolve(Request $request, ?User $real): ?User
    {
        $data = $this->sessionData($request);
        if (! $real || ! $data || ! $real->isAdmin() || $data['admin_id'] !== $real->id || $this->isExpired($data)) {
            return $real;
        }

        $target = User::find($data['user_id']);
        if ($target) {
            $request->attributes->set('impersonator', $real);
            $request->attributes->set('impersonation_expires_at', $data['started_at'] + self::MAX_MINUTES * 60);
        }

        return $target ?? $real;
    }
}
