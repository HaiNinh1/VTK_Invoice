<?php

namespace Tests\Feature\Approval;

use App\Models\Customer;
use App\Models\InvoiceRequest;
use App\Models\InvoiceType;
use App\Models\RevenueCenter;
use App\Models\ServiceType;
use App\Services\InvoiceCodeGenerator;
use Tests\TestCase;

class ManagerReadOnlyTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_manager_can_view_center_requests_but_cannot_approve_or_create(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $manager = $this->makeUser('manager', 'KV3');
        $invoice = $this->seedDraft($employee);

        $this->actingAs($manager, 'sanctum')
            ->getJson('/api/v1/invoice-requests')
            ->assertOk();

        $this->actingAs($manager, 'sanctum')
            ->postJson('/api/v1/invoice-requests', [])
            ->assertStatus(403);

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/submit")
            ->assertOk();

        $this->actingAs($manager, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/approve")
            ->assertStatus(403);
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
