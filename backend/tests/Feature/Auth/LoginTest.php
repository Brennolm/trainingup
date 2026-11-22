<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_signs_in_with_email_and_password(): void
    {
        $user = User::factory()->create(['email' => 'ana@example.com', 'password' => 'senha1234']);

        $this->fromSpa()->postJson('/api/auth/login', ['email' => ' ANA@example.com', 'password' => 'senha1234'])
            ->assertOk()
            ->assertJsonPath('data.id', $user->id);

        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_keeps_the_user_signed_in_by_default(): void
    {
        User::factory()->create(['email' => 'ana@example.com', 'password' => 'senha1234']);

        $response = $this->fromSpa()->postJson('/api/auth/login', ['email' => 'ana@example.com', 'password' => 'senha1234']);

        $remember = collect($response->headers->getCookies())
            ->first(fn ($cookie) => str_starts_with($cookie->getName(), 'remember_web_'));
        $this->assertNotNull($remember, 'remember-me cookie should be set');
    }

    public function test_wrong_credentials_get_a_generic_message(): void
    {
        User::factory()->create(['email' => 'ana@example.com', 'password' => 'senha1234']);

        $this->fromSpa()->postJson('/api/auth/login', ['email' => 'ana@example.com', 'password' => 'errada123'])
            ->assertJsonValidationErrors(['email' => 'E-mail ou senha incorretos.']);
        $this->fromSpa()->postJson('/api/auth/login', ['email' => 'ninguem@example.com', 'password' => 'senha1234'])
            ->assertJsonValidationErrors(['email' => 'E-mail ou senha incorretos.']);

        $this->assertGuest('web');
    }

    public function test_is_rate_limited_after_five_attempts_per_minute(): void
    {
        User::factory()->create(['email' => 'ana@example.com', 'password' => 'senha1234']);

        foreach (range(1, 5) as $i) {
            $this->fromSpa()->postJson('/api/auth/login', ['email' => 'ana@example.com', 'password' => 'errada123'])
                ->assertUnprocessable();
        }

        $this->fromSpa()->postJson('/api/auth/login', ['email' => 'ana@example.com', 'password' => 'senha1234'])
            ->assertStatus(429)
            ->assertJsonStructure(['message', 'retry_after']);
    }

    public function test_logout_ends_the_session(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web')->fromSpa()->postJson('/api/auth/logout')->assertOk();

        $this->assertGuest('web');
    }

    public function test_guests_get_null_instead_of_an_error(): void
    {
        $this->fromSpa()->getJson('/api/user')
            ->assertOk()
            ->assertExactJson(['data' => null]);
    }

    public function test_protected_endpoints_still_require_a_session(): void
    {
        $this->fromSpa()->patchJson('/api/profile/preferences', ['theme' => 'light'])
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Entre na sua conta para continuar.');
    }
}
