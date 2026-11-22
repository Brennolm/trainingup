<?php

namespace Tests\Feature\Auth;

use App\Http\Controllers\Auth\GoogleAuthController;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as GoogleUser;
use Mockery;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    private function fakeGoogle(string $id = 'g-123', string $email = 'Ana@Gmail.com', bool $verified = true, string $name = 'Ana Souza'): void
    {
        $googleUser = (new GoogleUser)
            ->setRaw(['email_verified' => $verified])
            ->map(['id' => $id, 'name' => $name, 'email' => $email]);

        $provider = Mockery::mock();
        $provider->shouldReceive('user')->andReturn($googleUser);
        $provider->shouldReceive('redirect')->andReturn(redirect('https://accounts.google.com/o/oauth2/auth'));
        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);
    }

    private function frontend(string $path): string
    {
        return 'http://localhost:5180'.$path;
    }

    public function test_redirects_to_google(): void
    {
        $this->fakeGoogle();

        $this->get('/auth/google/redirect')->assertRedirect('https://accounts.google.com/o/oauth2/auth');
    }

    public function test_a_known_google_account_signs_in(): void
    {
        $this->fakeGoogle();
        $user = User::factory()->create(['google_id' => 'g-123']);

        $this->get('/auth/google/callback')->assertRedirect($this->frontend('/hoje'));

        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_google_sign_in_skips_the_two_factor_code(): void
    {
        // SPEC: 2FA applies to e-mail/password; Google already protects this sign-in.
        $this->fakeGoogle();
        $user = User::factory()->create(['google_id' => 'g-123']);
        $user->forceFill(['two_factor_secret' => 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP', 'two_factor_confirmed_at' => now()])->save();

        $this->get('/auth/google/callback')->assertRedirect($this->frontend('/hoje'));

        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_an_existing_email_is_linked_automatically_and_verified(): void
    {
        $this->fakeGoogle();
        $user = User::factory()->unverified()->create(['email' => 'ana@gmail.com']);

        $this->get('/auth/google/callback')->assertRedirect($this->frontend('/hoje'));

        $user->refresh();
        $this->assertSame('g-123', $user->google_id);
        $this->assertTrue($user->hasVerifiedEmail());
        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_a_new_email_goes_to_complete_sign_up_without_creating_an_account(): void
    {
        $this->fakeGoogle();

        $this->get('/auth/google/callback')
            ->assertRedirect($this->frontend('/completar-cadastro'))
            ->assertSessionHas(GoogleAuthController::PENDING_KEY.'.email', 'ana@gmail.com');

        $this->assertDatabaseCount('users', 0);
        $this->assertGuest('web');
    }

    public function test_an_unverified_google_email_is_refused(): void
    {
        $this->fakeGoogle(verified: false);

        $this->get('/auth/google/callback')->assertRedirect($this->frontend('/entrar?erro=google_email'));
        $this->assertGuest('web');
    }

    public function test_a_cancelled_google_sign_in_returns_with_an_error(): void
    {
        $provider = Mockery::mock();
        $provider->shouldReceive('user')->andThrow(new \RuntimeException('access_denied'));
        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $this->get('/auth/google/callback')->assertRedirect($this->frontend('/entrar?erro=google'));
    }

    public function test_completing_sign_up_creates_a_verified_account_with_consents(): void
    {
        $this->fakeGoogle();
        $this->get('/auth/google/callback');

        $this->fromSpa()->getJson('/api/auth/google/pending')
            ->assertOk()
            ->assertJsonPath('data', ['name' => 'Ana Souza', 'email' => 'ana@gmail.com']);

        $this->fromSpa()->postJson('/api/auth/google/complete', [
            'birth_date' => '1995-03-10',
            'accept_terms' => true,
        ])->assertCreated()
            ->assertJsonPath('data.email_verified', true)
            ->assertJsonPath('data.google_linked', true)
            ->assertJsonPath('data.has_password', false)
            ->assertJsonPath('data.plan', 'free');

        $user = User::firstWhere('email', 'ana@gmail.com');
        $this->assertSame('g-123', $user->google_id);
        $this->assertNull($user->password);
        $this->assertCount(2, $user->consents);
        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_completing_sign_up_blocks_people_under_18(): void
    {
        $this->fakeGoogle();
        $this->get('/auth/google/callback');

        $this->fromSpa()->postJson('/api/auth/google/complete', [
            'birth_date' => now()->subYears(16)->toDateString(),
            'accept_terms' => true,
        ])->assertJsonValidationErrors(['birth_date' => 'Você precisa ter 18 anos ou mais para usar o Training Up.']);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_completing_sign_up_requires_the_terms(): void
    {
        $this->fakeGoogle();
        $this->get('/auth/google/callback');

        $this->fromSpa()->postJson('/api/auth/google/complete', ['birth_date' => '1995-03-10', 'accept_terms' => false])
            ->assertJsonValidationErrors('accept_terms');
    }

    public function test_complete_without_a_google_session_is_refused(): void
    {
        $this->fromSpa()->postJson('/api/auth/google/complete', ['birth_date' => '1995-03-10', 'accept_terms' => true])
            ->assertNotFound();
        $this->fromSpa()->getJson('/api/auth/google/pending')->assertNotFound();
    }

    public function test_the_pending_sign_up_expires_after_30_minutes(): void
    {
        $this->fakeGoogle();
        $this->get('/auth/google/callback');
        $this->travel(31)->minutes();

        $this->fromSpa()->getJson('/api/auth/google/pending')->assertNotFound();
    }

    public function test_links_google_from_the_profile(): void
    {
        $this->fakeGoogle();
        $user = User::factory()->create(['email' => 'outro@example.com']);

        $this->actingAs($user, 'web')->get('/auth/google/redirect?intent=link');
        $this->actingAs($user, 'web')->get('/auth/google/callback')
            ->assertRedirect($this->frontend('/perfil?google=vinculado'));

        $this->assertSame('g-123', $user->fresh()->google_id);
    }

    public function test_cannot_link_a_google_account_used_by_someone_else(): void
    {
        $this->fakeGoogle();
        User::factory()->create(['google_id' => 'g-123']);
        $user = User::factory()->create();

        $this->actingAs($user, 'web')->get('/auth/google/redirect?intent=link');
        $this->actingAs($user, 'web')->get('/auth/google/callback')
            ->assertRedirect($this->frontend('/perfil?google=em_uso'));

        $this->assertNull($user->fresh()->google_id);
    }

    public function test_unlinking_requires_a_password(): void
    {
        $googleOnly = User::factory()->create(['google_id' => 'g-1', 'password' => null]);

        $this->actingAs($googleOnly)->fromSpa()->deleteJson('/api/auth/google')
            ->assertUnprocessable()
            ->assertJsonPath('code', 'needs_password');
        $this->assertSame('g-1', $googleOnly->fresh()->google_id);

        $withPassword = User::factory()->create(['google_id' => 'g-2']);
        $this->actingAs($withPassword)->fromSpa()->deleteJson('/api/auth/google')
            ->assertOk()
            ->assertJsonPath('data.google_linked', false);
    }

    public function test_google_only_accounts_cannot_sign_in_with_a_password(): void
    {
        User::factory()->create(['email' => 'ana@gmail.com', 'google_id' => 'g-1', 'password' => null]);

        $this->fromSpa()->postJson('/api/auth/login', ['email' => 'ana@gmail.com', 'password' => 'qualquer123'])
            ->assertJsonValidationErrors('email');
    }
}
