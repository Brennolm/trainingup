<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ExerciseResource;
use App\Models\Exercise;
use App\Services\ExerciseMedia;
use App\Support\ExerciseRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

/**
 * SPEC 6.5: exercise base. No delete: plans will point to exercises, so one leaves the base by
 * being deactivated (hidden from the library and from new plans).
 */
class ExerciseController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return ExerciseResource::collection(Exercise::orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(ExerciseRules::rules());
        $exercise = Exercise::create($this->clean($data) + [
            'slug' => $this->uniqueSlug($data['name']),
            'is_active' => $data['is_active'] ?? true,
        ]);

        return response()->json([
            'data' => new ExerciseResource($exercise),
            'message' => __('admin.exercises.created'),
        ], 201);
    }

    public function update(Request $request, Exercise $exercise): JsonResponse
    {
        $data = $request->validate(ExerciseRules::rules($exercise));
        $exercise->update($this->clean($data));

        return response()->json([
            'data' => new ExerciseResource($exercise),
            'message' => __('admin.exercises.saved'),
        ]);
    }

    /** Example image (replaces the previous file). */
    public function storeImage(Request $request, Exercise $exercise, ExerciseMedia $media): JsonResponse
    {
        $request->validate(['file' => ExerciseMedia::RULES]);
        $media->store($exercise, $request->file('file'));

        return response()->json([
            'data' => new ExerciseResource($exercise),
            'message' => __('admin.exercises.media.image_saved'),
        ]);
    }

    public function destroyImage(Exercise $exercise, ExerciseMedia $media): JsonResponse
    {
        $media->remove($exercise);

        return response()->json([
            'data' => new ExerciseResource($exercise),
            'message' => __('admin.exercises.media.image_removed'),
        ]);
    }

    private function clean(array $data): array
    {
        $data['name'] = trim($data['name']);
        foreach (['secondary_muscles', 'equipment', 'contraindications'] as $list) {
            $data[$list] = array_values($data[$list]);
        }

        return $data;
    }

    /** The slug is a stable key (CSV import, later references) and never changes with the name. */
    private function uniqueSlug(string $name): string
    {
        $base = Str::limit(Str::slug($name), 110, '') ?: 'exercicio';
        $slug = $base;
        for ($i = 2; Exercise::where('slug', $slug)->exists(); $i++) {
            $slug = "{$base}-{$i}";
        }

        return $slug;
    }
}
