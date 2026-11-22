<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\AdminAlert;
use App\Models\AdminImpersonationLog;
use App\Models\AppSetting;
use App\Models\User;
use App\Support\Settings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use RuntimeException;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Each real request builds its auth guards from scratch; in a test the app is reused, so the
     * request guards (sanctum, impersonation) would keep the user of the previous call. The session
     * user goes on the `web` guard, as a real session does.
     */
    private function nextRequestAs(User $sessionUser): static
    {
        $this->app['auth']->forgetGuards();

        return $this->actingAs($sessionUser, 'web');
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => Role::Admin, 'name' => 'Brenno Admin']);
    }

    public function test_admin_routes_are_only_for_admins(): void
    {
        $this->actingAs(User::factory()->create())->fromSpa()->getJson('/api/admin/metrics')
            ->assertForbidden()
            ->assertJsonPath('message', 'Área restrita à administração.');

        $this->actingAs($this->admin())->getJson('/api/admin/metrics')->assertOk();
    }

    public function test_make_admin_command(): void
    {
        $user = User::factory()->create(['email' => 'brenno@example.com']);

        $this->artisan('user:make-admin', ['email' => ' Brenno@Example.com '])->assertSuccessful();
        $this->assertTrue($user->fresh()->isAdmin());

        $this->artisan('user:make-admin', ['email' => 'brenno@example.com', '--revoke' => true])->assertSuccessful();
        $this->assertFalse($user->fresh()->isAdmin());

        $this->artisan('user:make-admin', ['email' => 'nobody@example.com'])->assertFailed();
    }

    public function test_metrics(): void
    {
        $admin = $this->admin();
        User::factory()->create(['created_at' => now()->subDays(40), 'last_seen_at' => now()->subDays(2)]);
        User::factory()->unverified()->create(['created_at' => now()->subDays(3)]);
        AdminAlert::record(AdminAlert::BACKUP_FAILED, 'x');

        $this->actingAs($admin)->fromSpa()->getJson('/api/admin/metrics')
            ->assertJsonPath('data.users_total', 3)
            ->assertJsonPath('data.users_verified', 2)
            ->assertJsonPath('data.signups_7d', 2)
            ->assertJsonPath('data.active_7d', 1) // the admin's own access is saved after the response
            ->assertJsonPath('data.plans_generated', null)
            ->assertJsonPath('data.open_alerts', 1);
    }

    public function test_lists_and_searches_users_with_status_and_last_access(): void
    {
        $admin = $this->admin();
        User::factory()->create(['name' => 'Ana Lima', 'email' => 'ana@example.com', 'last_seen_at' => '2026-11-20 10:00:00']);
        User::factory()->unverified()->create(['name' => 'Bruno', 'email' => 'bruno@example.com']);

        $this->actingAs($admin)->fromSpa()->getJson('/api/admin/users?search=ana')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.email', 'ana@example.com')
            ->assertJsonPath('data.0.status', 'active')
            ->assertJsonPath('data.0.last_seen_at', '2026-11-20T10:00:00+00:00');

        $this->getJson('/api/admin/users?search=bruno')->assertJsonPath('data.0.status', 'unverified');
        $this->getJson('/api/admin/users')->assertJsonPath('meta.total', 3);
    }

    public function test_requests_update_the_last_access(): void
    {
        $user = User::factory()->create(['last_seen_at' => null]);

        $this->actingAs($user)->fromSpa()->getJson('/api/user')->assertOk();

        $this->assertNotNull($user->fresh()->last_seen_at);
    }

    public function test_impersonation_needs_a_reason_and_never_targets_admins(): void
    {
        $admin = $this->admin();
        $user = User::factory()->create();

        $this->actingAs($admin)->fromSpa()->postJson("/api/admin/users/{$user->id}/impersonate", ['reason' => 'curto'])
            ->assertJsonValidationErrors('reason');
        $this->postJson("/api/admin/users/{$admin->id}/impersonate", ['reason' => 'Ver meu próprio perfil'])
            ->assertJsonValidationErrors('reason');
        $this->postJson('/api/admin/users/'.$this->admin()->id.'/impersonate', ['reason' => 'Suporte a outro admin'])
            ->assertJsonValidationErrors('reason');
        $this->assertDatabaseCount('admin_impersonation_logs', 0);
    }

    public function test_impersonation_is_read_only_and_logged(): void
    {
        $admin = $this->admin();
        $user = User::factory()->create(['name' => 'Ana Lima', 'last_seen_at' => null]);

        $this->actingAs($admin)->fromSpa()
            ->postJson("/api/admin/users/{$user->id}/impersonate", ['reason' => 'Usuária relatou erro no questionário'])
            ->assertOk();

        $log = AdminImpersonationLog::sole();
        $this->assertSame([$admin->id, $user->id], [$log->admin_id, $log->user_id]);
        $this->assertSame('Usuária relatou erro no questionário', $log->reason);
        $this->assertNull($log->ended_at);

        // The API answers as the user, with the bar data.
        $this->nextRequestAs($admin)->getJson('/api/user')
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.impersonation.admin_name', 'Brenno Admin');
        $this->getJson('/api/questionnaire')->assertOk()->assertJsonPath('data', null);

        // Nothing can change, and the data can't be downloaded in bulk.
        $this->patchJson('/api/profile', ['name' => 'Outro', 'birth_date' => '1990-01-01'])
            ->assertForbidden()
            ->assertJsonPath('code', 'impersonation_read_only');
        $this->postJson('/api/questionnaire/consent', ['accept' => true])->assertForbidden();
        $this->postJson('/api/auth/logout')->assertForbidden();
        $this->deleteJson('/api/profile', ['password' => 'password'])->assertForbidden();
        $this->getJson('/api/profile/export')->assertForbidden();
        $this->assertSame('Ana Lima', $user->fresh()->name);
        $this->assertNotNull($user->fresh());

        // The admin panel is closed while viewing as someone else; their "último acesso" is untouched.
        $this->getJson('/api/admin/metrics')->assertForbidden();
        $this->assertNull($user->fresh()->last_seen_at);

        // Leaving goes back to the admin and closes the log.
        $this->deleteJson('/api/admin/impersonation')->assertOk();
        $this->nextRequestAs($admin)->getJson('/api/user')->assertJsonPath('data.id', $admin->id)->assertJsonPath('data.impersonation', null);
        $this->assertNotNull($log->fresh()->ended_at);
        $this->getJson('/api/admin/impersonation-logs')
            ->assertJsonPath('data.0.user.name', 'Ana Lima')
            ->assertJsonPath('data.0.admin', 'Brenno Admin');
    }

    public function test_impersonation_ends_by_itself_after_an_hour(): void
    {
        $admin = $this->admin();
        $user = User::factory()->create();
        $this->actingAs($admin)->fromSpa()
            ->postJson("/api/admin/users/{$user->id}/impersonate", ['reason' => 'Conferir plano da usuária'])->assertOk();

        $this->nextRequestAs($admin)->getJson('/api/user')->assertJsonPath('data.id', $user->id);
        $this->travel(61)->minutes();

        $this->nextRequestAs($admin)->getJson('/api/user')->assertJsonPath('data.id', $admin->id);
        $this->patchJson('/api/profile/preferences', ['theme' => 'light'])->assertOk();
        $this->assertNotNull(AdminImpersonationLog::sole()->ended_at);
    }

    public function test_the_user_export_lists_support_accesses(): void
    {
        $user = User::factory()->create();
        AdminImpersonationLog::create([
            'admin_id' => $this->admin()->id, 'user_id' => $user->id, 'reason' => 'Ajuda com o login',
            'started_at' => now(), 'ended_at' => now(),
        ]);

        $this->actingAs($user)->fromSpa()->getJson('/api/profile/export')
            ->assertJsonPath('support_access.0.reason', 'Ajuda com o login');
    }

    public function test_alerts_group_repeats_and_can_be_resolved(): void
    {
        AdminAlert::record(AdminAlert::MAIL_FAILED, 'SMTP timeout');
        AdminAlert::record(AdminAlert::MAIL_FAILED, 'SMTP timeout');
        AdminAlert::record(AdminAlert::BACKUP_FAILED, 'mysqldump: access denied');
        $mail = AdminAlert::where('type', AdminAlert::MAIL_FAILED)->sole();
        $this->assertSame(2, $mail->occurrences);

        $admin = $this->admin();
        $this->actingAs($admin)->fromSpa()->getJson('/api/admin/alerts')->assertJsonCount(2, 'data');
        $this->postJson("/api/admin/alerts/{$mail->id}/resolve")->assertOk()->assertJsonPath('data.id', $mail->id);

        $this->getJson('/api/admin/alerts')->assertJsonCount(1, 'data')->assertJsonPath('data.0.type', 'backup_failed');
        $this->getJson('/api/admin/alerts?status=resolved')->assertJsonCount(1, 'data');
        $this->assertSame($admin->id, $mail->fresh()->resolved_by);

        // Happening again after being resolved opens a new alert.
        AdminAlert::record(AdminAlert::MAIL_FAILED, 'SMTP timeout');
        $this->assertSame(2, AdminAlert::where('type', AdminAlert::MAIL_FAILED)->count());
    }

    public function test_unexpected_errors_become_alerts(): void
    {
        Route::middleware('api')->get('/api/test-boom', fn () => throw new RuntimeException('Boom'));

        $this->getJson('/api/test-boom')->assertStatus(500);

        $alert = AdminAlert::sole();
        $this->assertSame(AdminAlert::APP_ERROR, $alert->type);
        $this->assertStringStartsWith('RuntimeException: Boom (tests/Feature/AdminTest.php:', $alert->message);
    }

    public function test_failed_e_mails_become_alerts(): void
    {
        config(['mail.default' => 'failover', 'mail.mailers.failover' => ['transport' => 'failover', 'mailers' => []]]);
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)->fromSpa()->postJson('/api/auth/email/resend');

        $this->assertSame(AdminAlert::MAIL_FAILED, AdminAlert::sole()->type);
    }

    public function test_settings_start_with_the_spec_defaults_and_can_be_changed(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->fromSpa()->getJson('/api/admin/settings')
            ->assertOk()
            ->assertJsonFragment(['key' => 'goal.lose_fat.moderate', 'value' => -20, 'default' => -20, 'unit' => '%'])
            ->assertJsonFragment(['key' => 'limits.min_kcal_female', 'value' => 1200]);

        $this->putJson('/api/admin/settings', ['values' => [
            ['key' => 'protein.lose_fat', 'value' => 2.2],
            ['key' => 'goal.lose_fat.light', 'value' => -15], // same as default: nothing stored
        ]])->assertOk()->assertJsonFragment(['key' => 'protein.lose_fat', 'value' => 2.2, 'default' => 2]);

        $this->assertSame(2.2, Settings::get('protein.lose_fat'));
        $this->assertSame(['protein.lose_fat'], AppSetting::pluck('key')->all());
        $this->assertSame($admin->id, AppSetting::sole()->updated_by);

        // Back to the default removes the override.
        $this->putJson('/api/admin/settings', ['values' => [['key' => 'protein.lose_fat', 'value' => 2]]])->assertOk();
        $this->assertDatabaseCount('app_settings', 0);
    }

    public function test_settings_are_validated(): void
    {
        $this->actingAs($this->admin())->fromSpa()->putJson('/api/admin/settings', ['values' => [
            ['key' => 'unknown.key', 'value' => 1],
        ]])->assertJsonValidationErrors('values.0.key');
        $this->putJson('/api/admin/settings', ['values' => [
            ['key' => 'fat.min_pct', 'value' => 30],
            ['key' => 'protein.lose_fat', 'value' => 9],
        ]])->assertJsonValidationErrors('values.1.value')
            ->assertJsonPath('errors', ['values.1.value' => ['Informe um valor entre 0.5 e 4.']]);

        $this->assertDatabaseCount('app_settings', 0);
    }

    public function test_activity_factor_table(): void
    {
        $this->assertSame(1.375, Settings::activityFactor('sedentary', 2));
        $this->assertSame(1.375, Settings::activityFactor('sedentary', 3));
        $this->assertSame(1.55, Settings::activityFactor('sedentary', 4));
        $this->assertSame(1.725, Settings::activityFactor('sedentary', 6));
        $this->assertSame(1.55, Settings::activityFactor('standing', 3));
        $this->assertSame(1.725, Settings::activityFactor('standing', 5));
        $this->assertSame(1.725, Settings::activityFactor('standing', 6));
        $this->assertSame(1.725, Settings::activityFactor('active', 2));
        $this->assertSame(1.9, Settings::activityFactor('active', 4));
        $this->assertSame(1.9, Settings::activityFactor('active', 6));
    }
}
