<?php

namespace App\Services;

use App\Models\HealthScreening;
use App\Models\Questionnaire;
use App\Support\QuestionnaireOptions;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * SPEC 5.1: saves the health screening. Once saved, any change is a rectification: it needs the
 * explicit "Confirmo que as informações estão corretas" and is logged (date, before → after).
 */
class HealthScreeningService
{
    /** Same shape for every comparison: 7 booleans, pregnancy only for women, sorted conditions. */
    public static function normalize(array $answers, ?string $sex): array
    {
        $conditions = array_values(array_unique(array_map('strval', $answers['conditions'] ?? [])));
        sort($conditions);

        $pregnant = $answers['pregnant_or_lactating'] ?? null;

        return [
            'par_q' => array_map(fn ($a) => (bool) $a, array_slice(array_values($answers['par_q'] ?? []), 0, QuestionnaireOptions::PAR_Q_QUESTIONS)),
            'pregnant_or_lactating' => $sex === 'female' && $pregnant !== null ? (bool) $pregnant : null,
            'conditions' => $conditions,
        ];
    }

    /**
     * Throws a validation error on `confirm_correct` (before writing anything) when the answers
     * change an existing screening without the confirmation. Returns false when nothing changed.
     */
    public function save(Questionnaire $questionnaire, array $answers, ?string $sex, bool $confirmed, Request $request): bool
    {
        $answers = self::normalize($answers, $sex);
        $result = HealthScreening::evaluate($answers, $sex);
        $screening = $questionnaire->healthScreening;

        if ($screening === null) {
            $questionnaire->setRelation('healthScreening', $questionnaire->healthScreening()->create([
                'answers' => $answers,
                'result' => $result,
            ]));

            return true;
        }

        if ($screening->answers === $answers && $screening->result === $result) {
            return false;
        }

        if (! $confirmed) {
            throw ValidationException::withMessages(['confirm_correct' => __('questionnaire.confirm_correct')]);
        }

        $screening->rectifications()->create([
            'previous_answers' => $screening->answers,
            'new_answers' => $answers,
            'previous_result' => $screening->result,
            'new_result' => $result,
            'confirmed_at' => now(),
            'ip_address' => $request->ip(),
        ]);
        $screening->update(['answers' => $answers, 'result' => $result]);

        return true;
    }
}
