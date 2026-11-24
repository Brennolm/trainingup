<?php

namespace App\Services;

use App\Models\Exercise;
use App\Support\ExerciseRules;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use RuntimeException;

/**
 * Imports the exercise base from the reviewed CSV (database/data/exercises.csv): `;`-separated,
 * UTF-8 (BOM allowed, as Excel saves it), lists separated by `|`. Only adds slugs that do not
 * exist yet, so edits made in the admin are never overwritten. Any invalid row aborts the whole
 * import.
 */
class ExerciseImporter
{
    public const COLUMNS = [
        'slug', 'name', 'primary_muscle', 'secondary_muscles', 'movement_pattern', 'equipment', 'level',
        'contraindications',
    ];

    /** @return array{created: int, skipped: int} */
    public function import(string $path): array
    {
        $rows = $this->read($path);

        return DB::transaction(function () use ($rows) {
            $existing = Exercise::pluck('slug')->flip();
            $created = 0;

            foreach ($rows as $line => $row) {
                if (isset($existing[$row['slug']])) {
                    continue;
                }
                Exercise::create($row + ['is_active' => true]);
                $existing[$row['slug']] = true;
                $created++;
            }

            return ['created' => $created, 'skipped' => count($rows) - $created];
        });
    }

    /** @return array<int, array<string, mixed>> rows keyed by CSV line number */
    public function read(string $path): array
    {
        if (! is_file($path)) {
            throw new RuntimeException("Exercise file not found: {$path}");
        }

        $handle = fopen($path, 'r');
        $header = fgetcsv($handle, null, ';', '"', '');
        if ($header !== false && isset($header[0])) {
            $header[0] = preg_replace('/^\xEF\xBB\xBF/', '', $header[0]);
        }
        if ($header === false || array_map('trim', $header) !== self::COLUMNS) {
            fclose($handle);
            throw new RuntimeException('Exercise file: unexpected header (expected '.implode(';', self::COLUMNS).').');
        }

        $rows = [];
        $slugs = [];
        $line = 1;
        while (($cells = fgetcsv($handle, null, ';', '"', '')) !== false) {
            $line++;
            if ($cells === [null] || implode('', $cells) === '') {
                continue;
            }
            $cells = array_pad(array_map(fn ($c) => trim((string) $c), $cells), count(self::COLUMNS), '');
            $raw = array_combine(self::COLUMNS, array_slice($cells, 0, count(self::COLUMNS)));

            $row = [
                'slug' => $raw['slug'],
                'name' => $raw['name'],
                'primary_muscle' => $raw['primary_muscle'],
                'secondary_muscles' => $this->list($raw['secondary_muscles']),
                'movement_pattern' => $raw['movement_pattern'],
                'equipment' => $this->list($raw['equipment']),
                'level' => $raw['level'],
                'contraindications' => $this->list($raw['contraindications']),
            ];

            $validator = Validator::make($row, ExerciseRules::rules(uniqueName: false) + [
                'slug' => ['required', 'regex:/^[a-z0-9]+(-[a-z0-9]+)*$/', 'max:120'],
            ]);
            if ($validator->fails()) {
                fclose($handle);
                throw new RuntimeException("Exercise file, line {$line} ({$raw['slug']}): ".$validator->errors()->first());
            }
            if (isset($slugs[$row['slug']])) {
                fclose($handle);
                throw new RuntimeException("Exercise file, line {$line}: duplicated slug {$row['slug']}.");
            }
            $slugs[$row['slug']] = true;
            $rows[$line] = $row;
        }
        fclose($handle);

        return $rows;
    }

    /** @return list<string> */
    private function list(string $value): array
    {
        return array_values(array_filter(array_map('trim', explode('|', $value)), fn ($v) => $v !== ''));
    }
}
