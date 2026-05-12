<?php

namespace Tests\Feature\Phase3;

use App\Models\Contract;
use App\Models\Customer;
use App\Models\InvoiceRequest;
use App\Models\InvoiceType;
use App\Models\PaymentInstallment;
use App\Models\RevenueCenter;
use App\Models\ServiceType;
use App\Services\InvoiceCodeGenerator;
use Tests\TestCase;

class InstallmentCrudTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_admin_can_crud_installments_with_auto_sequence(): void
    {
        $admin = $this->makeUser('admin', 'KV3');
        $contract = $this->contract();

        $first = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/contracts/{$contract->id}/installments", [
                'amount' => 500000,
                'due_date' => '2026-06-01',
                'description' => 'First milestone',
            ])
            ->assertCreated()
            ->assertJsonPath('data.sequence', 1)
            ->json('data.id');

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/contracts/{$contract->id}/installments", [
                'amount' => 600000,
                'due_date' => '2026-07-01',
                'status' => 'scheduled',
            ])
            ->assertCreated()
            ->assertJsonPath('data.sequence', 2);

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/contracts/{$contract->id}/installments")
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/contracts/{$contract->id}/installments/{$first}", ['status' => 'invoiced'])
            ->assertOk()
            ->assertJsonPath('data.status', 'invoiced');

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/contracts/{$contract->id}/installments/{$first}")
            ->assertNoContent();
    }

    public function test_delete_installment_is_blocked_when_linked_to_invoice_request(): void
    {
        $admin = $this->makeUser('admin', 'KV3');
        $contract = $this->contract();
        $installment = PaymentInstallment::create([
            'contract_id' => $contract->id,
            'sequence' => 1,
            'name' => 'Blocked milestone',
            'amount' => 1000,
            'due_date' => '2026-06-01',
            'status' => 'planned',
        ]);

        InvoiceRequest::create([
            'request_code' => app(InvoiceCodeGenerator::class)->generate(),
            'invoice_type_id' => InvoiceType::first()->id,
            'customer_id' => $contract->customer_id,
            'service_type_id' => ServiceType::first()->id,
            'contract_id' => $contract->id,
            'payment_installment_id' => $installment->id,
            'revenue_center_id' => RevenueCenter::where('code', 'KV3')->first()->id,
            'creator_id' => $admin->id,
            'before_vat' => 1000,
            'tax_rate' => 10,
            'after_vat' => 1100,
            'status' => 'draft',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/contracts/{$contract->id}/installments/{$installment->id}")
            ->assertStatus(409);
    }

    public function test_non_admin_without_contract_manage_cannot_mutate_installments(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $contract = $this->contract();

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/contracts/{$contract->id}/installments", [
                'amount' => 1000,
                'due_date' => '2026-06-01',
            ])
            ->assertForbidden();
    }

    public function test_store_installment_accepts_explicit_sequence(): void
    {
        $admin = $this->makeUser('admin', 'KV3');
        $contract = $this->contract();

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/contracts/{$contract->id}/installments", [
                'sequence' => 5,
                'amount' => 1000,
                'due_date' => '2026-06-01',
            ])
            ->assertCreated()
            ->assertJsonPath('data.sequence', 5);
    }

    public function test_installment_validation_requires_positive_amount_and_due_date(): void
    {
        $admin = $this->makeUser('admin', 'KV3');
        $contract = $this->contract();

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/contracts/{$contract->id}/installments", ['amount' => 0])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['amount', 'due_date']);
    }

    private function contract(): Contract
    {
        return Contract::create([
            'code' => 'P3-INST-CTR',
            'customer_id' => Customer::firstOrFail()->id,
            'name' => 'Installment Contract',
            'total_amount' => 1100000,
            'status' => 'active',
        ]);
    }
}
