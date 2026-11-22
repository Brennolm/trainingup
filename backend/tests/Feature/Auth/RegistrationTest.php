<?php

namespace Tests\Feature\Auth;

use App\Mail\VerificationCodeMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, mixed> */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Ana Souza',
            'email' => 'Ana@Example.com ',
            'password' => 'senha1234',
            'password_confirmation' => 'senha1234',
            'birth_date' => now()->subYears(25)->toDateString(),
            'accept_terms' => true,
        ], $overrides);
    }

    public function test_creates_an_unverified_account_on_the_free_plan_and_signs_in(): void
    {
        Mail::fake();

        $response = $this->fromSpa()->postJson('/api/auth/register', $this->payload());

        $response->assertCreated()
            ->assertJsonPath('data.email', 'ana@example.com')
            ->assertJsonPath('data.email_verified', false)
            ->assertJsonPath('data.plan', 'free')
            ->assertJsonPath('data.preferences.theme', 'dark')
            ->assertJsonPath('data.preferences.weight_unit', 'kg')
            ->assertJsonPath('meta.verification_email_sent', true);

        $user = User::where('email', 'ana@example.com')->firstOrFail();
        $this->assertAuthenticatedAs($user, 'web');
        $this->assertNotSame('senha1234', $user->password);
    }

    public function test_records_terms_and_privacy_consents_with_version_and_ip(): void
    {
        Mail::fake();

        $this->fromSpa()->postJson('/api/auth/register', $this->payload())->assertCreated();

        $consents = User::firstWhere('email', 'ana@example.com')->consents;
        $this->assertEqualsCanonicalizing(['terms', 'privacy'], $consents->pluck('type')->map->value->all());
        $this->assertSame(config('trainingup.legal_versions.terms'), $consents->firstWhere('type.value', 'terms')->version);
        $this->assertSame('127.0.0.1', $consents->first()->ip_address);
        $this->assertNotNull($consents->first()->accepted_at);
    }

    public function test_sends_a_six_digit_verification_code(): void
    {
        Mail::fake();

        $this->fromSpa()->postJson('/api/auth/register', $this->payload())->assertCreated();

        Mail::assertSent(VerificationCodeMail::class, function (VerificationCodeMail $mail) {
            return $mail->hasTo('ana@example.com') && preg_match('/^\d{6}$/', $mail->code) === 1;
        });
        $this->assertNotNull(User::firstWhere('email', 'ana@example.com')->emailVerificationCode);
    }

    public function test_still_creates_the_account_when_the_email_fails_to_send(): void
    {
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('SMTP down'));

        $this->fromSpa()->postJson('/api/auth/register', $this->payload())
            ->assertCreated()
            ->assertJsonPath('meta.verification_email_sent', false);
    }

    public function test_blocks_people_under_18(): void
    {
        Mail::fake();
        $almost18 = now()->subYears(18)->addDay()->toDateString();

        $this->fromSpa()->postJson('/api/auth/register', $this->payload(['birth_date' => $almost18]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['birth_date' => 'Você precisa ter 18 anos ou mais para usar o Training Up.']);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_accepts_someone_turning_18_today(): void
    {
        Mail::fake();

        $this->fromSpa()->postJson('/api/auth/register', $this->payload(['birth_date' => now()->subYears(18)->toDateString()]))
            ->assertCreated();
    }

    public function test_requires_accepting_the_terms(): void
    {
        $this->fromSpa()->postJson('/api/auth/register', $this->payload(['accept_terms' => false]))
            ->assertJsonValidationErrors(['accept_terms' => 'Você precisa aceitar os Termos de Uso e a Política de Privacidade.']);
    }

    public function test_password_needs_8_characters_with_a_letter_and_a_number(): void
    {
        foreach (['abc123', '12345678', 'abcdefgh'] as $weak) {
            $this->fromSpa()->postJson('/api/auth/register', $this->payload([
                'password' => $weak,
                'password_confirmation' => $weak,
            ]))->assertJsonValidationErrors('password');
        }
    }

    public function test_rejects_an_email_that_already_has_an_account(): void
    {
        User::factory()->create(['email' => 'ana@example.com']);

        $this->fromSpa()->postJson('/api/auth/register', $this->payload())
            ->assertJsonValidationErrors(['email' => 'Já existe uma conta com este e-mail.']);
    }
}
