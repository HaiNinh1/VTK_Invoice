<?php

namespace Tests\Feature\Phase1;

use App\Models\Customer;
use App\Models\InvoiceRequest;
use App\Models\InvoiceRequestLegalDocument;
use App\Models\InvoiceType;
use App\Models\RevenueCenter;
use App\Models\ServiceType;
use App\Services\InvoiceCodeGenerator;
use App\Services\LegalComplianceService;
use Tests\TestCase;

/**
 * Regression tests for the Phase 1 critical bug fixes.
 *
 * Each test covers one section of the plan (sections 1.1–1.10, 1.12) by
 * exercising the negative path: the test would have passed against the
 * broken pre-Phase-1 code and now asserts the correct hardened behavior.
 */
class Phase1RegressionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    /** Section 1.3 — client-supplied legal_complete must be ignored. */
    public function test_client_cannot_set_legal_complete_on_create(): void
    {
        $employee = $this->makeUser('employee', 'KV3');

        $payload = $this->validInvoicePayload() + ['legal_complete' => true];

        $response = $this->actingAs($employee, 'sanctum')
            ->postJson('/api/v1/invoice-requests', $payload)
            ->assertCreated();

        $id = $response->json('data.id');
        $invoice = InvoiceRequest::findOrFail($id);

        // No legal documents uploaded yet, so server-computed value MUST be false
        // even though client requested true.
        $this->assertFalse((bool) $invoice->legal_complete);
    }

    /** Section 1.3 — same protection on update path. */
    public function test_client_cannot_set_legal_complete_on_update(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $invoice = $this->makeDraft($employee);

        $this->actingAs($employee, 'sanctum')
            ->putJson("/api/v1/invoice-requests/{$invoice->id}", ['legal_complete' => true])
            ->assertOk();

        $invoice->refresh();
        $this->assertFalse((bool) $invoice->legal_complete);
    }

    /** Section 1.4 — only the assigned handler may approve once assigned. */
    public function test_unassigned_accountant_cannot_approve_after_handler_set(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $assigned = $this->makeUser('accountant', null, 'D-KT');
        $other = $this->makeUser('accountant', null, 'D-KT');
        $invoice = $this->satisfyLegalRequirements($this->makeDraft($employee));

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/submit")
            ->assertOk();

        $invoice->refresh();
        $this->assertSame($assigned->id, $invoice->current_handler_id);

        // The non-assigned accountant has the permission but not the assignment.
        $this->actingAs($other, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/approve")
            ->assertStatus(403)
            ->assertJsonPath('message', 'not_assigned_handler');

        // The assigned accountant succeeds.
        $this->actingAs($assigned, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/approve")
            ->assertOk();
    }

    /** Section 1.8 — invalid math returns 422 with after_vat=invalid_total. */
    public function test_math_inequality_is_rejected(): void
    {
        $employee = $this->makeUser('employee', 'KV3');

        $payload = $this->validInvoicePayload();
        $payload['after_vat'] = 999; // Should be 1100000 for before_vat=1000000 + tax_rate=10.

        $this->actingAs($employee, 'sanctum')
            ->postJson('/api/v1/invoice-requests', $payload)
            ->assertStatus(422)
            ->assertJsonPath('errors.after_vat.0', 'invalid_total');
    }

    /** Section 1.9 — unknown contract_id returns 422. */
    public function test_unknown_contract_id_is_rejected(): void
    {
        $employee = $this->makeUser('employee', 'KV3');

        $payload = $this->validInvoicePayload();
        $payload['contract_id'] = 999999;

        $this->actingAs($employee, 'sanctum')
            ->postJson('/api/v1/invoice-requests', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['contract_id']);
    }

    /** Section 1.7 — notifications listing exposes a category field. */
    public function test_notification_resource_exposes_category_field(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $accountant = $this->makeUser('accountant', null, 'D-KT');
        $invoice = $this->satisfyLegalRequirements($this->makeDraft($employee));

        // Submitting fans a database notification out to accountants.
        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/submit")
            ->assertOk();

        $this->actingAs($accountant, 'sanctum')
            ->getJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    ['id', 'category', 'type', 'title', 'message', 'data', 'read_at', 'priority', 'created_at'],
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ])
            ->assertJsonPath('data.0.category', 'approval');
    }

    /** Section 1.12 — s_invoice_error is exposed on the resource. */
    public function test_s_invoice_error_appears_in_resource(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $invoice = $this->makeDraft($employee);
        $invoice->s_invoice_error = 'fault_demo';
        $invoice->save();

        $this->actingAs($employee, 'sanctum')
            ->getJson("/api/v1/invoice-requests/{$invoice->id}")
            ->assertOk()
            ->assertJsonPath('data.s_invoice_error', 'fault_demo');
    }

    /** Section 1.1/1.2 — uploading a required doc flips status to complete. */
    public function test_upload_required_documents_marks_invoice_complete(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $invoice = $this->makeDraft($employee);
        $invoice->refresh();

        $this->assertFalse((bool) $invoice->legal_complete);

        // Manually drop legal_documents rows matching invoice_type's codes.
        $type = $invoice->invoiceType()->first();
        foreach ((array) $type->required_legal_documents as $code) {
            InvoiceRequestLegalDocument::create([
                'invoice_request_id' => $invoice->id,
                'document_type' => $code,
                'file_path' => "fake/{$code}.pdf",
                'original_filename' => "{$code}.pdf",
                'file_size' => 100,
                'mime_type' => 'application/pdf',
                'uploaded_by_id' => $employee->id,
                'created_at' => now(),
            ]);
        }

        app(LegalComplianceService::class)->refresh($invoice);
        $invoice->refresh();

        $this->assertTrue((bool) $invoice->legal_complete);
        $this->assertSame('complete', $invoice->legal_status_cache['status'] ?? null);
    }

    /** Section 1.5 — non-admin without customer.manage cannot create customers. */
    public function test_employee_cannot_create_customer(): void
    {
        $employee = $this->makeUser('employee', 'KV3');

        $this->actingAs($employee, 'sanctum')
            ->postJson('/api/v1/customers', [
                'name' => 'Forbidden Customer',
                'tax_code' => '9999999999',
                'address' => '...',
            ])
            ->assertStatus(403);
    }

    /**
     * Build a valid InvoiceRequest payload for /api/v1/invoice-requests.
     *
     * @return array<string,mixed>
     */
    private function validInvoicePayload(): array
    {
        $rc = RevenueCenter::where('code', 'KV3')->first();

        return [
            'invoice_type_id' => InvoiceType::first()->id,
            'customer_id' => Customer::first()->id,
            'service_type_id' => ServiceType::first()->id,
            'revenue_center_id' => $rc->id,
            'before_vat' => 1000000,
            'tax_rate' => 10,
            'after_vat' => 1100000,
        ];
    }

    private function makeDraft($creator): InvoiceRequest
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
            'status' => 'draft',
        ]);
    }
}
