<?php

namespace App\Support;

use App\Models\AppSetting;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Calculation parameters editable in the admin (SPEC 5.2; training ones from 5.5 arrive in phase 8.2).
 * Defaults live here; `app_settings` stores only values that differ. Labels: frontend locales
 * (admin.settings.labels.<key>).
 */
class Settings
{
    private const CACHE_KEY = 'app_settings';

    /**
     * key => [default, min, max, step, unit]. Activity factor buckets: low = 2–3 workouts/week,
     * mid = 4–5, high = 6 (table approved by Brenno, docs/DECISIONS.md).
     */
    public const DEFINITIONS = [
        // Mifflin-St Jeor: 10×weight + 6.25×height − 5×age + offset
        'bmr.weight_factor' => [10, 0, 50, 0.01, null],
        'bmr.height_factor' => [6.25, 0, 50, 0.01, null],
        'bmr.age_factor' => [5, 0, 50, 0.01, null],
        'bmr.male_offset' => [5, -500, 500, 1, 'kcal'],
        'bmr.female_offset' => [-161, -500, 500, 1, 'kcal'],

        'activity.sedentary.low' => [1.375, 1, 2.5, 0.005, null],
        'activity.sedentary.mid' => [1.55, 1, 2.5, 0.005, null],
        'activity.sedentary.high' => [1.725, 1, 2.5, 0.005, null],
        'activity.standing.low' => [1.55, 1, 2.5, 0.005, null],
        'activity.standing.mid' => [1.725, 1, 2.5, 0.005, null],
        'activity.standing.high' => [1.725, 1, 2.5, 0.005, null],
        'activity.active.low' => [1.725, 1, 2.5, 0.005, null],
        'activity.active.mid' => [1.9, 1, 2.5, 0.005, null],
        'activity.active.high' => [1.9, 1, 2.5, 0.005, null],

        'goal.lose_fat.light' => [-15, -40, 0, 1, '%'],
        'goal.lose_fat.moderate' => [-20, -40, 0, 1, '%'],
        'goal.gain_muscle.light' => [5, 0, 40, 1, '%'],
        'goal.gain_muscle.moderate' => [10, 0, 40, 1, '%'],

        'limits.max_deficit_pct' => [25, 0, 50, 1, '%'],
        'limits.min_kcal_male' => [1500, 800, 3000, 10, 'kcal'],
        'limits.min_kcal_female' => [1200, 800, 3000, 10, 'kcal'],

        'protein.lose_fat' => [2.0, 0.5, 4, 0.1, 'g/kg'],
        'protein.maintain' => [1.6, 0.5, 4, 0.1, 'g/kg'],
        'protein.gain_muscle' => [1.8, 0.5, 4, 0.1, 'g/kg'],
        'protein.reference_bmi_threshold' => [30, 20, 50, 0.5, 'bmi'],
        'protein.reference_bmi' => [25, 18, 30, 0.5, 'bmi'],

        'fat.g_per_kg' => [0.8, 0.3, 2, 0.05, 'g/kg'],
        'fat.min_pct' => [20, 0, 50, 1, '%'],

        'split.training_day_extra_pct' => [10, 0, 30, 1, '%'],
    ];

    /** @return array<string, float> every parameter with its current value */
    public static function all(): array
    {
        $stored = Cache::rememberForever(self::CACHE_KEY, fn () => AppSetting::pluck('value', 'key')->all());

        $values = [];
        foreach (self::DEFINITIONS as $key => [$default]) {
            $values[$key] = (float) ($stored[$key] ?? $default);
        }

        return $values;
    }

    public static function get(string $key): float
    {
        if (! isset(self::DEFINITIONS[$key])) {
            throw new InvalidArgumentException("Unknown setting [{$key}].");
        }

        return self::all()[$key];
    }

    public static function default(string $key): float
    {
        return (float) self::DEFINITIONS[$key][0];
    }

    /** Saves new values (already validated). A value equal to the default removes the override. */
    public static function update(array $values, User $by): void
    {
        DB::transaction(function () use ($values, $by) {
            foreach ($values as $key => $value) {
                if ((float) $value === self::default($key)) {
                    AppSetting::where('key', $key)->delete();
                } else {
                    AppSetting::updateOrCreate(['key' => $key], ['value' => (float) $value, 'updated_by' => $by->id]);
                }
            }
        });
        Cache::forget(self::CACHE_KEY);
    }

    /** SPEC 5.2 item 2: activity factor for the work routine and workouts per week. */
    public static function activityFactor(string $workActivity, int $trainingDays): float
    {
        $bucket = match (true) {
            $trainingDays >= 6 => 'high',
            $trainingDays >= 4 => 'mid',
            default => 'low',
        };

        return self::get("activity.{$workActivity}.{$bucket}");
    }
}
