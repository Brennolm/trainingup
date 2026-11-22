<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordChangeTest extends TestCase
{
    use RefreshDatabase;

    public function test_changes_the_password_with_the_current_one(): void
    {
        $user = User::factory()->create(['password' => 'antiga123']);

        $this->actingAs($user)->fromSpa()->putJson('/api/profile/password', [
            'current_password' => 'antiga123',
            'password' => 'novaSenha9',
            'password_confirmation' => 'novaSenha9',
        ])->assertOk();

        $this->assertTrue(Hash::check('novaSenha9', $user->fresh()->password));
    }

    public function test_rejects_a_wrong_current_password(): void
    {
        $user = User::factory()->create(['password' => 'antiga123']);

        $this->actingAs($user)->fromSpa()->putJson('/api/profile/password', [
            'current_password' => 'errada123',
            'password' => 'novaSenha9',
            'password_confirmation' => 'novaSenha9',
        ])->assertJsonValidationErrors(['current_password' => 'A senha informada está incorreta.']);
    }

    public function test_google_only_accounts_create_a_password_without_a_current_one(): void
    {
        $user = User::factory()->create(['google_id' => 'g-1', 'password' => null]);

        $this->actingAs($user)->fromSpa()->putJson('/api/profile/password', [
            'password' => 'novaSenha9',
            'password_confirmation' => 'novaSenha9',
        ])->assertOk()->assertJsonPath('data.has_password', true);
    }

    public function test_the_new_password_follows_the_policy(): void
    {
        $user = User::factory()->create(['password' => 'antiga123']);

        $this->actingAs($user)->fromSpa()->putJson('/api/profile/password', [
            'current_password' => 'antiga123',
            'password' => 'fraca',
            'password_confirmation' => 'fraca',
        ])->assertJsonValidationErrors('password');
    }
}
