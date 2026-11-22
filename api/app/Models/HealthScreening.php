<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * SPEC 5.1: PAR-Q, pregnancy/breastfeeding and clinical conditions (encrypted).
 * answers = {par_q: bool[7], pregnant_or_lactating: ?bool (women only), conditions: string[]}.
 */
#[Fillable(['answers', 'result'])]
class HealthScreening extends Model
{
    public const CLEAR = 'clear';

    public const BLOCKED = 'blocked';

    protected function casts(): array
    {
        return ['answers' => 'encrypted:array'];
    }

    /** Any "yes" blocks the generated plans. Pregnancy only counts for women. */
    public static function evaluate(array $answers, ?string $sex): string
    {
        $yes = in_array(true, $answers['par_q'] ?? [], true)
            || ($sex === 'female' && ($answers['pregnant_or_lactating'] ?? false) === true)
            || ! empty($answers['conditions']);

        return $yes ? self::BLOCKED : self::CLEAR;
    }

    /** @return BelongsTo<Questionnaire, $this> */
    public function questionnaire(): BelongsTo
    {
        return $this->belongsTo(Questionnaire::class);
    }

    /** @return HasMany<HealthScreeningRectification, $this> */
    public function rectifications(): HasMany
    {
        return $this->hasMany(HealthScreeningRectification::class);
    }
}
