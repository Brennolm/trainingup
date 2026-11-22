<?php

namespace App\Http\Controllers;

use App\Http\Resources\QuestionnaireResource;
use App\Models\Questionnaire;
use App\Services\HealthScreeningService;
use App\Support\LegalConsent;
use App\Support\QuestionnaireOptions as O;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * SPEC 6.3: questionnaire wizard, saved section by section ("salva e continua depois"), and
 * Perfil → Meus dados (edit one section of the current version). Every answer needs the health
 * data consent first (LGPD art. 11).
 */
class QuestionnaireController extends Controller
{
    /** Current version (or null) and whether the health data consent is in place. */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $questionnaire = $user->currentQuestionnaire();

        return response()->json([
            'data' => $questionnaire ? new QuestionnaireResource($questionnaire) : null,
            'health_consent' => LegalConsent::hasHealthConsent($user),
        ]);
    }

    /** Records the specific consent for health data (shown before the first question). */
    public function consent(Request $request): JsonResponse
    {
        $request->validate(['accept' => ['accepted']], ['accept.accepted' => __('questionnaire.consent_required')]);

        $user = $request->user();
        if (! LegalConsent::hasHealthConsent($user)) {
            LegalConsent::recordHealth($user, $request);
        }

        return response()->json(['health_consent' => true]);
    }

    /**
     * Starts the questionnaire. Resumes the open draft; after a completed version, starts the next
     * one (reassessment) pre-filled with the previous answers.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->ensureHealthConsent($request);

        $current = $user->currentQuestionnaire();
        if ($current !== null && ! $current->isCompleted()) {
            return response()->json(['data' => new QuestionnaireResource($current)]);
        }

        $questionnaire = DB::transaction(function () use ($user, $current) {
            $next = $user->questionnaires()->create([
                'version' => ($current?->version ?? 0) + 1,
                ...($current ? $current->only(Questionnaire::ANSWER_FIELDS) : []),
            ]);
            if ($current?->healthScreening) {
                $next->healthScreening()->create($current->healthScreening->only(['answers', 'result']));
            }

            return $next->load('healthScreening');
        });

        return response()->json(['data' => new QuestionnaireResource($questionnaire)], 201);
    }

    /** Saves one section of the current version (wizard step or "Meus dados"). */
    public function update(Request $request, string $section, HealthScreeningService $screenings): QuestionnaireResource
    {
        abort_unless(in_array($section, O::SECTIONS, true), 404);
        $this->ensureHealthConsent($request);

        $questionnaire = $request->user()->currentQuestionnaire();
        abort_if($questionnaire === null, 404);

        DB::transaction(fn () => match ($section) {
            'personal' => $this->savePersonal($request, $questionnaire, $screenings),
            'health' => $this->saveHealth($request, $questionnaire, $screenings),
            default => $questionnaire->update($this->validateSection($request, $section)),
        });

        return new QuestionnaireResource($questionnaire->refresh()->load('healthScreening'));
    }

    /** Step 7: closes the version. Generating plans also needs the "sugestão e estimativa" notice. */
    public function complete(Request $request): QuestionnaireResource
    {
        $this->ensureHealthConsent($request);
        $questionnaire = $request->user()->currentQuestionnaire();
        abort_if($questionnaire === null, 404);

        if (! $questionnaire->isCompleted()) {
            if (! $questionnaire->isFilled()) {
                throw ValidationException::withMessages(['questionnaire' => __('questionnaire.incomplete')]);
            }
            // Blocked users don't get generated plans, so there is nothing to accept.
            if (! $questionnaire->isBlocked()) {
                $request->validate(
                    ['accept_disclaimer' => ['accepted']],
                    ['accept_disclaimer.accepted' => __('questionnaire.disclaimer_required')],
                );
            }
            $questionnaire->update([
                'completed_at' => now(),
                'disclaimer_accepted_at' => $questionnaire->isBlocked() ? null : now(),
            ]);
        }

        return new QuestionnaireResource($questionnaire->load('healthScreening'));
    }

    private function ensureHealthConsent(Request $request): void
    {
        if (! LegalConsent::hasHealthConsent($request->user())) {
            abort(response()->json([
                'message' => __('questionnaire.consent_required'),
                'code' => 'health_consent_required',
            ], 409));
        }
    }

    private function savePersonal(Request $request, Questionnaire $questionnaire, HealthScreeningService $screenings): void
    {
        $data = $this->validateSection($request, 'personal');

        // Changing the sex may change the pregnancy answer (women only) and so the screening.
        $screening = $questionnaire->healthScreening;
        if ($screening !== null && $data['sex'] !== $questionnaire->sex) {
            $screenings->save($questionnaire, $screening->answers, $data['sex'], $request->boolean('confirm_correct'), $request);
        }

        $questionnaire->update($data);
    }

    private function saveHealth(Request $request, Questionnaire $questionnaire, HealthScreeningService $screenings): void
    {
        abort_if($questionnaire->sex === null, 422, __('questionnaire.personal_first'));
        $female = $questionnaire->sex === 'female';

        $data = $request->validate([
            'par_q' => ['required', 'array', 'size:'.O::PAR_Q_QUESTIONS],
            'par_q.*' => ['required', 'boolean'],
            'pregnant_or_lactating' => $female ? ['required', 'boolean'] : ['nullable'],
            'conditions' => ['present', 'array'],
            'conditions.*' => ['string', 'distinct', Rule::in(O::HEALTH_CONDITIONS)],
        ]);

        $screenings->save($questionnaire, $data, $questionnaire->sex, $request->boolean('confirm_correct'), $request);
        $questionnaire->touch();
    }

    /** @return array<string, mixed> */
    private function validateSection(Request $request, string $section): array
    {
        $data = $request->validate(match ($section) {
            'personal' => [
                'sex' => ['required', Rule::in(O::SEXES)],
                'height_cm' => ['required', 'numeric', 'between:'.implode(',', O::HEIGHT_CM)],
                'weight_kg' => ['required', 'numeric', 'between:'.implode(',', O::WEIGHT_KG)],
            ],
            'routine' => [
                'work_activity' => ['required', Rule::in(O::WORK_ACTIVITY)],
            ],
            'goal' => [
                'goal' => ['required', Rule::in(O::GOALS)],
                'goal_pace' => [Rule::requiredIf($request->input('goal') !== 'maintain'), 'nullable', Rule::in(O::GOAL_PACES)],
            ],
            'training' => [
                'experience' => ['required', Rule::in(O::EXPERIENCE)],
                'training_days' => ['required', 'array', 'between:'.implode(',', O::TRAINING_DAYS)],
                'training_days.*' => ['string', 'distinct', Rule::in(O::WEEKDAYS)],
                'session_minutes' => ['required', 'integer', Rule::in(O::SESSION_MINUTES)],
                'training_location' => ['required', Rule::in(O::TRAINING_LOCATIONS)],
                'wants_cardio' => ['required', 'boolean'],
                'cardio_preference' => [Rule::requiredIf($request->boolean('wants_cardio')), 'nullable', Rule::in(O::CARDIO_PREFERENCES)],
            ],
            'diet' => [
                'diet_restrictions' => ['present', 'array'],
                'diet_restrictions.*' => ['string', 'distinct', Rule::in(O::DIET_RESTRICTIONS)],
                'meals_per_day' => ['required', 'integer', 'between:'.implode(',', O::MEALS_PER_DAY)],
                'diet_split' => ['required', Rule::in(O::DIET_SPLITS)],
            ],
        });

        return match ($section) {
            'personal' => [
                'sex' => $data['sex'],
                'height_cm' => round((float) $data['height_cm'], 1),
                'weight_kg' => round((float) $data['weight_kg'], 2),
            ],
            'goal' => [
                'goal' => $data['goal'],
                'goal_pace' => $data['goal'] === 'maintain' ? null : $data['goal_pace'],
            ],
            'training' => [
                ...$data,
                // Week order, whatever order the days were tapped in.
                'training_days' => array_values(array_intersect(O::WEEKDAYS, $data['training_days'])),
                'wants_cardio' => (bool) $data['wants_cardio'],
                'cardio_preference' => $data['wants_cardio'] ? $data['cardio_preference'] : null,
            ],
            'diet' => [
                ...$data,
                'diet_restrictions' => array_values(array_intersect(O::DIET_RESTRICTIONS, $data['diet_restrictions'])),
            ],
            default => $data,
        };
    }
}
