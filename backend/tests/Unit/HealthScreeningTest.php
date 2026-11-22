<?php

namespace Tests\Unit;

use App\Models\HealthScreening;
use App\Services\HealthScreeningService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/** SPEC 5.1: any "yes" blocks the generated plans. */
class HealthScreeningTest extends TestCase
{
    private const ALL_NO = ['par_q' => [false, false, false, false, false, false, false], 'pregnant_or_lactating' => false, 'conditions' => []];

    public function test_all_no_is_clear(): void
    {
        $this->assertSame(HealthScreening::CLEAR, HealthScreening::evaluate(self::ALL_NO, 'female'));
        $this->assertSame(HealthScreening::CLEAR, HealthScreening::evaluate(self::ALL_NO, 'male'));
    }

    /** @return array<string, array{int}> */
    public static function parQQuestions(): array
    {
        return array_combine(array_map(fn ($i) => "question {$i}", range(1, 7)), array_map(fn ($i) => [$i - 1], range(1, 7)));
    }

    #[DataProvider('parQQuestions')]
    public function test_any_par_q_yes_blocks(int $index): void
    {
        $answers = self::ALL_NO;
        $answers['par_q'][$index] = true;

        $this->assertSame(HealthScreening::BLOCKED, HealthScreening::evaluate($answers, 'male'));
    }

    public function test_pregnancy_blocks_women(): void
    {
        $answers = [...self::ALL_NO, 'pregnant_or_lactating' => true];

        $this->assertSame(HealthScreening::BLOCKED, HealthScreening::evaluate($answers, 'female'));
        $this->assertSame(HealthScreening::CLEAR, HealthScreening::evaluate($answers, 'male'));
    }

    public function test_any_condition_blocks(): void
    {
        foreach (['diabetes', 'hypertension', 'heart_disease', 'kidney_disease', 'liver_disease', 'eating_disorder', 'other'] as $condition) {
            $answers = [...self::ALL_NO, 'conditions' => [$condition]];
            $this->assertSame(HealthScreening::BLOCKED, HealthScreening::evaluate($answers, 'male'), $condition);
        }
    }

    public function test_normalize_keeps_pregnancy_only_for_women_and_sorts_conditions(): void
    {
        $raw = ['par_q' => [0, 1, '0', false, true, false, false], 'pregnant_or_lactating' => true, 'conditions' => ['other', 'diabetes', 'other']];

        $this->assertSame([
            'par_q' => [false, true, false, false, true, false, false],
            'pregnant_or_lactating' => null,
            'conditions' => ['diabetes', 'other'],
        ], HealthScreeningService::normalize($raw, 'male'));

        $this->assertTrue(HealthScreeningService::normalize($raw, 'female')['pregnant_or_lactating']);
    }
}
