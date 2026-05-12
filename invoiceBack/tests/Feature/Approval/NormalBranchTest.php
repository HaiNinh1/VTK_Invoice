<?php

namespace Tests\Feature\Approval;

use App\Enums\InvoiceStatus;
use App\Models\Customer;
use App\Models\InvoiceRequest;
use App\Models\InvoiceType;
use App\Models\RevenueCenter;
use App\Models\ServiceType;
use App\Services\InvoiceCodeGenerator;
use Tests\TestCase;

class NormalBranchTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_legal_complete_request_routes_to_accountant_and_approves_to_approved(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $accountant = $this->makeUser('accountant', null, 'D-KT');
        $invoice = $this->seedDraft($employee, true);

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/submit")
            ->assertOk()
            ->assertJsonPath('data.status', 'pending');

        $invoice->refresh();
        $this->assertSame(InvoiceStatus::Pending, $invoice->status);
        $this->assertSame($accountant->id, $invoice->current_handler_id);

        $this->actingAs($accountant, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/approve", ['comment' => 'normal ok'])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $invoice->refresh();
        $this->assertSame(InvoiceStatus::Approved, $invoice->status);
        $this->assertSame($accountant->id, $invoice->approved_by_id);
    }

    private function seedDraft($creator, bool $legalComplete): InvoiceRequest
    {
        $rc = RevenueCenter::where('code', 'KV3')->first();

        $invoice = InvoiceRequest::create([
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
            'status' => 'draft',
        ]);

        return $legalComplete ? $this->satisfyLegalRequirements($invoice) : $invoice;
    }
}
