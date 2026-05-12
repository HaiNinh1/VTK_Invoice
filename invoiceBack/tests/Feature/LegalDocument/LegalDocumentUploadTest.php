<?php

namespace Tests\Feature\LegalDocument;

use App\Models\Customer;
use App\Models\InvoiceRequest;
use App\Models\InvoiceType;
use App\Models\RevenueCenter;
use App\Models\ServiceType;
use App\Services\InvoiceCodeGenerator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LegalDocumentUploadTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
        Storage::fake('local');
    }

    public function test_employee_can_upload_pdf_legal_document(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $invoice = $this->seedDraft($employee);

        $response = $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/legal-documents", [
                'document_type' => 'contract',
                'file' => UploadedFile::fake()->create('contract.pdf', 64, 'application/pdf'),
            ])
            ->assertCreated()
            ->assertJsonPath('data.document_type', 'contract')
            ->assertJsonPath('data.original_filename', 'contract.pdf');

        Storage::disk('local')->assertExists($response->json('data.file_path'));
        $this->assertDatabaseHas('invoice_request_legal_documents', [
            'invoice_request_id' => $invoice->id,
            'document_type' => 'contract',
            'original_filename' => 'contract.pdf',
        ]);
    }

    public function test_executable_upload_is_rejected(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $invoice = $this->seedDraft($employee);

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/legal-documents", [
                'document_type' => 'contract',
                'file' => UploadedFile::fake()->create('virus.exe', 64, 'application/octet-stream'),
            ])
            ->assertStatus(422);
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
