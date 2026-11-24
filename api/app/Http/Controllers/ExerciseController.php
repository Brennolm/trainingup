<?php

namespace App\Http\Controllers;

use App\Http\Resources\ExerciseResource;
use App\Models\Exercise;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Treino → Exercícios (SPEC 6.4): the active base, whole (small; the app filters it, also offline). */
class ExerciseController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return ExerciseResource::collection(Exercise::active()->orderBy('name')->get());
    }
}
