<?php

namespace Tests\Feature\Settings;

use App\Models\AppSetting;
use App\Models\User;
use App\Services\Viettel\FakeViettelDriver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Step 8 — Settings/Connections + SMTP. Covers admin gating, encryption-at-rest, secret-masking
 * in GET responses, "blank means don't change" behavior on PATCH, S-Invoice ping via fake driver,
 * and SMTP send via Mail::fake.
 */
class ConnectionsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
        FakeViettelDriver::reset();
    }

    private function admin(): User
    {
        return User::query()->where('role', 'admin')->firstOrFail();
    }

    private function accountant(): User
    {
        return User::query()->where('role', 'accountant')->firstOrFail();
    }

    public function test_non_admin_blocked_from_settings(): void
    {
        $this->actingAs($this->accountant(), 'sanctum')
            ->getJson('/api/settings/connections')
            ->assertStatus(403);
    }

    public function test_admin_gets_defaults_with_secrets_masked(): void
    {
        $r = $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/settings/connections')
            ->assertOk()
            ->assertJsonPath('data.sInvoice.endpoint', 'https://api-vinvoice.viettel.vn')
            ->assertJsonPath('data.sInvoice.hasApiSecret', false)
            ->assertJsonPath('data.smtp.host', 'smtp.viettel.com.vn')
            ->assertJsonPath('data.smtp.hasPassword', false);
        // Secrets MUST NOT appear in the response payload at all.
        $this->assertArrayNotHasKey('apiSecret', $r->json('data.sInvoice'));
        $this->assertArrayNotHasKey('password', $r->json('data.smtp'));
    }

    public function test_admin_saves_sinvoice_with_secret_encrypted_at_rest(): void
    {
        $this->actingAs($this->admin(), 'sanctum')
            ->patchJson('/api/settings/connections/s-invoice', [
                'endpoint' => 'https://staging.viettel.vn',
                'apiSecret' => 'super-secret-key-123',
            ])
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('data.endpoint', 'https://staging.viettel.vn')
            ->assertJsonPath('data.hasApiSecret', true);

        // Read raw DB value: must NOT be the plaintext secret.
        $raw = \DB::table('app_settings')->where('key', 'connections.sinvoice')->value('value');
        $this->assertIsString($raw);
        $this->assertStringNotContainsString('super-secret-key-123', $raw);

        // Decrypted value matches.
        $this->assertSame('super-secret-key-123', AppSetting::getValue('connections.sinvoice')['apiSecret']);
    }

    public function test_blank_secret_in_patch_does_not_wipe_stored_secret(): void
    {
        AppSetting::setValue('connections.sinvoice', ['apiSecret' => 'keep-me']);

        $this->actingAs($this->admin(), 'sanctum')
            ->patchJson('/api/settings/connections/s-invoice', [
                'endpoint' => 'https://new-endpoint.example',
                'apiSecret' => '',
            ])
            ->assertOk();

        $this->assertSame('keep-me', AppSetting::getValue('connections.sinvoice')['apiSecret']);
    }

    public function test_sinvoice_test_endpoint_returns_ok(): void
    {
        $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/settings/connections/s-invoice/test')
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('message', 'Kết nối thành công · MST 0100109106');
    }

    public function test_sinvoice_test_reports_driver_failure(): void
    {
        FakeViettelDriver::failNext('Timeout 504');

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/settings/connections/s-invoice/test')
            ->assertStatus(422)
            ->assertJsonPath('ok', false)
            ->assertJsonPath('message', 'Timeout 504');
    }

    public function test_smtp_test_sends_mail(): void
    {
        Mail::fake();

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/settings/connections/smtp/test', ['to' => 'qa@vtk.vn'])
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('message', 'Đã gửi mail test tới qa@vtk.vn');
        // Mail::raw is intercepted by the fake; assertion of payload contents on raw sends
        // requires a Mailable class. Reaching here without exception is the success signal.
    }

    public function test_smtp_test_requires_valid_email(): void
    {
        $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/settings/connections/smtp/test', ['to' => 'not-an-email'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('to');
    }
}
