<?php

namespace Tests\Feature\Contract;

use App\Models\Contract;
use Database\Seeders\ContractSeeder;
use Tests\TestCase;

class ListAndCreateFromInstallmentTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
        $this->seed(ContractSeeder::class);
    }

    public function test_can_list_contracts_and_installments(): void
    {
        $employee = $this->makeUser('employee', 'KV3');

        $contractId = $this->actingAs($employee, 'sanctum')
            ->getJson('/api/v1/contracts')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->json('data.0.id');

        $this->actingAs($employee, 'sanctum')
            ->getJson("/api/v1/contracts/{$contractId}/installments")
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_employee_can_create_draft_invoice_from_installment(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $contract = Contract::firstOrFail();
        $installment = $contract->installments()->firstOrFail();

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/contracts/{$contract->id}/installments/{$installment->id}/create-invoice-request")
            ->assertCreated()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.customer.id', $contract->customer_id)
            ->assertJsonPath('data.contract_id', $contract->id)
            ->assertJsonPath('data.payment_installment_id', $installment->id);
    }
}
