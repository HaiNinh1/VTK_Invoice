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

class InstallmentIdempotencyTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_second_create_invoice_from_installment_returns_conflict_payload(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $contract = Contract::create([
            'code' => 'P3-IDEMP-CTR',
            'customer_id' => Customer::firstOrFail()->id,
            'name' => 'Idempotency Contract',
            'total_amount' => 1000,
            'status' => 'active',
        ]);
        $installment = PaymentInstallment::create([
            'contract_id' => $contract->id,
            'sequence' => 1,
            'name' => 'Idempotent milestone',
            'amount' => 1000,
            'due_date' => '2026-06-01',
            'status' => 'planned',
        ]);

        $firstId = $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/contracts/{$contract->id}/installments/{$installment->id}/create-invoice-request")
            ->assertCreated()
            ->json('data.id');

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/contracts/{$contract->id}/installments/{$installment->id}/create-invoice-request")
            ->assertStatus(409)
            ->assertJsonPath('code', 'installment_already_invoiced')
            ->assertJsonPath('existing_invoice_request_id', $firstId);
    }

    public function test_rejected_invoice_request_does_not_block_new_installment_invoice(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        [$contract, $installment] = $this->contractWithInstallment();
        $this->invoice($employee->id, $contract->id, $installment->id, 'rejected');

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/contracts/{$contract->id}/installments/{$installment->id}/create-invoice-request")
            ->assertCreated()
            ->assertJsonPath('data.payment_installment_id', $installment->id);
    }

    public function test_returned_invoice_request_does_not_block_new_installment_invoice(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        [$contract, $installment] = $this->contractWithInstallment();
        $this->invoice($employee->id, $contract->id, $installment->id, 'returned');

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/contracts/{$contract->id}/installments/{$installment->id}/create-invoice-request")
            ->assertCreated()
            ->assertJsonPath('data.payment_installment_id', $installment->id);
    }

    private function contractWithInstallment(): array
    {
        $contract = Contract::create([
            'code' => 'P3-IDEMP-'.uniqid(),
            'customer_id' => Customer::firstOrFail()->id,
            'name' => 'Retry Contract',
            'total_amount' => 1000,
            'status' => 'active',
        ]);
        $installment = PaymentInstallment::create([
            'contract_id' => $contract->id,
            'sequence' => 1,
            'name' => 'Retry milestone',
            'amount' => 1000,
            'due_date' => '2026-06-01',
            'status' => 'planned',
        ]);

        return [$contract, $installment];
    }

    private function invoice(int $creatorId, int $contractId, int $installmentId, string $status): InvoiceRequest
    {
        return InvoiceRequest::create([
            'request_code' => app(InvoiceCodeGenerator::class)->generate(),
            'invoice_type_id' => InvoiceType::first()->id,
            'customer_id' => Customer::first()->id,
            'service_type_id' => ServiceType::first()->id,
            'contract_id' => $contractId,
            'payment_installment_id' => $installmentId,
            'revenue_center_id' => RevenueCenter::where('code', 'KV3')->first()->id,
            'creator_id' => $creatorId,
            'before_vat' => 1000,
            'tax_rate' => 10,
            'after_vat' => 1100,
            'status' => $status,
        ]);
    }
}
