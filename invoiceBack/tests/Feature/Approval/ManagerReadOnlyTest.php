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
        $type = InvoiceType::first();

        $invoice = InvoiceRequest::create([
            'request_code' => app(InvoiceCodeGenerator::class)->generate(),
            'invoice_type_id' => $type->id,
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

        // Satisfy invoice-type legal requirements so submit() passes.
        // `legal_complete` is now computed server-side from these uploads.
        foreach ((array) $type->required_legal_documents as $code) {
            $invoice->legalDocuments()->create([
                'document_type' => $code,
                'file_path' => "fake/{$code}.pdf",
                'original_filename' => "{$code}.pdf",
                'file_size' => 100,
                'mime_type' => 'application/pdf',
                'uploaded_by_id' => $creator->id,
                'created_at' => now(),
            ]);
        }

        app(\App\Services\LegalComplianceService::class)->refresh($invoice);

        return $invoice;
    }
}
