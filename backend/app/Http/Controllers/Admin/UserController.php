<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminImpersonationLog;
use App\Models\User;
use App\Services\Impersonation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/** SPEC 6.5: user list and "Ver como usuário" (read-only, reason required, logged). */
class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));

        $users = User::query()
            ->when($search !== '', fn ($q) => $q->where(fn ($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json([
            'data' => $users->getCollection()->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role->value,
                'status' => $u->hasVerifiedEmail() ? 'active' : 'unverified',
                'created_at' => $u->created_at?->toIso8601String(),
                'last_seen_at' => $u->last_seen_at?->toIso8601String(),
            ]),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function impersonate(Request $request, User $user, Impersonation $impersonation): JsonResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'min:10', 'max:500']]);
        $admin = $request->user();

        if ($user->is($admin) || $user->isAdmin()) {
            throw ValidationException::withMessages(['reason' => __('admin.impersonation.not_allowed')]);
        }

        $impersonation->start($request, $admin, $user, trim($data['reason']));

        return response()->json(['message' => __('admin.impersonation.started', ['name' => $user->name])]);
    }

    /** Support access log (who, whom, why, when). */
    public function logs(): JsonResponse
    {
        $logs = AdminImpersonationLog::with(['admin:id,name', 'user:id,name,email'])
            ->latest('started_at')
            ->latest('id')
            ->limit(100)
            ->get();

        return response()->json(['data' => $logs->map(fn (AdminImpersonationLog $l) => [
            'id' => $l->id,
            'admin' => $l->admin?->name,
            'user' => $l->user ? ['name' => $l->user->name, 'email' => $l->user->email] : null,
            'reason' => $l->reason,
            'started_at' => $l->started_at->toIso8601String(),
            'ended_at' => $l->ended_at?->toIso8601String(),
        ])]);
    }
}
