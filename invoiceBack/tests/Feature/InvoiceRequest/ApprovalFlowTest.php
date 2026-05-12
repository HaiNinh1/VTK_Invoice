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

    public function test_full_happy_path_submit_through_director(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $manager = $this->makeUser('manager', 'KV3');
        $accountant = $this->makeUser('accountant', null, 'D-KT');
        $director = $this->makeUser('director', null, 'D-VPGD');

        $invoice = $this->seedDraft($employee, 'KV3');

        // submit
        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/submit")
            ->assertOk();
        $invoice->refresh();
        $this->assertSame(InvoiceStatus::Pending, $invoice->status);

        // dept approval (manager of KV3)
        $this->actingAs($manager, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/approve")
            ->assertOk();
        $invoice->refresh();
        $this->assertSame(InvoiceStatus::PendingVpgd, $invoice->status);

        // accountant approval (does not promote to approved)
        $this->actingAs($accountant, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/approve")
            ->assertOk();
        $invoice->refresh();
        $this->assertSame(InvoiceStatus::PendingVpgd, $invoice->status);

        // director approval -> Approved
        $this->actingAs($director, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/approve")
            ->assertOk();
        $invoice->refresh();
        $this->assertSame(InvoiceStatus::Approved, $invoice->status);
    }

    public function test_reject_returns_to_rejected(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $manager = $this->makeUser('manager', 'KV3');

        $invoice = $this->seedDraft($employee, 'KV3');
        $this->actingAs($employee, 'sanctum')->postJson("/api/v1/invoice-requests/{$invoice->id}/submit")->assertOk();

        $this->actingAs($manager, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/reject", ['comment' => 'missing docs'])
            ->assertOk();

        $invoice->refresh();
        $this->assertSame(InvoiceStatus::Rejected, $invoice->status);
    }

    public function test_manager_of_different_center_cannot_approve(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $managerKv1 = $this->makeUser('manager', 'KV1');
        $invoice = $this->seedDraft($employee, 'KV3');
        $this->actingAs($employee, 'sanctum')->postJson("/api/v1/invoice-requests/{$invoice->id}/submit")->assertOk();

        $this->actingAs($managerKv1, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/approve")
            ->assertStatus(403);
    }

    public function test_cannot_submit_others_draft(): void
    {
        $owner = $this->makeUser('employee', 'KV3');
        $other = $this->makeUser('employee', 'KV3');
        $invoice = $this->seedDraft($owner, 'KV3');

        $this->actingAs($other, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/submit")
            ->assertStatus(403);
    }

    private function seedDraft($creator, string $rcCode): InvoiceRequest
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
            'status' => 'draft',
        ]);
    }
}
