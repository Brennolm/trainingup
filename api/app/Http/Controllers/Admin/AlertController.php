<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAlert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** SPEC 6.5: application errors, backup and e-mail failures — list and mark as resolved. */
class AlertController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $resolved = $request->query('status') === 'resolved';

        $alerts = AdminAlert::query()
            ->when($resolved, fn ($q) => $q->whereNotNull('resolved_at'), fn ($q) => $q->whereNull('resolved_at'))
            ->orderByDesc($resolved ? 'resolved_at' : 'last_occurred_at')
            ->limit(100)
            ->get();

        return response()->json(['data' => $alerts->map(fn (AdminAlert $a) => $this->present($a))]);
    }

    public function resolve(Request $request, AdminAlert $alert): JsonResponse
    {
        if ($alert->resolved_at === null) {
            $alert->update(['resolved_at' => now(), 'resolved_by' => $request->user()->id]);
        }

        return response()->json(['data' => $this->present($alert)]);
    }

    private function present(AdminAlert $a): array
    {
        return [
            'id' => $a->id,
            'type' => $a->type,
            'message' => $a->message,
            'occurrences' => $a->occurrences,
            'first_occurred_at' => $a->created_at?->toIso8601String(),
            'last_occurred_at' => $a->last_occurred_at->toIso8601String(),
            'resolved_at' => $a->resolved_at?->toIso8601String(),
        ];
    }
}
