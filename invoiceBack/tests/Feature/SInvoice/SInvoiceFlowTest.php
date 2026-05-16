<?php

namespace Tests\Feature\SInvoice;

use App\Models\Contract;
use App\Models\Notification;
use App\Models\Request as InvoiceRequest;
use App\Models\SInvoice;
use App\Models\User;
use App\Services\Viettel\FakeViettelDriver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SInvoiceFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $employee;
    private User $accountant;
    private Contract $contract;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
        $this->employee = User::where('email', 'an.nv@viettel.vn')->first();
        $this->accountant = User::where('email', 'binh.tt@viettel.vn')->first();
        $this->contract = Contract::where('department', 'KV3')->first();
        FakeViettelDriver::reset();
        Notification::query()->delete();
    }

    public function test_export_success_creates_sinvoice_row_and_marks_request_exported(): void
    {
        $request = $this->approvedRequest();

        $res = $this->actingAs($this->accountant, 'sanctum')
            ->postJson("/api/requests/{$request->id}/export");

        $res->assertOk()->assertJsonPath('ok', true);
        $this->assertMatchesRegularExpression('/^K26TYY\d{7}$/', $res->json('sInvoiceNumber'));

        $request->refresh();
        $this->assertSame('Đã xuất HĐ', $request->status);
        $sInvoice = SInvoice::where('request_id', $request->id)->first();
        $this->assertNotNull($sInvoice);
        $this->assertSame('Thành công', $sInvoice->status);
        $this->assertNull($sInvoice->error_message);

        // Notification dispatched to accountant+admin.
        $this->assertNotNull(Notification::where('user_id', $this->accountant->id)
            ->where('kind', 'exportSuccess')->first());
    }

    public function test_export_failure_persists_loi_status_and_notifies_exportError(): void
    {
        $request = $this->approvedRequest();
        FakeViettelDriver::failNext('Mã số thuế bên mua không tồn tại');

        $res = $this->actingAs($this->accountant, 'sanctum')
            ->postJson("/api/requests/{$request->id}/export");

        $res->assertStatus(422)
            ->assertJsonPath('ok', false)
            ->assertJsonPath('reason', 'Mã số thuế bên mua không tồn tại');

        $request->refresh();
        $this->assertSame('Đã xuất HĐ', $request->status); // FE convention
        $sInvoice = SInvoice::where('request_id', $request->id)->first();
        $this->assertSame('Lỗi', $sInvoice->status);
        $this->assertSame('Mã số thuế bên mua không tồn tại', $sInvoice->error_message);

        $this->assertNotNull(Notification::where('user_id', $this->accountant->id)
            ->where('kind', 'exportError')->first());
    }

    public function test_export_blocked_when_status_is_not_approved(): void
    {
        $request = $this->createDraft();
        $res = $this->actingAs($this->accountant, 'sanctum')
            ->postJson("/api/requests/{$request->id}/export");
        $res->assertStatus(422)
            ->assertJsonPath('reason', 'Chỉ xuất được khi đã duyệt');
    }

    public function test_export_blocked_for_non_accountant(): void
    {
        $request = $this->approvedRequest();
        $this->actingAs($this->employee, 'sanctum')
            ->postJson("/api/requests/{$request->id}/export")
            ->assertForbidden();
    }

    public function test_retry_recovers_after_failure(): void
    {
        $request = $this->approvedRequest();
        FakeViettelDriver::failNext('Network timeout');
        $this->actingAs($this->accountant, 'sanctum')
            ->postJson("/api/requests/{$request->id}/export")->assertStatus(422);

        // Now retry, driver returns success.
        $res = $this->actingAs($this->accountant, 'sanctum')
            ->postJson("/api/requests/{$request->id}/retry-export");
        $res->assertOk()->assertJsonPath('ok', true);

        $sInvoice = SInvoice::where('request_id', $request->id)->first();
        $this->assertSame('Thành công', $sInvoice->status);
        $this->assertNull($sInvoice->error_message);
        $this->assertNotNull($sInvoice->s_invoice_number);
    }

    public function test_retry_rejected_when_not_in_loi_status(): void
    {
        $request = $this->approvedRequest();
        $this->actingAs($this->accountant, 'sanctum')
            ->postJson("/api/requests/{$request->id}/export")->assertOk();
        // Now status is Thành công, retry should reject.
        $res = $this->actingAs($this->accountant, 'sanctum')
            ->postJson("/api/requests/{$request->id}/retry-export");
        $res->assertStatus(422)
            ->assertJsonPath('reason', 'Chỉ retry được khi đang ở trạng thái Lỗi');
    }

    public function test_webhook_rejects_missing_or_invalid_signature(): void
    {
        config(['services.viettel.webhook_secret' => 'secret-abc']);
        $payload = ['requestId' => 'DN-2026-00101', 'status' => 'Thành công'];

        // No signature.
        $this->postJson('/api/webhooks/viettel/sinvoice', $payload)->assertStatus(401);

        // Wrong signature.
        $this->withHeaders(['X-Signature' => 'deadbeef'])
            ->postJson('/api/webhooks/viettel/sinvoice', $payload)
            ->assertStatus(401);
    }

    public function test_webhook_applies_valid_signature_and_updates_sinvoice(): void
    {
        config(['services.viettel.webhook_secret' => 'secret-abc']);
        $request = $this->approvedRequest();
        // Mark exported with a Lỗi row so webhook flips it to Thành công.
        FakeViettelDriver::failNext('temp');
        $this->actingAs($this->accountant, 'sanctum')
            ->postJson("/api/requests/{$request->id}/export")->assertStatus(422);

        $payload = [
            'requestId' => $request->id,
            'status' => 'Thành công',
            'sInvoiceNumber' => 'K26TYY9999999',
            'sInvoiceTaxCode' => '4A2B9999',
        ];
        $body = json_encode($payload);
        $sig = hash_hmac('sha256', $body, 'secret-abc');

        $res = $this->call(
            'POST', '/api/webhooks/viettel/sinvoice', [], [], [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_X_SIGNATURE' => $sig,
                'HTTP_ACCEPT' => 'application/json',
            ],
            $body,
        );
        $res->assertOk()->assertJson(['ok' => true]);

        $sInvoice = SInvoice::where('request_id', $request->id)->first();
        $this->assertSame('Thành công', $sInvoice->status);
        $this->assertSame('K26TYY9999999', $sInvoice->s_invoice_number);
        $this->assertSame('4A2B9999', $sInvoice->s_invoice_tax_code);
    }

    public function test_webhook_returns_503_when_secret_not_configured(): void
    {
        config(['services.viettel.webhook_secret' => '']);
        $this->withHeaders(['X-Signature' => 'x'])
            ->postJson('/api/webhooks/viettel/sinvoice', ['requestId' => 'x', 'status' => 'Lỗi'])
            ->assertStatus(503);
    }

    // ─── helpers ───────────────────────────────────────────────────────────

    private function createDraft(): InvoiceRequest
    {
        $res = $this->actingAs($this->employee, 'sanctum')->postJson('/api/requests', [
            'contractId' => $this->contract->id,
            'valueBeforeVAT' => 1_000_000,
            'vatRate' => 10,
            'paymentTerm' => 'Đợt 1',
            'paymentMethod' => 'Chuyển khoản',
            'invoiceType' => 'Tạo mới',
            'legalChecklist' => ['total' => 0, 'checked' => 0],
        ]);
        $res->assertCreated();
        return InvoiceRequest::find($res->json('data.id'));
    }

    private function approvedRequest(): InvoiceRequest
    {
        $draft = $this->createDraft();
        $this->actingAs($this->employee, 'sanctum')
            ->postJson("/api/requests/{$draft->id}/submit")->assertOk();
        $this->actingAs($this->accountant, 'sanctum')
            ->postJson("/api/requests/{$draft->id}/approve", ['accountingRefNo' => 'CT-1'])
            ->assertOk();
        return $draft->fresh();
    }
}
