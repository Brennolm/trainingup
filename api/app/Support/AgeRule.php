<?php

namespace App\Support;

/** Birth date rules: adults only (SPEC 1) and a plausible date. */
class AgeRule
{
    /** @return array<int, string> */
    public static function birthDate(): array
    {
        $latest = now()->subYears((int) config('trainingup.min_age'))->toDateString();

        return ['required', 'date_format:Y-m-d', 'after:1900-01-01', "before_or_equal:{$latest}"];
    }
}
