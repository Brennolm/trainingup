<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAlert;
use App\Models\HealthScreening;
use App\Models\Questionnaire;
use App\Models\User;
use Illuminate\Http\JsonResponse;

/** SPEC 6.5: sign-ups, weekly active users, plans and sessions (null until those phases exist). */
class MetricsController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $weekAgo = now()->subDays(7);

        return response()->json(['data' => [
            'users_total' => User::count(),
            'users_verified' => User::whereNotNull('email_verified_at')->count(),
            'signups_7d' => User::where('created_at', '>=', $weekAgo)->count(),
            'signups_30d' => User::where('created_at', '>=', now()->subDays(30))->count(),
            'active_7d' => User::where('last_seen_at', '>=', $weekAgo)->count(),
            // Latest version per user: completed and blocked by the screening.
            'questionnaires_completed' => Questionnaire::whereNotNull('completed_at')->distinct()->count('user_id'),
            'screenings_blocked' => HealthScreening::where('result', HealthScreening::BLOCKED)
                ->whereIn('questionnaire_id', Questionnaire::selectRaw('max(id)')->groupBy('user_id'))
                ->count(),
            'plans_generated' => null, // phases 8 and 10
            'sessions_logged' => null, // phase 8.5
            'open_alerts' => AdminAlert::whereNull('resolved_at')->count(),
        ]]);
    }
}
