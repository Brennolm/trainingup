<?php

namespace App\Support;

/**
 * Allowed answers of the questionnaire (SPEC 6.3). Keys in English; the app translates them.
 * Keep in sync with frontend/src/features/questionnaire/options.ts.
 */
class QuestionnaireOptions
{
    public const SECTIONS = ['personal', 'health', 'routine', 'goal', 'training', 'diet'];

    public const SEXES = ['male', 'female'];

    public const HEIGHT_CM = [120, 230];

    public const WEIGHT_KG = [30, 300];

    public const WORK_ACTIVITY = ['sedentary', 'standing', 'active'];

    public const GOALS = ['lose_fat', 'maintain', 'gain_muscle'];

    public const GOAL_PACES = ['light', 'moderate'];

    public const EXPERIENCE = ['beginner', 'intermediate', 'advanced'];

    public const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    /** SPEC 5.5: splits exist for 2 to 6 sessions a week. */
    public const TRAINING_DAYS = [2, 6];

    /** SPEC 5.5: exercises per session by time (75 means 75 or more). */
    public const SESSION_MINUTES = [30, 45, 60, 75];

    /** SPEC 5.5: full gym, building gym, home. */
    public const TRAINING_LOCATIONS = ['gym', 'building_gym', 'home'];

    public const CARDIO_PREFERENCES = ['walking', 'running', 'cycling', 'elliptical', 'any'];

    /** SPEC 5.3. */
    public const DIET_RESTRICTIONS = ['vegetarian', 'vegan', 'lactose_free', 'gluten_free'];

    /** SPEC 5.3: 3 to 6 meals (4–5 recommended). */
    public const MEALS_PER_DAY = [3, 6];

    public const DIET_SPLITS = ['single', 'training_rest'];

    /** SPEC 5.1: the 7 standard PAR-Q questions (q1…q7). */
    public const PAR_Q_QUESTIONS = 7;

    /** SPEC 5.1: diagnosed clinical conditions. */
    public const HEALTH_CONDITIONS = [
        'diabetes', 'hypertension', 'heart_disease', 'kidney_disease', 'liver_disease', 'eating_disorder', 'other',
    ];
}
