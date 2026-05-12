<?php

namespace Tests\Feature\Phase4;

use App\Models\Customer;
use App\Models\InvoiceRequest;
use App\Models\InvoiceType;
use App\Models\LegalDocument;
use App\Models\RevenueCenter;
use App\Models\ServiceType;
use App\Services\InvoiceCodeGenerator;
use App\Services\LegalComplianceService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class InvoiceTypeComplianceIntegrationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
        Storage::fake('local');
    }

    public function test_invoice_type_required_legal_documents_drive_invoice_compliance(): void
    {
        $admin = $this->makeUser('admin', 'KV3');
        $employee = $this->makeUser('employee', 'KV3');
        $document = LegalDocument::create([
            'code' => 'P4-REQ-DOC',
            'name' => 'Required Pivot Document',
            'group' => 'contract',
            'default_required' => false,
            'enabled' => true,
        ]);
        $serviceType = ServiceType::firstOrFail();

        $invoiceTypeId = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/invoice-types', [
                'code' => 'P4-COMPLIANCE',
                'name' => 'Compliance Invoice Type',
                'service_type_ids' => [$serviceType->id],
                'legal_documents' => [
                    ['legal_document_id' => $document->id, 'required' => true],
                ],
            ])
            ->assertCreated()
            ->json('data.id');

        $invoice = InvoiceRequest::create([
            'request_code' => app(InvoiceCodeGenerator::class)->generate(),
            'invoice_type_id' => $invoiceTypeId,
            'customer_id' => Customer::firstOrFail()->id,
            'service_type_id' => $serviceType->id,
            'revenue_center_id' => RevenueCenter::where('code', 'KV3')->firstOrFail()->id,
            'creator_id' => $employee->id,
            'department_id' => $employee->department_id,
            'before_vat' => 1000,
            'tax_rate' => 10,
            'after_vat' => 1100,
            'status' => 'draft',
        ]);

        app(LegalComplianceService::class)->refresh($invoice);
        $invoice->refresh();

        $this->assertFalse($invoice->legal_complete);
        $this->assertSame(['P4-REQ-DOC'], $invoice->legal_status_cache['missing']);

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/legal-documents", [
                'document_type' => 'P4-REQ-DOC',
                'file' => UploadedFile::fake()->create('required.pdf', 64, 'application/pdf'),
            ])
            ->assertCreated();

        $invoice->refresh();
        $this->assertTrue($invoice->legal_complete);
        $this->assertSame('complete', $invoice->legal_status_cache['status']);
    }

    public function test_optional_pivot_documents_do_not_block_compliance(): void
    {
        $admin = $this->makeUser('admin', 'KV3');
        $employee = $this->makeUser('employee', 'KV3');
        $document = LegalDocument::create([
            'code' => 'P4-OPTIONAL-DOC',
            'name' => 'Optional Pivot Document',
            'group' => 'contract',
            'default_required' => false,
            'enabled' => true,
        ]);
        $serviceType = ServiceType::firstOrFail();

        $invoiceType = InvoiceType::create([
            'code' => 'P4-OPTIONAL',
            'name' => 'Optional Invoice Type',
            'status' => 'active',
        ]);
        $invoiceType->legalDocuments()->attach($document->id, ['required' => false]);

        $invoice = InvoiceRequest::create([
            'request_code' => app(InvoiceCodeGenerator::class)->generate(),
            'invoice_type_id' => $invoiceType->id,
            'customer_id' => Customer::firstOrFail()->id,
            'service_type_id' => $serviceType->id,
            'revenue_center_id' => RevenueCenter::where('code', 'KV3')->firstOrFail()->id,
            'creator_id' => $employee->id,
            'department_id' => $employee->department_id,
            'before_vat' => 1000,
            'tax_rate' => 10,
            'after_vat' => 1100,
            'status' => 'draft',
        ]);

        app(LegalComplianceService::class)->refresh($invoice);

        $this->assertFalse($admin->cannot('catalog.manage'));
        $this->assertTrue($invoice->refresh()->legal_complete);
    }
}
