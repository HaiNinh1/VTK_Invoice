<?php

namespace Tests\Feature\Approval;

use App\Enums\InvoiceStatus;
use App\Models\Commitment;
use App\Models\Customer;
use App\Models\InvoiceRequest;
use App\Models\InvoiceType;
use App\Models\RevenueCenter;
use App\Models\ServiceType;
use App\Services\InvoiceCodeGenerator;
use Tests\TestCase;

class SpecialBranchTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_legal_incomplete_with_commitment_routes_to_director(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $director = $this->makeUser('director', null, 'D-VPGD');
        $invoice = $this->seedDraft($employee, false);
        Commitment::create([
            'invoice_request_id' => $invoice->id,
            'code' => 'CK-001',
            'content' => 'Bổ sung hồ sơ pháp lý sau.',
            'status' => 'pending',
            'director_decision' => 'pending',
            'created_by' => $employee->id,
        ]);

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/submit")
            ->assertOk()
            ->assertJsonPath('data.status', 'pending-vpgd');

        $invoice->refresh();
        $this->assertSame(InvoiceStatus::PendingVpgd, $invoice->status);
        $this->assertSame($director->id, $invoice->current_handler_id);

        $this->actingAs($director, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');
    }

    public function test_legal_incomplete_without_commitment_cannot_submit(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $invoice = $this->seedDraft($employee, false);

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/submit")
            ->assertStatus(403);
    }

    private function seedDraft($creator, bool $legalComplete): InvoiceRequest
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
            'legal_complete' => $legalComplete,
            'status' => 'draft',
        ]);
    }
}
