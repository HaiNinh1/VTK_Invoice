<?php

namespace Tests\Feature\Phase4;

use App\Models\Customer;
use App\Models\InvoiceRequest;
use App\Models\InvoiceType;
use App\Models\LegalDocument;
use App\Models\RevenueCenter;
use App\Models\ServiceType;
use App\Services\InvoiceCodeGenerator;
use Tests\TestCase;

class InvoiceTypeCrudTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_admin_can_create_read_update_toggle_and_delete_invoice_type(): void
    {
        $admin = $this->makeUser('admin', 'KV3');
        $serviceType = ServiceType::firstOrFail();
        $legalDocument = LegalDocument::firstOrFail();

        $id = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/invoice-types', [
                'code' => 'P4-IT-001',
                'name' => 'Phase 4 Invoice Type',
                'description' => 'Created by Phase 4 test',
                'service_type_ids' => [$serviceType->id],
                'legal_documents' => [
                    ['legal_document_id' => $legalDocument->id, 'required' => true],
                ],
            ])
            ->assertCreated()
            ->assertJsonPath('data.code', 'P4-IT-001')
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.service_types.0.id', $serviceType->id)
            ->assertJsonPath('data.legal_documents.0.required', true)
            ->json('data.id');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/invoice-types?search=Phase%204&status=active')
            ->assertOk()
            ->assertJsonPath('data.0.code', 'P4-IT-001');

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/invoice-types/{$id}")
            ->assertOk()
            ->assertJsonPath('data.total_invoices', 0)
            ->assertJsonPath('data.compliance_rate', 0);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/invoice-types/{$id}", ['name' => 'Updated Invoice Type', 'status' => 'inactive'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Invoice Type')
            ->assertJsonPath('data.status', 'inactive');

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/invoice-types/{$id}/toggle-status")
            ->assertOk()
            ->assertJsonPath('data.status', 'active');

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/invoice-types/{$id}")
            ->assertNoContent();

        $this->assertSoftDeleted('invoice_types', ['id' => $id]);
    }

    public function test_destroy_is_blocked_when_invoice_request_references_invoice_type(): void
    {
        $admin = $this->makeUser('admin', 'KV3');
        $invoiceType = InvoiceType::firstOrFail();

        InvoiceRequest::create([
            'request_code' => app(InvoiceCodeGenerator::class)->generate(),
            'invoice_type_id' => $invoiceType->id,
            'customer_id' => Customer::firstOrFail()->id,
            'service_type_id' => ServiceType::firstOrFail()->id,
            'revenue_center_id' => RevenueCenter::where('code', 'KV3')->firstOrFail()->id,
            'creator_id' => $admin->id,
            'before_vat' => 1000,
            'tax_rate' => 10,
            'after_vat' => 1100,
            'status' => 'draft',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/invoice-types/{$invoiceType->id}")
            ->assertStatus(409);
    }

    public function test_non_admin_without_catalog_manage_cannot_access_invoice_type_admin_routes(): void
    {
        $employee = $this->makeUser('employee', 'KV3');

        $this->actingAs($employee, 'sanctum')
            ->getJson('/api/v1/invoice-types')
            ->assertForbidden();
    }

    public function test_invoice_type_validation_rejects_duplicate_code_and_bad_relations(): void
    {
        $admin = $this->makeUser('admin', 'KV3');
        $existing = InvoiceType::firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/invoice-types', [
                'code' => $existing->code,
                'name' => 'Duplicate Invoice Type',
                'service_type_ids' => [999999],
                'legal_documents' => [
                    ['legal_document_id' => 999999, 'required' => true],
                ],
                'status' => 'archived',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['code', 'service_type_ids.0', 'legal_documents.0.legal_document_id', 'status']);
    }
}
