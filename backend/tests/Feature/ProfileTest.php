<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_free_plan_exists_after_migrations(): void
    {
        $this->assertTrue(Plan::free()->is_active);
    }

    public function test_updates_name_and_birth_date(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->fromSpa()->patchJson('/api/profile', [
            'name' => '  Ana Lima ',
            'birth_date' => '1990-05-20',
        ])->assertOk()
            ->assertJsonPath('data.name', 'Ana Lima')
            ->assertJsonPath('data.birth_date', '1990-05-20');
    }

    public function test_profile_keeps_the_age_rule(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->fromSpa()->patchJson('/api/profile', [
            'name' => 'Ana',
            'birth_date' => now()->subYears(17)->toDateString(),
        ])->assertJsonValidationErrors('birth_date');
    }

    public function test_the_email_cannot_be_changed_through_the_profile(): void
    {
        $user = User::factory()->create(['email' => 'ana@example.com']);

        $this->actingAs($user)->fromSpa()->patchJson('/api/profile', [
            'name' => 'Ana',
            'birth_date' => '1990-05-20',
            'email' => 'outro@example.com',
        ])->assertOk();

        $this->assertSame('ana@example.com', $user->fresh()->email);
    }

    public function test_saves_theme_and_unit_preferences(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->fromSpa()->patchJson('/api/profile/preferences', [
            'theme' => 'light',
            'weight_unit' => 'lb',
            'length_unit' => 'ft_in',
        ])->assertOk()
            ->assertJsonPath('data.preferences', [
                'theme' => 'light',
                'weight_unit' => 'lb',
                'length_unit' => 'ft_in',
                'locale' => 'pt_BR',
            ]);
    }

    public function test_rejects_unknown_preference_values(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->fromSpa()->patchJson('/api/profile/preferences', ['theme' => 'purple', 'weight_unit' => 'stone'])
            ->assertJsonValidationErrors(['theme', 'weight_unit']);
    }
}
