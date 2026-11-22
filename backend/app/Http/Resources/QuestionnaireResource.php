<?php

namespace App\Http\Resources;

use App\Models\Questionnaire;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Questionnaire */
class QuestionnaireResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $screening = $this->healthScreening;

        return [
            'version' => $this->version,
            'personal' => [
                'sex' => $this->sex,
                'height_cm' => $this->height_cm,
                'weight_kg' => $this->weight_kg,
            ],
            // Only the owner ever receives this (it is their own health data).
            'health' => $screening === null ? null : [
                'par_q' => $screening->answers['par_q'],
                'pregnant_or_lactating' => $screening->answers['pregnant_or_lactating'],
                'conditions' => $screening->answers['conditions'],
                'result' => $screening->result,
                'rectified_at' => $screening->rectifications()->latest('confirmed_at')->value('confirmed_at')
                    ?->toIso8601String(),
            ],
            'routine' => ['work_activity' => $this->work_activity],
            'goal' => ['goal' => $this->goal, 'goal_pace' => $this->goal_pace],
            'training' => [
                'experience' => $this->experience,
                'training_days' => $this->training_days,
                'session_minutes' => $this->session_minutes,
                'training_location' => $this->training_location,
                'wants_cardio' => $this->wants_cardio,
                'cardio_preference' => $this->cardio_preference,
            ],
            'diet' => [
                'diet_restrictions' => $this->diet_restrictions,
                'meals_per_day' => $this->meals_per_day,
                'diet_split' => $this->diet_split,
            ],
            'filled_sections' => $this->filledSections(),
            'blocked' => $this->isBlocked(),
            'disclaimer_accepted_at' => $this->disclaimer_accepted_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
