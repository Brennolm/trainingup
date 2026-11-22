<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\TwoFactorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class TwoFactorTest extends TestCase
{
    use RefreshDatabase;

    private function otp(string $secret): string
    {
        return (new Google2FA)->getCurrentOtp($secret);
    }

    /** @return array{0: User, 1: list<string>} user with 2FA on + its recovery codes */
    private function userWithTwoFactor(array $attributes = []): array
    {
        $user = User::factory()->create(['password' => 'senha1234', ...$attributes]);
        $user->forceFill([
            'two_factor_secret' => (new Google2FA)->generateSecretKey(32),
            'two_factor_confirmed_at' => now(),
        ])->save();
        $codes = app(TwoFactorService::class)->regenerateRecoveryCodes($user);

        return [$user->fresh(), $codes];
    }

    public function test_enabling_shows_a_qr_code_and_needs_the_password(): void
    {
        $user = User::factory()->create(['password' => 'senha1234']);

        $this->actingAs($user)->fromSpa()->postJson('/api/profile/two-factor', ['password' => 'errada123'])
            ->assertJsonValidationErrors('password');

        $response = $this->actingAs($user)->fromSpa()->postJson('/api/profile/two-factor', ['password' => 'senha1234'])
            ->assertOk()
            ->assertJsonStructure(['data' => ['secret', 'otpauth_url', 'qr_svg']]);

        $this->assertStringStartsWith('otpauth://totp/', $response->json('data.otpauth_url'));
        $this->assertStringContainsString('<svg', $response->json('data.qr_svg'));
        $user->refresh();
        $this->assertSame($response->json('data.secret'), $user->two_factor_secret);
        $this->assertFalse($user->hasTwoFactorEnabled(), 'not active before the first code');
    }

    public function test_the_secret_is_encrypted_in_the_database(): void
    {
        [$user] = $this->userWithTwoFactor();

        $raw = $user->getConnection()->table('users')->where('id', $user->id)->value('two_factor_secret');
        $this->assertNotSame($user->two_factor_secret, $raw);
    }

    public function test_google_only_accounts_must_create_a_password_first(): void
    {
        $user = User::factory()->create(['password' => null, 'google_id' => 'g-1']);

        $this->actingAs($user)->fromSpa()->postJson('/api/profile/two-factor', ['password' => 'x'])
            ->assertStatus(422)
            ->assertJsonPath('code', 'needs_password');
    }

    public function test_confirming_with_a_valid_code_turns_it_on_and_returns_recovery_codes(): void
    {
        $user = User::factory()->create(['password' => 'senha1234']);
        $secret = $this->actingAs($user)->fromSpa()
            ->postJson('/api/profile/two-factor', ['password' => 'senha1234'])->json('data.secret');

        $this->actingAs($user)->fromSpa()->postJson('/api/profile/two-factor/confirm', ['code' => '000000'])
            ->assertJsonValidationErrors(['code' => 'Código incorreto. Confira no app autenticador e tente de novo.']);

        $response = $this->actingAs($user)->fromSpa()
            ->postJson('/api/profile/two-factor/confirm', ['code' => $this->otp($secret)])
            ->assertOk()
            ->assertJsonPath('data.two_factor_enabled', true)
            ->assertJsonPath('data.recovery_codes_left', 8);

        $codes = $response->json('recovery_codes');
        $this->assertCount(8, $codes);
        $this->assertMatchesRegularExpression('/^[A-Z2-9]{5}-[A-Z2-9]{5}$/', $codes[0]);
        $this->assertNotContains($codes[0], $user->fresh()->two_factor_recovery_codes, 'only hashes are stored');
    }

    public function test_cannot_start_again_while_enabled(): void
    {
        [$user] = $this->userWithTwoFactor();

        $this->actingAs($user)->fromSpa()->postJson('/api/profile/two-factor', ['password' => 'senha1234'])
            ->assertStatus(409);
    }

    public function test_sign_in_asks_for_the_code_instead_of_signing_in(): void
    {
        [$user] = $this->userWithTwoFactor(['email' => 'ana@example.com']);

        $this->fromSpa()->postJson('/api/auth/login', ['email' => 'ana@example.com', 'password' => 'senha1234'])
            ->assertOk()
            ->assertExactJson(['two_factor' => true]);

        $this->assertGuest('web');
    }

    public function test_the_app_code_completes_the_sign_in(): void
    {
        [$user] = $this->userWithTwoFactor(['email' => 'ana@example.com']);
        $this->fromSpa()->postJson('/api/auth/login', ['email' => 'ana@example.com', 'password' => 'senha1234']);

        $this->fromSpa()->postJson('/api/auth/two-factor-challenge', ['code' => '000000'])
            ->assertJsonValidationErrors('code');
        $this->assertGuest('web');

        $this->fromSpa()->postJson('/api/auth/two-factor-challenge', ['code' => $this->otp($user->two_factor_secret)])
            ->assertOk()
            ->assertJsonPath('data.id', $user->id);

        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_a_used_code_cannot_be_replayed(): void
    {
        [$user] = $this->userWithTwoFactor();
        $service = app(TwoFactorService::class);
        $code = $this->otp($user->two_factor_secret);

        $this->assertTrue($service->verifyTotp($user, $code));
        $this->assertFalse($service->verifyTotp($user, $code));
    }

    public function test_a_recovery_code_signs_in_once(): void
    {
        [$user, $codes] = $this->userWithTwoFactor(['email' => 'ana@example.com']);

        $this->fromSpa()->postJson('/api/auth/login', ['email' => 'ana@example.com', 'password' => 'senha1234']);
        $this->fromSpa()->postJson('/api/auth/two-factor-challenge', ['code' => strtolower($codes[0])])
            ->assertOk()
            ->assertJsonPath('data.recovery_codes_left', 7);

        $this->fromSpa()->postJson('/api/auth/logout');
        $this->fromSpa()->postJson('/api/auth/login', ['email' => 'ana@example.com', 'password' => 'senha1234']);
        $this->fromSpa()->postJson('/api/auth/two-factor-challenge', ['code' => $codes[0]])
            ->assertJsonValidationErrors('code');
    }

    public function test_the_challenge_needs_a_password_step_first(): void
    {
        $this->userWithTwoFactor();

        $this->fromSpa()->postJson('/api/auth/two-factor-challenge', ['code' => '123456'])
            ->assertStatus(422)
            ->assertJsonPath('code', 'two_factor_expired');
    }

    public function test_the_challenge_without_a_session_gets_a_clean_error(): void
    {
        $this->postJson('/api/auth/two-factor-challenge', ['code' => '123456'])
            ->assertStatus(422)
            ->assertJsonPath('code', 'two_factor_expired');
    }

    public function test_the_challenge_expires_after_ten_minutes(): void
    {
        [$user] = $this->userWithTwoFactor(['email' => 'ana@example.com']);
        $this->fromSpa()->postJson('/api/auth/login', ['email' => 'ana@example.com', 'password' => 'senha1234']);

        $this->travel(11)->minutes();

        $this->fromSpa()->postJson('/api/auth/two-factor-challenge', ['code' => $this->otp($user->two_factor_secret)])
            ->assertJsonPath('code', 'two_factor_expired');
        $this->assertGuest('web');
    }

    public function test_five_wrong_codes_drop_the_pending_sign_in(): void
    {
        [$user] = $this->userWithTwoFactor(['email' => 'ana@example.com']);
        $this->fromSpa()->postJson('/api/auth/login', ['email' => 'ana@example.com', 'password' => 'senha1234']);

        foreach (range(1, 4) as $i) {
            $this->fromSpa()->postJson('/api/auth/two-factor-challenge', ['code' => '000000'])
                ->assertJsonValidationErrors('code');
        }
        $this->fromSpa()->postJson('/api/auth/two-factor-challenge', ['code' => '000000'])
            ->assertJsonPath('code', 'two_factor_expired');

        $this->fromSpa()->postJson('/api/auth/two-factor-challenge', ['code' => $this->otp($user->two_factor_secret)])
            ->assertJsonPath('code', 'two_factor_expired');
        $this->assertGuest('web');
    }

    public function test_disabling_needs_password_and_code(): void
    {
        [$user, $codes] = $this->userWithTwoFactor();

        $this->actingAs($user)->fromSpa()->deleteJson('/api/profile/two-factor', ['password' => 'errada123', 'code' => $codes[0]])
            ->assertJsonValidationErrors('password');
        $this->actingAs($user)->fromSpa()->deleteJson('/api/profile/two-factor', ['password' => 'senha1234', 'code' => '000000'])
            ->assertJsonValidationErrors('code');
        $this->assertTrue($user->fresh()->hasTwoFactorEnabled());

        $this->actingAs($user)->fromSpa()
            ->deleteJson('/api/profile/two-factor', ['password' => 'senha1234', 'code' => $this->otp($user->two_factor_secret)])
            ->assertOk()
            ->assertJsonPath('data.two_factor_enabled', false)
            ->assertJsonPath('data.recovery_codes_left', null);

        $user->refresh();
        $this->assertNull($user->two_factor_secret);
        $this->assertNull($user->two_factor_recovery_codes);
    }

    public function test_disabling_also_accepts_a_recovery_code(): void
    {
        [$user, $codes] = $this->userWithTwoFactor();

        $this->actingAs($user)->fromSpa()
            ->deleteJson('/api/profile/two-factor', ['password' => 'senha1234', 'code' => $codes[3]])
            ->assertOk();
        $this->assertFalse($user->fresh()->hasTwoFactorEnabled());
    }

    public function test_new_recovery_codes_replace_the_old_ones(): void
    {
        [$user, $old] = $this->userWithTwoFactor();

        $new = $this->actingAs($user)->fromSpa()
            ->postJson('/api/profile/two-factor/recovery-codes', ['password' => 'senha1234'])
            ->assertOk()
            ->json('recovery_codes');

        $this->assertCount(8, $new);
        $service = app(TwoFactorService::class);
        $this->assertFalse($service->useRecoveryCode($user->fresh(), $old[0]));
        $this->assertTrue($service->useRecoveryCode($user->fresh(), $new[0]));
    }

    public function test_profile_endpoints_require_sign_in(): void
    {
        $this->fromSpa()->postJson('/api/profile/two-factor', ['password' => 'x'])->assertUnauthorized();
        $this->fromSpa()->deleteJson('/api/profile/two-factor', ['password' => 'x', 'code' => 'x'])->assertUnauthorized();
    }
}
