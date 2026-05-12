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

class ContractAggregateTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_contract_aggregates_recompute_on_status_changes_and_delete(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $contract = Contract::create([
            'code' => 'P3-AGG-CTR',
            'customer_id' => Customer::firstOrFail()->id,
            'name' => 'Aggregate Contract',
            'total_amount' => 1000,
            'total_value_after_tax' => 2200,
            'status' => 'active',
        ]);
        $installment = PaymentInstallment::create([
            'contract_id' => $contract->id,
            'sequence' => 1,
            'name' => 'Aggregate milestone',
            'amount' => 1000,
            'due_date' => '2026-06-01',
            'status' => 'planned',
        ]);

        $invoice = InvoiceRequest::create([
            'request_code' => app(InvoiceCodeGenerator::class)->generate(),
            'invoice_type_id' => InvoiceType::first()->id,
            'customer_id' => $contract->customer_id,
            'service_type_id' => ServiceType::first()->id,
            'contract_id' => $contract->id,
            'payment_installment_id' => $installment->id,
            'revenue_center_id' => RevenueCenter::where('code', 'KV3')->first()->id,
            'creator_id' => $employee->id,
            'before_vat' => 1000,
            'tax_rate' => 10,
            'after_vat' => 1100,
            'status' => 'draft',
        ]);

        $this->assertSame('0.00', $contract->refresh()->total_invoiced);

        $invoice->update(['status' => 'approved']);
        $this->assertSame('1100.00', $contract->refresh()->total_invoiced);
        $this->assertSame('0.00', $contract->total_paid);
        $this->assertSame(50.0, $contract->progress);

        $invoice->update(['status' => 'accounted']);
        $this->assertSame('1100.00', $contract->refresh()->total_paid);

        $invoice->delete();
        $this->assertSame('0.00', $contract->refresh()->total_invoiced);
        $this->assertSame('0.00', $contract->total_paid);
    }

    public function test_issued_invoice_counts_as_invoiced_but_not_paid(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $contract = Contract::create([
            'code' => 'P3-AGG-ISSUED',
            'customer_id' => Customer::firstOrFail()->id,
            'name' => 'Issued Aggregate Contract',
            'total_amount' => 1000,
            'total_value_after_tax' => 1100,
            'status' => 'active',
        ]);

        InvoiceRequest::create([
            'request_code' => app(InvoiceCodeGenerator::class)->generate(),
            'invoice_type_id' => InvoiceType::first()->id,
            'customer_id' => $contract->customer_id,
            'service_type_id' => ServiceType::first()->id,
            'contract_id' => $contract->id,
            'revenue_center_id' => RevenueCenter::where('code', 'KV3')->first()->id,
            'creator_id' => $employee->id,
            'before_vat' => 1000,
            'tax_rate' => 10,
            'after_vat' => 1100,
            'status' => 'issued',
        ]);

        $this->assertSame('1100.00', $contract->refresh()->total_invoiced);
        $this->assertSame('0.00', $contract->total_paid);
    }

    public function test_contract_progress_caps_at_one_hundred_percent(): void
    {
        $contract = Contract::create([
            'code' => 'P3-AGG-CAP',
            'customer_id' => Customer::firstOrFail()->id,
            'name' => 'Progress Cap Contract',
            'total_amount' => 1000,
            'total_value_after_tax' => 1000,
            'total_invoiced' => 2000,
            'status' => 'active',
        ]);

        $this->assertSame(100.0, $contract->progress);
        $this->assertSame(-1000.0, $contract->remaining_amount);
    }
}
