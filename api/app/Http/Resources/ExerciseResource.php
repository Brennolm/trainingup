<?php

namespace App\Http\Resources;

use App\Models\Exercise;
use App\Services\ExerciseMedia;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Exercise */
class ExerciseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'primary_muscle' => $this->primary_muscle,
            'secondary_muscles' => $this->secondary_muscles,
            'movement_pattern' => $this->movement_pattern,
            'equipment' => $this->equipment,
            'level' => $this->level,
            'contraindications' => $this->contraindications,
            'image_url' => ExerciseMedia::url($this->image_path),
            'is_active' => $this->is_active,
        ];
    }
}
