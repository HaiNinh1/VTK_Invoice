<?php

namespace Tests\Feature\Timeline;

use App\Models\Customer;
use App\Models\InvoiceRequest;
use App\Models\InvoiceType;
use App\Models\RevenueCenter;
use App\Models\ServiceType;
use App\Services\InvoiceCodeGenerator;
use Tests\TestCase;

class ActivityLogTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_timeline_returns_submit_and_approval_activity(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $accountant = $this->makeUser('accountant', null, 'D-KT');
        $invoice = $this->seedDraft($employee);

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/submit")
            ->assertOk();

        $this->actingAs($accountant, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/approve")
            ->assertOk();

        $this->actingAs($employee, 'sanctum')
            ->getJson("/api/v1/invoice-requests/{$invoice->id}/timeline")
            ->assertOk()
            ->assertJsonStructure(['data' => [['actor', 'action', 'note', 'created_at']]])
            ->assertJsonCount(3, 'data');
    }

    private function seedDraft($creator): InvoiceRequest
    {
        $rc = RevenueCenter::where('code', 'KV3')->first();

        return InvoiceRequest::create([
            'request_code' => app(InvoiceCodeGenerator::class)->generate(),
            'invoice_type_id' => InvoiceType::first()->id,
            'customer_id' => Customer::first()->id,
            'service_type_id' => ServiceType::first()->id,
            'revenue_center_id' => $rc->id,
            'creator_id' => $creator->id,
            'department_id' => $creator->department_id,
            'before_vat' => 1000000,
            'tax_rate' => 10,
            'after_vat' => 1100000,
            'legal_complete' => true,
            'status' => 'draft',
        ]);
    }
}
