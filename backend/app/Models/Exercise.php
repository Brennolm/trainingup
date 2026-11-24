<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/** SPEC 4/5.5: an exercise of the base (no user-made exercises, SPEC 8). */
#[Fillable([
    'slug', 'name', 'primary_muscle', 'secondary_muscles', 'movement_pattern', 'equipment', 'level',
    'contraindications', 'image_path', 'is_active',
])]
class Exercise extends Model
{
    protected function casts(): array
    {
        return [
            'secondary_muscles' => 'array',
            'equipment' => 'array',
            'contraindications' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }
}
