<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** SPEC 5.1: each change to the health answers, before → after, confirmed by the user. */
#[Fillable(['previous_answers', 'new_answers', 'previous_result', 'new_result', 'confirmed_at', 'ip_address'])]
class HealthScreeningRectification extends Model
{
    protected function casts(): array
    {
        return [
            'previous_answers' => 'encrypted:array',
            'new_answers' => 'encrypted:array',
            'confirmed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<HealthScreening, $this> */
    public function healthScreening(): BelongsTo
    {
        return $this->belongsTo(HealthScreening::class);
    }
}
