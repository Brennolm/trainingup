<?php

namespace App\Models;

use App\Support\QuestionnaireOptions;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/** SPEC 6.3: the user's answers. One row per version; the latest one is the current. */
#[Fillable([
    'version', 'sex', 'height_cm', 'weight_kg', 'work_activity', 'goal', 'goal_pace',
    'experience', 'training_days', 'session_minutes', 'training_location', 'wants_cardio', 'cardio_preference',
    'diet_restrictions', 'meals_per_day', 'diet_split', 'disclaimer_accepted_at', 'completed_at',
])]
class Questionnaire extends Model
{
    /** Answer columns copied into a new version on reassessment. */
    public const ANSWER_FIELDS = [
        'sex', 'height_cm', 'weight_kg', 'work_activity', 'goal', 'goal_pace',
        'experience', 'training_days', 'session_minutes', 'training_location', 'wants_cardio', 'cardio_preference',
        'diet_restrictions', 'meals_per_day', 'diet_split',
    ];

    protected function casts(): array
    {
        return [
            'version' => 'integer',
            'height_cm' => 'float',
            'weight_kg' => 'float',
            'training_days' => 'array',
            'session_minutes' => 'integer',
            'wants_cardio' => 'boolean',
            'diet_restrictions' => 'array',
            'meals_per_day' => 'integer',
            'disclaimer_accepted_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasOne<HealthScreening, $this> */
    public function healthScreening(): HasOne
    {
        return $this->hasOne(HealthScreening::class);
    }

    public function isCompleted(): bool
    {
        return $this->completed_at !== null;
    }

    /** Sections with every required answer filled (the wizard resumes at the first missing one). */
    public function filledSections(): array
    {
        $screening = $this->healthScreening;
        $filled = [
            'personal' => $this->sex !== null && $this->height_cm !== null && $this->weight_kg !== null,
            'health' => $screening !== null
                && ($this->sex !== 'female' || ($screening->answers['pregnant_or_lactating'] ?? null) !== null),
            'routine' => $this->work_activity !== null,
            'goal' => $this->goal !== null && ($this->goal === 'maintain' || $this->goal_pace !== null),
            'training' => $this->experience !== null && $this->training_days !== null
                && $this->session_minutes !== null && $this->training_location !== null
                && $this->wants_cardio !== null && (! $this->wants_cardio || $this->cardio_preference !== null),
            'diet' => $this->diet_restrictions !== null && $this->meals_per_day !== null && $this->diet_split !== null,
        ];

        return array_values(array_filter(QuestionnaireOptions::SECTIONS, fn (string $s) => $filled[$s]));
    }

    public function isFilled(): bool
    {
        return count($this->filledSections()) === count(QuestionnaireOptions::SECTIONS);
    }

    /** SPEC 5.1: generated plans are blocked while the health screening has any "yes". */
    public function isBlocked(): bool
    {
        return $this->healthScreening?->result === HealthScreening::BLOCKED;
    }
}
