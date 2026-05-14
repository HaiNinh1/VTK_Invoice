<?php

namespace Tests\Feature\Requests;

use App\Models\Contract;
use App\Models\Request as InvoiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RequestLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private User $employee;
    private User $accountant;
    private User $manager;
    private User $other;
    private Contract $contract;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
        $this->employee = User::where('email', 'an.nv@viettel.vn')->first();    // KV3 employee
        $this->accountant = User::where('email', 'binh.tt@viettel.vn')->first(); // TC accountant
        $this->manager = User::where('email', 'cuong.lq@viettel.vn')->first();   // KV3 manager
        $this->other = User::where('email', 'duc.hm@viettel.vn')->first();       // KV1 employee
        // Pick a contract in employee's department for valid creation flows.
        $this->contract = Contract::where('department', 'KV3')->first();
    }

    public function test_index_employee_only_sees_own_requests(): void
    {
        $res = $this->actingAs($this->employee, 'sanctum')->getJson('/api/requests');
        $res->assertOk();
        foreach ($res->json('data') as $r) {
            $this->assertSame('u'.$this->employee->id, $r['createdById']);
        }
    }

    public function test_index_accountant_sees_all(): void
    {
        $res = $this->actingAs($this->accountant, 'sanctum')->getJson('/api/requests');
        $res->assertOk();
        $this->assertGreaterThanOrEqual(15, count($res->json('data')));
    }

    public function test_index_manager_sees_only_department(): void
    {
        $res = $this->actingAs($this->manager, 'sanctum')->getJson('/api/requests');
        $res->assertOk();
        foreach ($res->json('data') as $r) {
            $this->assertSame('KV3', $r['department']);
        }
    }

    public function test_store_generates_DN_id_and_inherits_documents(): void
    {
        $res = $this->actingAs($this->employee, 'sanctum')->postJson('/api/requests', [
            'contractId' => $this->contract->id,
            'valueBeforeVAT' => 10_000_000,
            'vatRate' => 10,
            'paymentTerm' => 'Đợt 1',
            'paymentMethod' => 'Chuyển khoản',
            'invoiceType' => 'Tạo mới',
            'legalChecklist' => ['total' => 4, 'checked' => 2],
            'hasCommitment' => true,
            'commitmentText' => 'Bổ sung sau',
            'commitmentDeadline' => now()->addDays(7)->toDateString(),
        ]);
        $res->assertCreated();
        $id = $res->json('data.id');
        $this->assertMatchesRegularExpression('/^DN-\d{4}-\d{5}$/', $id);
        $this->assertEquals(11_000_000, $res->json('data.valueAfterVAT'));
        $this->assertEquals(1_000_000, $res->json('data.vatAmount'));

        // Verify request_documents seeded.
        $req = InvoiceRequest::find($id);
        $this->assertGreaterThan(0, $req->documents->count());
    }

    public function test_adjustment_kind_requires_original_invoice_number(): void
    {
        $res = $this->actingAs($this->employee, 'sanctum')->postJson('/api/requests', [
            'contractId' => $this->contract->id,
            'valueBeforeVAT' => 1000,
            'paymentTerm' => 'Đợt 1',
            'invoiceType' => 'Điều chỉnh',
        ]);
        $res->assertStatus(422)
            ->assertJsonValidationErrors(['originalInvoiceNumber', 'adjustmentReason']);
    }

    public function test_submit_recall_approve_full_flow(): void
    {
        // Create draft owned by employee.
        $draft = $this->createDraftForEmployee();

        // Submit.
        $r1 = $this->actingAs($this->employee, 'sanctum')
            ->postJson("/api/requests/{$draft->id}/submit");
        $r1->assertOk()->assertJsonPath('ok', true)->assertJsonPath('data.status', 'Chờ duyệt');

        // Recall (must be creator).
        $r2 = $this->actingAs($this->employee, 'sanctum')
            ->postJson("/api/requests/{$draft->id}/recall");
        $r2->assertOk()->assertJsonPath('data.status', 'Nháp');

        // Submit again.
        $this->actingAs($this->employee, 'sanctum')
            ->postJson("/api/requests/{$draft->id}/submit")->assertOk();

        // Approve as accountant.
        $r3 = $this->actingAs($this->accountant, 'sanctum')
            ->postJson("/api/requests/{$draft->id}/approve", [
                'accountingRefNo' => 'CT-2026-001',
                'approvalNote' => 'Đầy đủ giấy tờ',
            ]);
        $r3->assertOk()
            ->assertJsonPath('data.status', 'Đã duyệt')
            ->assertJsonPath('data.accountingRefNo', 'CT-2026-001')
            ->assertJsonPath('data.approvedById', 'u'.$this->accountant->id);
    }

    public function test_recall_blocked_for_non_creator(): void
    {
        $draft = $this->createDraftForEmployee();
        $this->actingAs($this->employee, 'sanctum')->postJson("/api/requests/{$draft->id}/submit");

        $res = $this->actingAs($this->other, 'sanctum')
            ->postJson("/api/requests/{$draft->id}/recall");
        $res->assertStatus(403);
    }

    public function test_approve_blocked_by_legal_gate(): void
    {
        $draft = $this->createDraftForEmployee([
            'legalChecklist' => ['total' => 5, 'checked' => 1],
            'hasCommitment' => false,
            'commitmentDeadline' => null,
        ]);
        $this->actingAs($this->employee, 'sanctum')->postJson("/api/requests/{$draft->id}/submit");

        $res = $this->actingAs($this->accountant, 'sanctum')
            ->postJson("/api/requests/{$draft->id}/approve", ['accountingRefNo' => 'CT-X']);
        $res->assertStatus(422)
            ->assertJsonPath('ok', false)
            ->assertJsonPath('reason', 'Hồ sơ pháp lý thiếu và không có cam kết bổ sung hợp lệ');
    }

    public function test_approve_passes_when_commitment_valid(): void
    {
        $draft = $this->createDraftForEmployee([
            'legalChecklist' => ['total' => 5, 'checked' => 1],
            'hasCommitment' => true,
            'commitmentText' => 'Sẽ bổ sung',
            'commitmentDeadline' => now()->addDays(3)->toDateString(),
        ]);
        $this->actingAs($this->employee, 'sanctum')->postJson("/api/requests/{$draft->id}/submit");

        $res = $this->actingAs($this->accountant, 'sanctum')
            ->postJson("/api/requests/{$draft->id}/approve", ['accountingRefNo' => 'CT-Y']);
        $res->assertOk()->assertJsonPath('data.status', 'Đã duyệt');
    }

    public function test_reject_requires_reason(): void
    {
        $draft = $this->createDraftForEmployee();
        $this->actingAs($this->employee, 'sanctum')->postJson("/api/requests/{$draft->id}/submit");

        $res = $this->actingAs($this->accountant, 'sanctum')
            ->postJson("/api/requests/{$draft->id}/reject", ['reason' => '']);
        $res->assertStatus(422)->assertJsonValidationErrors(['reason']);

        $res2 = $this->actingAs($this->accountant, 'sanctum')
            ->postJson("/api/requests/{$draft->id}/reject", ['reason' => 'Thiếu BB nghiệm thu']);
        $res2->assertOk()
            ->assertJsonPath('data.status', 'Từ chối')
            ->assertJsonPath('data.rejectReason', 'Thiếu BB nghiệm thu');
    }

    public function test_return_for_supplement_sets_status_and_reason(): void
    {
        $draft = $this->createDraftForEmployee();
        $this->actingAs($this->employee, 'sanctum')->postJson("/api/requests/{$draft->id}/submit");

        $res = $this->actingAs($this->accountant, 'sanctum')
            ->postJson("/api/requests/{$draft->id}/return", ['reason' => 'Cần bổ sung quyết toán']);
        $res->assertOk()
            ->assertJsonPath('data.status', 'Trả lại bổ sung')
            ->assertJsonPath('data.returnReason', 'Cần bổ sung quyết toán');
    }

    public function test_employee_cannot_approve(): void
    {
        $draft = $this->createDraftForEmployee();
        $this->actingAs($this->employee, 'sanctum')->postJson("/api/requests/{$draft->id}/submit");

        $res = $this->actingAs($this->other, 'sanctum')
            ->postJson("/api/requests/{$draft->id}/approve", ['accountingRefNo' => 'CT-Z']);
        $res->assertStatus(403);
    }

    public function test_update_blocked_when_not_draft(): void
    {
        $draft = $this->createDraftForEmployee();
        $this->actingAs($this->employee, 'sanctum')->postJson("/api/requests/{$draft->id}/submit");

        $res = $this->actingAs($this->employee, 'sanctum')
            ->patchJson("/api/requests/{$draft->id}", ['notes' => 'changed']);
        $res->assertStatus(403);
    }

    public function test_delete_only_when_draft(): void
    {
        $draft = $this->createDraftForEmployee();
        $r1 = $this->actingAs($this->employee, 'sanctum')->deleteJson("/api/requests/{$draft->id}");
        $r1->assertOk()->assertJsonPath('ok', true);
        $this->assertNull(InvoiceRequest::find($draft->id));
    }

    private function createDraftForEmployee(array $overrides = []): InvoiceRequest
    {
        $payload = array_merge([
            'contractId' => $this->contract->id,
            'valueBeforeVAT' => 10_000_000,
            'vatRate' => 10,
            'paymentTerm' => 'Đợt 1',
            'paymentMethod' => 'Chuyển khoản',
            'invoiceType' => 'Tạo mới',
            'legalChecklist' => ['total' => 0, 'checked' => 0],
        ], $overrides);
        $res = $this->actingAs($this->employee, 'sanctum')->postJson('/api/requests', $payload);
        $res->assertCreated();
        return InvoiceRequest::find($res->json('data.id'));
    }
}
