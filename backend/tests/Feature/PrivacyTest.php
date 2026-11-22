<?php

namespace Tests\Feature;

use App\Enums\ConsentType;
use App\Models\User;
use App\Services\TwoFactorService;
use App\Support\LegalConsent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Request as RequestFacade;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class PrivacyTest extends TestCase
{
    use RefreshDatabase;

    private function consentTo(User $user, string $version): void
    {
        foreach (LegalConsent::TYPES as $type) {
            $user->consents()->create(['type' => $type, 'version' => $version, 'accepted_at' => now(), 'ip_address' => '10.0.0.1']);
        }
    }

    public function test_lists_my_consents_newest_first(): void
    {
        $user = User::factory()->create();
        $this->consentTo($user, 'old');
        $this->travel(1)->day();
        $this->consentTo($user, LegalConsent::currentVersion(ConsentType::Terms));

        $this->actingAs($user)->fromSpa()->getJson('/api/consents')
            ->assertOk()
            ->assertJsonCount(4, 'data')
            ->assertJsonPath('data.0.version', '2026-11-22')
            ->assertJsonPath('data.3.version', 'old')
            ->assertJsonStructure(['data' => [['type', 'version', 'accepted_at', 'ip_address']]]);
    }

    public function test_an_outdated_acceptance_is_flagged_and_can_be_renewed(): void
    {
        $user = User::factory()->create();
        $this->consentTo($user, '2026-11-draft');

        $this->actingAs($user)->fromSpa()->getJson('/api/user')->assertJsonPath('data.needs_legal_consent', true);

        $this->actingAs($user)->fromSpa()->postJson('/api/consents', ['accept_terms' => false])
            ->assertJsonValidationErrors(['accept_terms' => 'Você precisa aceitar os Termos de Uso e a Política de Privacidade.']);

        $this->actingAs($user)->fromSpa()->postJson('/api/consents', ['accept_terms' => true])
            ->assertOk()
            ->assertJsonPath('data.needs_legal_consent', false);

        $this->assertSame(2, $user->consents()->where('version', '2026-11-22')->count());

        // Accepting again doesn't duplicate records.
        $this->actingAs($user)->fromSpa()->postJson('/api/consents', ['accept_terms' => true]);
        $this->assertSame(2, $user->consents()->where('version', '2026-11-22')->count());
    }

    public function test_sign_up_records_the_current_versions(): void
    {
        $user = User::factory()->create();
        LegalConsent::record($user, RequestFacade::instance());

        $this->assertFalse(LegalConsent::isOutdated($user));
    }

    public function test_exports_my_data_as_a_json_download(): void
    {
        $user = User::factory()->create(['name' => 'Ana Souza', 'email' => 'ana@example.com', 'birth_date' => '1995-03-10']);
        $this->consentTo($user, '2026-11-22');
        $other = User::factory()->create(['email' => 'outra@example.com']);

        $response = $this->actingAs($user)->fromSpa()->get('/api/profile/export')->assertOk();

        $this->assertStringContainsString('attachment; filename="training-up-meus-dados-', $response->headers->get('Content-Disposition'));
        $response->assertJsonPath('account.name', 'Ana Souza')
            ->assertJsonPath('account.email', 'ana@example.com')
            ->assertJsonPath('account.birth_date', '1995-03-10')
            ->assertJsonPath('preferences.theme', 'dark')
            ->assertJsonCount(2, 'consents');

        $body = $response->getContent();
        $this->assertStringNotContainsString('outra@example.com', $body);
        $this->assertStringNotContainsString('password', $body);
        $this->assertStringNotContainsString('two_factor_secret', $body);
    }

    public function test_deleting_the_account_needs_the_password_and_removes_everything(): void
    {
        $user = User::factory()->create(['password' => 'senha1234']);
        $this->consentTo($user, '2026-11-22');
        DB::table('sessions')->insert(['id' => 'other-device', 'user_id' => $user->id, 'payload' => 'x', 'last_activity' => time()]);
        $keep = User::factory()->create();

        $this->actingAs($user)->fromSpa()->deleteJson('/api/profile', ['password' => 'errada123'])
            ->assertJsonValidationErrors('password');
        $this->assertModelExists($user);

        $this->actingAs($user)->fromSpa()->deleteJson('/api/profile', ['password' => 'senha1234'])
            ->assertOk()
            ->assertJsonPath('message', 'Sua conta e seus dados foram excluídos.');

        $this->assertModelMissing($user);
        $this->assertDatabaseMissing('consents', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('sessions', ['user_id' => $user->id]);
        $this->assertModelExists($keep);
        $this->assertGuest('web');
    }

    public function test_google_only_accounts_confirm_by_typing_excluir(): void
    {
        $user = User::factory()->create(['password' => null, 'google_id' => 'g-1']);

        $this->actingAs($user)->fromSpa()->deleteJson('/api/profile', ['confirmation' => 'excluir agora'])
            ->assertJsonValidationErrors(['confirmation' => 'Digite EXCLUIR para confirmar.']);

        $this->actingAs($user)->fromSpa()->deleteJson('/api/profile', ['confirmation' => 'EXCLUIR'])->assertOk();
        $this->assertModelMissing($user);
    }

    public function test_with_two_factor_on_deleting_also_needs_a_code(): void
    {
        $user = User::factory()->create(['password' => 'senha1234']);
        $secret = (new Google2FA)->generateSecretKey(32);
        $user->forceFill(['two_factor_secret' => $secret, 'two_factor_confirmed_at' => now()])->save();
        app(TwoFactorService::class)->regenerateRecoveryCodes($user);

        $this->actingAs($user)->fromSpa()->deleteJson('/api/profile', ['password' => 'senha1234'])
            ->assertJsonValidationErrors('code');
        $this->actingAs($user)->fromSpa()->deleteJson('/api/profile', ['password' => 'senha1234', 'code' => '000000'])
            ->assertJsonValidationErrors('code');
        $this->assertModelExists($user);

        $this->actingAs($user)->fromSpa()
            ->deleteJson('/api/profile', ['password' => 'senha1234', 'code' => (new Google2FA)->getCurrentOtp($secret)])
            ->assertOk();
        $this->assertModelMissing($user);
    }

    public function test_privacy_endpoints_require_sign_in(): void
    {
        $this->fromSpa()->getJson('/api/consents')->assertUnauthorized();
        $this->fromSpa()->getJson('/api/profile/export')->assertUnauthorized();
        $this->fromSpa()->deleteJson('/api/profile', ['password' => 'x'])->assertUnauthorized();
    }
}
