<?php

namespace Tests\Feature;

use App\Enums\ConsentType;
use App\Models\HealthScreening;
use App\Models\Questionnaire;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class QuestionnaireTest extends TestCase
{
    use RefreshDatabase;

    private const NO_PAR_Q = [false, false, false, false, false, false, false];

    private const SECTIONS = [
        'personal' => ['sex' => 'female', 'height_cm' => 165.4, 'weight_kg' => 62.35],
        'health' => ['par_q' => self::NO_PAR_Q, 'pregnant_or_lactating' => false, 'conditions' => []],
        'routine' => ['work_activity' => 'sedentary'],
        'goal' => ['goal' => 'lose_fat', 'goal_pace' => 'moderate'],
        'training' => [
            'experience' => 'beginner', 'training_days' => ['fri', 'mon', 'wed'], 'session_minutes' => 60,
            'training_location' => 'gym', 'wants_cardio' => true, 'cardio_preference' => 'walking',
        ],
        'diet' => ['diet_restrictions' => ['lactose_free'], 'meals_per_day' => 5, 'diet_split' => 'single'],
    ];

    private function consented(?User $user = null): User
    {
        $user ??= User::factory()->create();
        $this->actingAs($user)->fromSpa()->postJson('/api/questionnaire/consent', ['accept' => true])->assertOk();

        return $user;
    }

    /** Consent + start + every section saved. */
    private function filled(array $overrides = []): User
    {
        $user = $this->consented();
        $this->postJson('/api/questionnaire')->assertCreated();
        foreach (array_replace(self::SECTIONS, $overrides) as $section => $body) {
            $this->putJson("/api/questionnaire/sections/{$section}", $body)->assertOk();
        }

        return $user;
    }

    public function test_starts_empty_without_consent(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->fromSpa()->getJson('/api/questionnaire')
            ->assertOk()
            ->assertExactJson(['data' => null, 'health_consent' => false]);
    }

    public function test_answers_need_the_health_data_consent_first(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->fromSpa()->postJson('/api/questionnaire')
            ->assertStatus(409)
            ->assertJsonPath('code', 'health_consent_required');
        $this->postJson('/api/questionnaire/consent', ['accept' => false])->assertJsonValidationErrors('accept');
        $this->assertDatabaseCount('questionnaires', 0);
    }

    public function test_consent_is_recorded_with_version_and_ip(): void
    {
        $user = $this->consented();

        $consent = $user->consents()->where('type', ConsentType::HealthData)->sole();
        $this->assertSame('2026-11-22', $consent->version);
        $this->assertNotNull($consent->ip_address);
        $this->getJson('/api/questionnaire')->assertJsonPath('health_consent', true);

        // Accepting twice does not duplicate the record.
        $this->postJson('/api/questionnaire/consent', ['accept' => true])->assertOk();
        $this->assertSame(1, $user->consents()->where('type', ConsentType::HealthData)->count());
    }

    public function test_requires_a_verified_email(): void
    {
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)->fromSpa()->getJson('/api/questionnaire')->assertForbidden();
    }

    public function test_saves_section_by_section_and_resumes_the_same_draft(): void
    {
        $this->consented();
        $this->postJson('/api/questionnaire')->assertCreated()
            ->assertJsonPath('data.version', 1)
            ->assertJsonPath('data.filled_sections', []);

        $this->putJson('/api/questionnaire/sections/personal', self::SECTIONS['personal'])
            ->assertOk()
            ->assertJsonPath('data.personal', ['sex' => 'female', 'height_cm' => 165.4, 'weight_kg' => 62.35])
            ->assertJsonPath('data.filled_sections', ['personal']);

        // Coming back later: same draft, answers kept.
        $this->postJson('/api/questionnaire')->assertOk()->assertJsonPath('data.version', 1);
        $this->getJson('/api/questionnaire')
            ->assertJsonPath('data.personal.sex', 'female')
            ->assertJsonPath('data.completed_at', null);
        $this->assertDatabaseCount('questionnaires', 1);
    }

    public function test_normalizes_training_days_goal_pace_and_cardio(): void
    {
        $this->filled([
            'goal' => ['goal' => 'maintain', 'goal_pace' => 'light'],
            'training' => [...self::SECTIONS['training'], 'wants_cardio' => false],
        ]);

        $this->getJson('/api/questionnaire')
            ->assertJsonPath('data.training.training_days', ['mon', 'wed', 'fri'])
            ->assertJsonPath('data.training.cardio_preference', null)
            ->assertJsonPath('data.goal', ['goal' => 'maintain', 'goal_pace' => null])
            ->assertJsonPath('data.filled_sections', ['personal', 'health', 'routine', 'goal', 'training', 'diet']);
    }

    public function test_validates_each_section(): void
    {
        $this->consented();
        $this->postJson('/api/questionnaire');

        $this->putJson('/api/questionnaire/sections/personal', ['sex' => 'other', 'height_cm' => 90, 'weight_kg' => 500])
            ->assertJsonValidationErrors(['sex', 'height_cm', 'weight_kg']);
        $this->putJson('/api/questionnaire/sections/goal', ['goal' => 'gain_muscle'])
            ->assertJsonValidationErrors('goal_pace');
        $this->putJson('/api/questionnaire/sections/training', [
            ...self::SECTIONS['training'], 'training_days' => ['mon'], 'session_minutes' => 50, 'cardio_preference' => null,
        ])->assertJsonValidationErrors(['training_days', 'session_minutes', 'cardio_preference']);
        $this->putJson('/api/questionnaire/sections/training', [...self::SECTIONS['training'], 'training_days' => ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']])
            ->assertJsonValidationErrors('training_days');
        $this->putJson('/api/questionnaire/sections/diet', ['diet_restrictions' => ['keto'], 'meals_per_day' => 7, 'diet_split' => 'x'])
            ->assertJsonValidationErrors(['diet_restrictions.0', 'meals_per_day', 'diet_split']);
        $this->putJson('/api/questionnaire/sections/unknown', [])->assertNotFound();
    }

    public function test_health_needs_about_you_first_and_pregnancy_only_for_women(): void
    {
        $this->consented();
        $this->postJson('/api/questionnaire');

        $this->putJson('/api/questionnaire/sections/health', self::SECTIONS['health'])->assertStatus(422);

        $this->putJson('/api/questionnaire/sections/personal', self::SECTIONS['personal']);
        $this->putJson('/api/questionnaire/sections/health', ['par_q' => self::NO_PAR_Q, 'conditions' => []])
            ->assertJsonValidationErrors('pregnant_or_lactating');
        $this->putJson('/api/questionnaire/sections/health', ['par_q' => [false], 'pregnant_or_lactating' => false, 'conditions' => ['flu']])
            ->assertJsonValidationErrors(['par_q', 'conditions.0']);

        $this->putJson('/api/questionnaire/sections/personal', [...self::SECTIONS['personal'], 'sex' => 'male']);
        $this->putJson('/api/questionnaire/sections/health', ['par_q' => self::NO_PAR_Q, 'pregnant_or_lactating' => true, 'conditions' => []])
            ->assertOk()
            ->assertJsonPath('data.health.pregnant_or_lactating', null)
            ->assertJsonPath('data.health.result', 'clear');
    }

    public function test_health_answers_are_encrypted_in_the_database(): void
    {
        $this->filled(['health' => [...self::SECTIONS['health'], 'conditions' => ['diabetes']]]);

        $raw = DB::table('health_screenings')->value('answers');
        $this->assertStringNotContainsString('diabetes', $raw);
        $this->assertSame(['diabetes'], HealthScreening::sole()->answers['conditions']);
    }

    public function test_completing_needs_every_section_and_the_disclaimer(): void
    {
        $this->consented();
        $this->postJson('/api/questionnaire');
        $this->postJson('/api/questionnaire/complete', ['accept_disclaimer' => true])
            ->assertJsonValidationErrors('questionnaire');

        foreach (self::SECTIONS as $section => $body) {
            $this->putJson("/api/questionnaire/sections/{$section}", $body);
        }
        $this->postJson('/api/questionnaire/complete')->assertJsonValidationErrors('accept_disclaimer');

        $this->postJson('/api/questionnaire/complete', ['accept_disclaimer' => true])
            ->assertOk()
            ->assertJsonPath('data.blocked', false);
        $q = Questionnaire::sole();
        $this->assertNotNull($q->completed_at);
        $this->assertNotNull($q->disclaimer_accepted_at);
    }

    public function test_any_yes_blocks_and_completes_without_the_disclaimer(): void
    {
        $par = self::NO_PAR_Q;
        $par[3] = true;
        $this->filled(['health' => [...self::SECTIONS['health'], 'par_q' => $par]]);

        $this->getJson('/api/questionnaire')->assertJsonPath('data.blocked', true)->assertJsonPath('data.health.result', 'blocked');
        $this->postJson('/api/questionnaire/complete')->assertOk()->assertJsonPath('data.blocked', true);
        $this->assertNull(Questionnaire::sole()->disclaimer_accepted_at);
    }

    public function test_changing_health_answers_needs_confirmation_and_is_logged(): void
    {
        $this->filled(['health' => [...self::SECTIONS['health'], 'conditions' => ['hypertension']]]);
        $this->postJson('/api/questionnaire/complete');

        $clear = self::SECTIONS['health'];
        $this->putJson('/api/questionnaire/sections/health', $clear)->assertJsonValidationErrors('confirm_correct');
        $this->assertSame('blocked', HealthScreening::sole()->result);

        $this->putJson('/api/questionnaire/sections/health', [...$clear, 'confirm_correct' => true])
            ->assertOk()
            ->assertJsonPath('data.blocked', false)
            ->assertJsonPath('data.health.conditions', []);

        $rectification = HealthScreening::sole()->rectifications()->sole();
        $this->assertSame(['hypertension'], $rectification->previous_answers['conditions']);
        $this->assertSame([], $rectification->new_answers['conditions']);
        $this->assertSame(['blocked', 'clear'], [$rectification->previous_result, $rectification->new_result]);
        $this->assertNotNull($rectification->confirmed_at);
        $this->getJson('/api/questionnaire')->assertJsonPath('data.health.rectified_at', $rectification->confirmed_at->toIso8601String());

        // Saving the same answers again is not a rectification.
        $this->putJson('/api/questionnaire/sections/health', $clear)->assertOk();
        $this->assertSame(1, HealthScreening::sole()->rectifications()->count());
    }

    public function test_changing_the_sex_that_drops_a_pregnancy_answer_is_a_rectification(): void
    {
        $this->filled(['health' => [...self::SECTIONS['health'], 'pregnant_or_lactating' => true]]);
        $this->getJson('/api/questionnaire')->assertJsonPath('data.blocked', true);

        $male = [...self::SECTIONS['personal'], 'sex' => 'male'];
        $this->putJson('/api/questionnaire/sections/personal', $male)->assertJsonValidationErrors('confirm_correct');
        $this->assertSame('female', Questionnaire::sole()->sex);

        $this->putJson('/api/questionnaire/sections/personal', [...$male, 'confirm_correct' => true])
            ->assertOk()
            ->assertJsonPath('data.blocked', false);
        $this->assertSame(1, HealthScreening::sole()->rectifications()->count());

        // Back to female: the pregnancy question must be answered again.
        $this->putJson('/api/questionnaire/sections/personal', self::SECTIONS['personal'])
            ->assertOk()
            ->assertJsonPath('data.filled_sections', ['personal', 'routine', 'goal', 'training', 'diet']);
    }

    public function test_items_of_a_completed_version_can_be_edited_in_place(): void
    {
        $this->filled();
        $this->postJson('/api/questionnaire/complete', ['accept_disclaimer' => true]);

        $this->putJson('/api/questionnaire/sections/goal', ['goal' => 'gain_muscle', 'goal_pace' => 'light'])
            ->assertOk()
            ->assertJsonPath('data.version', 1)
            ->assertJsonPath('data.goal.goal', 'gain_muscle');
        $this->assertNotNull(Questionnaire::sole()->completed_at);
    }

    public function test_reassessment_starts_a_new_version_prefilled(): void
    {
        $user = $this->filled();
        $this->postJson('/api/questionnaire/complete', ['accept_disclaimer' => true]);

        $this->postJson('/api/questionnaire')
            ->assertCreated()
            ->assertJsonPath('data.version', 2)
            ->assertJsonPath('data.completed_at', null)
            ->assertJsonPath('data.personal.weight_kg', 62.35)
            ->assertJsonPath('data.training.training_days', ['mon', 'wed', 'fri'])
            ->assertJsonPath('data.health.result', 'clear');

        $this->assertSame([1, 2], $user->questionnaires()->orderBy('version')->pluck('version')->all());
        $this->assertSame(2, HealthScreening::count());
        $this->putJson('/api/questionnaire/sections/routine', ['work_activity' => 'active']);
        $this->assertSame('sedentary', $user->questionnaires()->where('version', 1)->value('work_activity'));
    }

    public function test_each_user_only_sees_their_own_questionnaire(): void
    {
        $this->filled();
        $other = $this->consented(User::factory()->create());

        $this->actingAs($other)->getJson('/api/questionnaire')->assertJsonPath('data', null);
        $this->putJson('/api/questionnaire/sections/routine', ['work_activity' => 'active'])->assertNotFound();
    }

    public function test_export_includes_questionnaires_and_rectifications(): void
    {
        $this->filled(['health' => [...self::SECTIONS['health'], 'conditions' => ['other']]]);
        $this->putJson('/api/questionnaire/sections/health', [...self::SECTIONS['health'], 'confirm_correct' => true]);

        $this->getJson('/api/profile/export')
            ->assertOk()
            ->assertJsonPath('questionnaires.0.version', 1)
            ->assertJsonPath('questionnaires.0.goal', 'lose_fat')
            ->assertJsonPath('questionnaires.0.health_screening.result', 'clear')
            ->assertJsonPath('questionnaires.0.health_screening.rectifications.0.previous_answers.conditions', ['other'])
            ->assertJsonPath('consents.0.type', 'health_data');
    }

    public function test_deleting_the_account_removes_the_health_data(): void
    {
        $this->filled();
        $this->putJson('/api/questionnaire/sections/health', [...self::SECTIONS['health'], 'conditions' => ['other'], 'confirm_correct' => true]);

        $this->deleteJson('/api/profile', ['password' => 'password'])->assertOk();

        $this->assertDatabaseCount('questionnaires', 0);
        $this->assertDatabaseCount('health_screenings', 0);
        $this->assertDatabaseCount('health_screening_rectifications', 0);
    }
}
