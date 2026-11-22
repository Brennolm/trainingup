<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_sends_a_reset_link_pointing_to_the_app(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'ana@example.com']);

        $this->fromSpa()->postJson('/api/auth/forgot-password', ['email' => 'Ana@example.com'])
            ->assertOk()
            ->assertJsonPath('message', 'Se houver uma conta com este e-mail, enviamos um link para redefinir a senha.');

        Notification::assertSentTo($user, ResetPasswordNotification::class, function ($n) use ($user) {
            return str_starts_with($n->resetUrl($user), 'http://localhost:5180/redefinir-senha?token=');
        });
    }

    public function test_answers_the_same_for_unknown_emails(): void
    {
        Notification::fake();

        $this->fromSpa()->postJson('/api/auth/forgot-password', ['email' => 'ninguem@example.com'])
            ->assertOk()
            ->assertJsonPath('message', 'Se houver uma conta com este e-mail, enviamos um link para redefinir a senha.');

        Notification::assertNothingSent();
    }

    public function test_resets_the_password_with_a_valid_token_and_confirms_the_email(): void
    {
        $user = User::factory()->unverified()->create(['email' => 'ana@example.com']);
        $token = Password::createToken($user);

        $this->fromSpa()->postJson('/api/auth/reset-password', [
            'token' => $token,
            'email' => 'ana@example.com',
            'password' => 'novaSenha9',
            'password_confirmation' => 'novaSenha9',
        ])->assertOk();

        $user->refresh();
        $this->assertTrue(Hash::check('novaSenha9', $user->password));
        $this->assertTrue($user->hasVerifiedEmail());
    }

    public function test_rejects_an_invalid_token(): void
    {
        User::factory()->create(['email' => 'ana@example.com']);

        $this->fromSpa()->postJson('/api/auth/reset-password', [
            'token' => 'invalido',
            'email' => 'ana@example.com',
            'password' => 'novaSenha9',
            'password_confirmation' => 'novaSenha9',
        ])->assertJsonValidationErrors(['token' => 'Este link de redefinição é inválido ou expirou. Peça um novo link.']);
    }

    public function test_the_new_password_follows_the_policy(): void
    {
        $user = User::factory()->create(['email' => 'ana@example.com']);

        $this->fromSpa()->postJson('/api/auth/reset-password', [
            'token' => Password::createToken($user),
            'email' => 'ana@example.com',
            'password' => 'fraca',
            'password_confirmation' => 'fraca',
        ])->assertJsonValidationErrors('password');
    }
}
