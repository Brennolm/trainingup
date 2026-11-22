<?php

namespace Tests\Feature\Auth;

use App\Mail\VerificationCodeMail;
use App\Models\User;
use App\Services\EmailVerificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private string $code;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->user = User::factory()->unverified()->create();
        app(EmailVerificationService::class)->send($this->user);
        Mail::assertSent(VerificationCodeMail::class, function (VerificationCodeMail $mail) {
            $this->code = $mail->code;

            return true;
        });
    }

    private function verify(string $code)
    {
        return $this->actingAs($this->user)->fromSpa()->postJson('/api/auth/email/verify', ['code' => $code]);
    }

    private function wrongCode(): string
    {
        return $this->code === '000000' ? '111111' : '000000';
    }

    public function test_the_right_code_verifies_the_email(): void
    {
        $this->verify($this->code)->assertOk()->assertJsonPath('data.email_verified', true);

        $this->assertTrue($this->user->fresh()->hasVerifiedEmail());
        $this->assertDatabaseCount('email_verification_codes', 0);
    }

    public function test_a_wrong_code_is_rejected_and_counts_as_an_attempt(): void
    {
        $this->verify($this->wrongCode())->assertUnprocessable()->assertJsonPath('code', 'invalid');

        $this->assertSame(1, $this->user->emailVerificationCode()->first()->attempts);
        $this->assertFalse($this->user->fresh()->hasVerifiedEmail());
    }

    public function test_after_five_wrong_attempts_even_the_right_code_is_refused(): void
    {
        foreach (range(1, 4) as $i) {
            $this->verify($this->wrongCode())->assertJsonPath('code', 'invalid');
        }
        $this->verify($this->wrongCode())->assertJsonPath('code', 'too_many_attempts');

        $this->verify($this->code)->assertUnprocessable()->assertJsonPath('code', 'too_many_attempts');
        $this->assertFalse($this->user->fresh()->hasVerifiedEmail());
    }

    public function test_the_code_expires_after_15_minutes(): void
    {
        $this->travel(16)->minutes();

        $this->verify($this->code)->assertUnprocessable()->assertJsonPath('code', 'expired');
    }

    public function test_the_code_is_stored_hashed_never_in_plain_text(): void
    {
        $this->assertNotSame($this->code, $this->user->emailVerificationCode()->first()->code_hash);
        $this->assertDatabaseMissing('email_verification_codes', ['code_hash' => $this->code]);
    }

    public function test_resend_waits_60_seconds_then_issues_a_new_code(): void
    {
        $this->actingAs($this->user)->fromSpa()->postJson('/api/auth/email/resend')
            ->assertStatus(429)
            ->assertJsonPath('retry_after', 60);

        $this->travel(61)->seconds();

        $this->actingAs($this->user)->fromSpa()->postJson('/api/auth/email/resend')
            ->assertOk()
            ->assertJsonPath('retry_after', 60);
        Mail::assertSent(VerificationCodeMail::class, 2);
    }

    public function test_a_new_code_resets_the_attempts(): void
    {
        foreach (range(1, 5) as $i) {
            $this->verify($this->wrongCode());
        }
        $this->travel(61)->seconds();
        $this->actingAs($this->user)->fromSpa()->postJson('/api/auth/email/resend')->assertOk();

        $this->assertSame(0, $this->user->emailVerificationCode()->first()->attempts);
    }

    public function test_unverified_accounts_cannot_use_the_app(): void
    {
        $this->actingAs($this->user)->fromSpa()->patchJson('/api/profile/preferences', ['theme' => 'light'])
            ->assertForbidden()
            ->assertJsonPath('code', 'email_unverified');
    }

    public function test_unverified_accounts_can_still_read_their_own_data(): void
    {
        $this->actingAs($this->user)->fromSpa()->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.email_verified', false);
    }

    public function test_guests_cannot_verify(): void
    {
        $this->fromSpa()->postJson('/api/auth/email/verify', ['code' => '123456'])->assertUnauthorized();
    }
}
