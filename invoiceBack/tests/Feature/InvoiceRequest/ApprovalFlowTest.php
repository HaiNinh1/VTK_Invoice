<?php

namespace Tests\Feature\InvoiceRequest;

use App\Enums\InvoiceStatus;
use App\Models\Customer;
use App\Models\InvoiceRequest;
use App\Models\InvoiceType;
use App\Models\RevenueCenter;
use App\Models\ServiceType;
use App\Services\InvoiceCodeGenerator;
use Tests\TestCase;

class ApprovalFlowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_normal_happy_path_submit_through_accountant(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $accountant = $this->makeUser('accountant', null, 'D-KT');

        $invoice = $this->seedDraft($employee, 'KV3', true);

        // submit
        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/submit")
            ->assertOk();
        $invoice->refresh();
        $this->assertSame(InvoiceStatus::Pending, $invoice->status);
        $this->assertSame($accountant->id, $invoice->current_handler_id);

        $this->actingAs($accountant, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/approve")
            ->assertOk();
        $invoice->refresh();
        $this->assertSame(InvoiceStatus::Approved, $invoice->status);
    }

    public function test_reject_returns_to_rejected(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $accountant = $this->makeUser('accountant', null, 'D-KT');

        $invoice = $this->seedDraft($employee, 'KV3', true);
        $this->actingAs($employee, 'sanctum')->postJson("/api/v1/invoice-requests/{$invoice->id}/submit")->assertOk();

        $this->actingAs($accountant, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/reject", ['comment' => 'missing docs'])
            ->assertOk();

        $invoice->refresh();
        $this->assertSame(InvoiceStatus::Rejected, $invoice->status);
    }

    public function test_manager_cannot_approve(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $manager = $this->makeUser('manager', 'KV3');
        $invoice = $this->seedDraft($employee, 'KV3', true);
        $this->actingAs($employee, 'sanctum')->postJson("/api/v1/invoice-requests/{$invoice->id}/submit")->assertOk();

        $this->actingAs($manager, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/approve")
            ->assertStatus(403);
    }

    public function test_cannot_submit_others_draft(): void
    {
        $owner = $this->makeUser('employee', 'KV3');
        $other = $this->makeUser('employee', 'KV3');
        $invoice = $this->seedDraft($owner, 'KV3', true);

        $this->actingAs($other, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/submit")
            ->assertStatus(403);
    }

    private function seedDraft($creator, string $rcCode, bool $legalComplete): InvoiceRequest
    {
        $rc = RevenueCenter::where('code', $rcCode)->first();

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
