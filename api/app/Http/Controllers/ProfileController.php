<?php

namespace App\Http\Controllers;

use App\Enums\LengthUnit;
use App\Enums\Theme;
use App\Enums\WeightUnit;
use App\Http\Resources\UserResource;
use App\Support\AgeRule;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    /** Personal data. The e-mail is read-only for now (docs/DECISIONS.md). */
    public function update(Request $request): UserResource
    {
        $request->merge(['name' => trim((string) $request->input('name'))]);
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'birth_date' => AgeRule::birthDate(),
        ]);

        $request->user()->update($data);

        return new UserResource($request->user()->load('plan'));
    }

    public function preferences(Request $request): UserResource
    {
        $data = $request->validate([
            'theme' => ['sometimes', Rule::enum(Theme::class)],
            'weight_unit' => ['sometimes', Rule::enum(WeightUnit::class)],
            'length_unit' => ['sometimes', Rule::enum(LengthUnit::class)],
        ]);

        $request->user()->update($data);

        return new UserResource($request->user()->load('plan'));
    }
}
