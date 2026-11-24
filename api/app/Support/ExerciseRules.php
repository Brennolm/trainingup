<?php

namespace App\Support;

use App\Models\Exercise;
use Illuminate\Validation\Rule;

/** Validation of an exercise, shared by the admin form and the CSV import. */
class ExerciseRules
{
    public static function rules(?Exercise $ignore = null, bool $uniqueName = true): array
    {
        $name = ['required', 'string', 'max:120'];
        if ($uniqueName) {
            $name[] = Rule::unique('exercises', 'name')->ignore($ignore);
        }

        return [
            'name' => $name,
            'primary_muscle' => ['required', Rule::in(ExerciseOptions::MUSCLES)],
            'secondary_muscles' => ['present', 'array'],
            'secondary_muscles.*' => ['distinct', Rule::in(ExerciseOptions::MUSCLES), 'different:primary_muscle'],
            'movement_pattern' => ['required', Rule::in(ExerciseOptions::PATTERNS)],
            'equipment' => ['present', 'array'],
            'equipment.*' => ['distinct', Rule::in(ExerciseOptions::EQUIPMENT)],
            'level' => ['required', Rule::in(ExerciseOptions::LEVELS)],
            'contraindications' => ['present', 'array'],
            'contraindications.*' => ['distinct', Rule::in(ExerciseOptions::INJURIES)],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
