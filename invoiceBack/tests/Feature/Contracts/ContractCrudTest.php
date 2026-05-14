<?php

namespace Tests\Feature\Contracts;

use App\Models\Contract;
use App\Models\InvoiceType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContractCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Seed minimum invoice type so totalDocsForServiceType works (and FE service-type select).
        $type = InvoiceType::create(['id' => 'lap-dat', 'name' => 'Lắp đặt', 'service_type' => 'Lắp đặt', 'active' => true]);
        $type->documentGroups()->create(['name' => 'HSHĐ', 'sort_order' => 1]);
    }

    private function user(string $role = 'accountant', string $dept = 'TC', string $email = 'u@v.vn'): User
    {
        return User::create([
            'name' => 'U',
            'email' => $email,
            'password' => 'password123',
            'role' => $role,
            'department' => $dept,
            'has_signature' => false,
        ]);
    }

    private function token(User $u): string
    {
        return $u->createToken('t')->plainTextToken;
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'contractNumber' => '99/2026/HĐKT-VTK',
            'customerName' => 'Test Corp',
            'customerTaxCode' => '0123456789',
            'customerAddress' => '1 Đường ABC, HN',
            'serviceType' => 'Lắp đặt',
            'signDate' => '2026-01-15',
            'totalValue' => 100000000,
            'currency' => 'VND',
            'department' => 'KV1',
            'status' => 'Đang thực hiện',
        ], $overrides);
    }

    public function test_accountant_lists_all_departments(): void
    {
        $acc = $this->user('accountant', 'TC', 'a@v.vn');
        Contract::create(['id' => 'HD-2026-001'] + $this->dbRow(['department' => 'KV1']));
        Contract::create(['id' => 'HD-2026-002'] + $this->dbRow(['department' => 'KV3', 'contract_number' => '2/2026']));

        $this->withHeader('Authorization', 'Bearer '.$this->token($acc))
            ->getJson('/api/contracts')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_employee_sees_only_own_department(): void
    {
        $emp = $this->user('employee', 'KV1', 'e@v.vn');
        Contract::create(['id' => 'HD-2026-001'] + $this->dbRow(['department' => 'KV1']));
        Contract::create(['id' => 'HD-2026-002'] + $this->dbRow(['department' => 'KV3', 'contract_number' => '2/2026']));

        $resp = $this->withHeader('Authorization', 'Bearer '.$this->token($emp))
            ->getJson('/api/contracts')
            ->assertOk()
            ->assertJsonCount(1, 'data');
        $this->assertSame('KV1', $resp->json('data.0.department'));
    }

    public function test_employee_cannot_view_other_department_detail(): void
    {
        $emp = $this->user('employee', 'KV1', 'e@v.vn');
        Contract::create(['id' => 'HD-2026-002'] + $this->dbRow(['department' => 'KV3', 'contract_number' => '2/2026']));

        $this->withHeader('Authorization', 'Bearer '.$this->token($emp))
            ->getJson('/api/contracts/HD-2026-002')
            ->assertForbidden();
    }

    public function test_create_contract_generates_HD_YYYY_NNN_id(): void
    {
        $acc = $this->user('accountant', 'TC', 'a@v.vn');
        $resp = $this->withHeader('Authorization', 'Bearer '.$this->token($acc))
            ->postJson('/api/contracts', $this->payload())
            ->assertCreated();
        $year = date('Y');
        $this->assertMatchesRegularExpression("/^HD-{$year}-\\d{3}$/", $resp->json('data.id'));
    }

    public function test_create_validates_tax_code(): void
    {
        $acc = $this->user('accountant', 'TC', 'a@v.vn');
        $this->withHeader('Authorization', 'Bearer '.$this->token($acc))
            ->postJson('/api/contracts', $this->payload(['customerTaxCode' => '123']))
            ->assertJsonValidationErrors(['customerTaxCode']);
    }

    public function test_create_rejects_duplicate_contract_number(): void
    {
        $acc = $this->user('accountant', 'TC', 'a@v.vn');
        $token = $this->token($acc);
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/contracts', $this->payload())->assertCreated();
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/contracts', $this->payload())
            ->assertStatus(422)
            ->assertJsonValidationErrors(['contractNumber']);
    }

    public function test_delete_blocked_when_linked_requests_exist(): void
    {
        $acc = $this->user('accountant', 'TC', 'a@v.vn');
        Contract::create(['id' => 'HD-2026-005'] + $this->dbRow(['department' => 'KV1']));
        // Create a linked request via Request model.
        \App\Models\Request::create([
            'id' => 'DN-2026-99999',
            'contract_id' => 'HD-2026-005',
            'contract_number' => 'X/2026',
            'customer_name' => 'X',
            'customer_tax_code' => '0123456789',
            'service_type' => 'Lắp đặt',
            'invoice_type' => 'Tạo mới',
            'value_before_vat' => 0,
            'vat_rate' => 10,
            'vat_amount' => 0,
            'value_after_vat' => 0,
            'department' => 'KV1',
            'created_by_id' => $acc->id,
            'payment_term' => 'Đợt 1',
            'status' => 'Nháp',
            'has_commitment' => false,
        ]);

        $this->withHeader('Authorization', 'Bearer '.$this->token($acc))
            ->deleteJson('/api/contracts/HD-2026-005')
            ->assertStatus(422)
            ->assertJson(['ok' => false, 'reason' => 'Không thể xóa - đã có đề nghị xuất HĐ liên quan']);
    }

    public function test_upload_document_metadata_only(): void
    {
        $acc = $this->user('accountant', 'TC', 'a@v.vn');
        Contract::create(['id' => 'HD-2026-007'] + $this->dbRow(['department' => 'TC']));

        $resp = $this->withHeader('Authorization', 'Bearer '.$this->token($acc))
            ->postJson('/api/contracts/HD-2026-007/documents', [
                'name' => 'Hợp đồng đã ký',
                'group' => 'Hồ sơ Hợp đồng',
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Hợp đồng đã ký')
            ->assertJsonPath('data.group', 'Hồ sơ Hợp đồng');
        $this->assertNotEmpty($resp->json('data.id'));
        $this->assertNotEmpty($resp->json('data.fileName'));
    }

    private function dbRow(array $overrides = []): array
    {
        return array_merge([
            'contract_number' => '1/2026/HĐKT-VTK',
            'customer_name' => 'C',
            'customer_tax_code' => '0123456789',
            'service_type' => 'Lắp đặt',
            'sign_date' => '2026-01-01',
            'total_value' => 1000000,
            'currency' => 'VND',
            'department' => 'KV1',
            'status' => 'Đang thực hiện',
        ], $overrides);
    }
}
