<?php

namespace App\Support;

/**
 * Vocabulary of the exercise base (SPEC 4, 5.5). Keys in English; the app translates them.
 * Keep in sync with frontend/src/features/workout/exerciseOptions.ts.
 */
class ExerciseOptions
{
    public const MUSCLES = [
        'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'lower_back',
        'quadriceps', 'hamstrings', 'glutes', 'adductors', 'calves',
    ];

    /** SPEC 5.5 item 3. */
    public const PATTERNS = [
        'squat', 'hinge', 'horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull', 'isolation', 'core',
    ];

    /** Equipment an exercise needs (all of them). None = body weight only. */
    public const EQUIPMENT = [
        'barbell', 'dumbbell', 'machine', 'cable', 'bench', 'pull_up_bar', 'parallel_bars', 'kettlebell', 'band',
    ];

    /** Lowest experience level the exercise suits (same keys as the questionnaire). */
    public const LEVELS = QuestionnaireOptions::EXPERIENCE;

    /** Injuries/limitations that exclude an exercise (also asked in the questionnaire, phase 8.3). */
    public const INJURIES = ['shoulder', 'elbow', 'wrist', 'lower_back', 'neck', 'hip', 'knee', 'ankle'];

    /**
     * Equipment per training location (approved by Brenno): the full gym has everything; the
     * building gym always has dumbbells and a bench and may have the optional items; at home only
     * the items the person ticks.
     */
    public const LOCATION_EQUIPMENT = [
        'gym' => ['always' => self::EQUIPMENT, 'optional' => []],
        'building_gym' => ['always' => ['dumbbell', 'bench'], 'optional' => ['cable', 'machine', 'pull_up_bar']],
        'home' => ['always' => [], 'optional' => ['dumbbell', 'band', 'kettlebell', 'pull_up_bar', 'bench']],
    ];

    /** Patterns that count as compound lifts (longer rest, SPEC 5.5 item 4). */
    public static function isCompound(string $pattern): bool
    {
        return ! in_array($pattern, ['isolation', 'core'], true);
    }
}
