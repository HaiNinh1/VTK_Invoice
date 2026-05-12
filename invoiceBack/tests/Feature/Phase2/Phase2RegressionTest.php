<?php

namespace Tests\Feature\Phase2;

use App\Models\Commitment;
use App\Models\Customer;
use App\Models\InvoiceRequest;
use App\Models\InvoiceType;
use App\Models\RevenueCenter;
use App\Models\ServiceType;
use App\Services\InvoiceCodeGenerator;
use Tests\TestCase;

class Phase2RegressionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_submit_with_rejected_commitment_only_still_requires_pending_commitment(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $invoice = $this->seedDraft($employee);

        Commitment::create([
            'invoice_request_id' => $invoice->id,
            'code' => 'CK-REJECTED',
            'content' => 'Cam kết đã bị từ chối trước đó.',
            'status' => 'rejected',
            'director_decision' => 'rejected',
            'deadline' => now()->addDays(5)->toDateString(),
            'created_by' => $employee->id,
        ]);

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/submit")
            ->assertForbidden();
    }

    private function seedDraft($creator): InvoiceRequest
    {
        return InvoiceRequest::create([
            'request_code' => app(InvoiceCodeGenerator::class)->generate(),
            'invoice_type_id' => InvoiceType::first()->id,
            'customer_id' => Customer::first()->id,
            'service_type_id' => ServiceType::first()->id,
            'revenue_center_id' => RevenueCenter::where('code', 'KV3')->first()->id,
            'creator_id' => $creator->id,
            'department_id' => $creator->department_id,
            'before_vat' => 1000000,
            'tax_rate' => 10,
            'after_vat' => 1100000,
            'status' => 'draft',
        ]);
    }
}
