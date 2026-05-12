<?php

namespace Tests\Feature\Phase3;

use App\Models\Contract;
use App\Models\Customer;
use App\Models\InvoiceRequest;
use App\Models\InvoiceType;
use App\Models\RevenueCenter;
use App\Models\ServiceType;
use App\Services\InvoiceCodeGenerator;
use Tests\TestCase;

class ContractCrudTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_admin_can_create_read_update_and_soft_delete_contract(): void
    {
        $admin = $this->makeUser('admin', 'KV3');
        $customer = Customer::firstOrFail();
        $revenueCenter = RevenueCenter::where('code', 'KV3')->firstOrFail();

        $id = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/contracts', [
                'code' => 'P3-CTR-001',
                'customer_id' => $customer->id,
                'name' => 'Phase 3 Contract',
                'total_amount' => 1000000,
                'total_value_after_tax' => 1100000,
                'signed_date' => '2026-05-01',
                'expiry_date' => '2026-12-31',
                'project_manager_id' => $admin->id,
                'revenue_center_id' => $revenueCenter->id,
                'status' => 'draft',
                'notes' => 'Created in Phase 3 test',
            ])
            ->assertCreated()
            ->assertJsonPath('data.code', 'P3-CTR-001')
            ->assertJsonPath('data.customer.id', $customer->id)
            ->assertJsonPath('data.progress', 0)
            ->json('data.id');

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/contracts/{$id}")
            ->assertOk()
            ->assertJsonPath('data.installments_count', 0)
            ->assertJsonPath('data.documents_count', 0);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/contracts/{$id}", ['status' => 'active', 'name' => 'Phase 3 Contract Updated'])
            ->assertOk()
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.name', 'Phase 3 Contract Updated');

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/contracts/{$id}")
            ->assertNoContent();

        $this->assertSoftDeleted('contracts', ['id' => $id]);
    }

    public function test_non_admin_without_contract_manage_cannot_mutate_contracts(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $customer = Customer::firstOrFail();
        $contract = Contract::create([
            'code' => 'P3-CTR-403',
            'customer_id' => $customer->id,
            'name' => 'Forbidden Contract',
            'total_amount' => 1000,
            'status' => 'draft',
        ]);

        $payload = [
            'code' => 'P3-CTR-NEW',
            'customer_id' => $customer->id,
            'name' => 'Forbidden Create',
            'total_amount' => 1000,
        ];

        $this->actingAs($employee, 'sanctum')->postJson('/api/v1/contracts', $payload)->assertForbidden();
        $this->actingAs($employee, 'sanctum')->patchJson("/api/v1/contracts/{$contract->id}", ['name' => 'Nope'])->assertForbidden();
        $this->actingAs($employee, 'sanctum')->deleteJson("/api/v1/contracts/{$contract->id}")->assertForbidden();
    }

    public function test_destroy_returns_conflict_when_contract_has_active_invoice_request(): void
    {
        $admin = $this->makeUser('admin', 'KV3');
        $contract = $this->contract();

        InvoiceRequest::create([
            'request_code' => app(InvoiceCodeGenerator::class)->generate(),
            'invoice_type_id' => InvoiceType::first()->id,
            'customer_id' => $contract->customer_id,
            'service_type_id' => ServiceType::first()->id,
            'contract_id' => $contract->id,
            'revenue_center_id' => RevenueCenter::where('code', 'KV3')->first()->id,
            'creator_id' => $admin->id,
            'before_vat' => 1000,
            'tax_rate' => 10,
            'after_vat' => 1100,
            'status' => 'approved',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/contracts/{$contract->id}")
            ->assertStatus(409);
    }

    public function test_index_filters_by_status_customer_revenue_center_and_search(): void
    {
        $admin = $this->makeUser('admin', 'KV3');
        $customer = Customer::firstOrFail();
        $revenueCenter = RevenueCenter::where('code', 'KV3')->firstOrFail();
        Contract::create([
            'code' => 'P3-FILTER-MATCH',
            'customer_id' => $customer->id,
            'revenue_center_id' => $revenueCenter->id,
            'name' => 'Searchable Contract',
            'total_amount' => 1000,
            'status' => 'active',
        ]);
        Contract::create([
            'code' => 'P3-FILTER-DRAFT',
            'customer_id' => $customer->id,
            'name' => 'Other Contract',
            'total_amount' => 1000,
            'status' => 'draft',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/contracts?status=active&customer_id={$customer->id}&revenue_center_id={$revenueCenter->id}&search=Searchable")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.code', 'P3-FILTER-MATCH');
    }

    public function test_contract_validation_rejects_bad_date_range_and_after_tax_total(): void
    {
        $admin = $this->makeUser('admin', 'KV3');

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/contracts', [
                'code' => 'P3-VALIDATION',
                'customer_id' => Customer::firstOrFail()->id,
                'name' => 'Invalid Contract',
                'total_amount' => 2000,
                'total_value_after_tax' => 1000,
                'signed_date' => '2026-06-01',
                'expiry_date' => '2026-05-01',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['total_value_after_tax', 'expiry_date']);
    }

    public function test_authenticated_users_can_read_contracts_without_manage_permission(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $contract = $this->contract();

        $this->actingAs($employee, 'sanctum')
            ->getJson("/api/v1/contracts/{$contract->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $contract->id);
    }

    private function contract(): Contract
    {
        return Contract::create([
            'code' => 'P3-CTR-ACTIVE',
            'customer_id' => Customer::firstOrFail()->id,
            'name' => 'Active Invoice Contract',
            'total_amount' => 1000,
            'status' => 'active',
        ]);
    }
}
