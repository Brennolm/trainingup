<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\Settings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** SPEC 5.2: calculation parameters. Changes apply only to plans generated afterwards. */
class SettingsController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => $this->present()]);
    }

    public function update(Request $request): JsonResponse
    {
        // values = [{key, value}, …] (the keys contain dots, so they don't go in field names).
        $data = $request->validate([
            'values' => ['required', 'array'],
            'values.*.key' => ['required', 'string', 'distinct', Rule::in(array_keys(Settings::DEFINITIONS))],
            'values.*.value' => ['required', 'numeric'],
        ]);

        $values = [];
        $errors = [];
        foreach ($data['values'] as $i => ['key' => $key, 'value' => $value]) {
            [, $min, $max] = Settings::DEFINITIONS[$key];
            if ($value < $min || $value > $max) {
                $errors["values.{$i}.value"] = __('admin.settings.range', ['min' => $min, 'max' => $max]);
            }
            $values[$key] = (float) $value;
        }
        if ($errors) {
            throw ValidationException::withMessages($errors);
        }

        Settings::update($values, $request->user());

        return response()->json(['data' => $this->present(), 'message' => __('admin.settings.saved')]);
    }

    private function present(): array
    {
        $current = Settings::all();

        return collect(Settings::DEFINITIONS)->map(fn (array $d, string $key) => [
            'key' => $key,
            'value' => $current[$key],
            'default' => (float) $d[0],
            'min' => (float) $d[1],
            'max' => (float) $d[2],
            'step' => (float) $d[3],
            'unit' => $d[4],
        ])->values()->all();
    }
}
