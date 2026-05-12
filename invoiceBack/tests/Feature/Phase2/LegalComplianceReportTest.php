<?php

namespace Tests\Feature\Phase2;

use App\Models\AuditApproval;
use App\Models\Customer;
use App\Models\InvoiceRequest;
use App\Models\InvoiceType;
use App\Models\RevenueCenter;
use App\Models\ServiceType;
use App\Services\InvoiceCodeGenerator;
use Tests\TestCase;

class LegalComplianceReportTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_accountant_can_view_legal_compliance_report_totals(): void
    {
        $accountant = $this->makeUser('accountant');
        $employee = $this->makeUser('employee', 'KV3');
        $this->seedInvoice($employee, 'complete');
        $this->seedInvoice($employee, 'missing');
        $this->seedInvoice($employee, 'supplementing');

        $this->actingAs($accountant, 'sanctum')
            ->getJson('/api/v1/reports/legal-compliance')
            ->assertOk()
            ->assertJsonPath('data.totals.total', 3)
            ->assertJsonPath('data.totals.complete', 1)
            ->assertJsonPath('data.totals.insufficient', 1)
            ->assertJsonPath('data.totals.supplementing', 1)
            ->assertJsonPath('data.by_center.0.total', 3)
            ->assertJsonPath('data.by_service.0.total', 3);
    }

    public function test_director_can_approve_report_creating_audit_approval(): void
    {
        $director = $this->makeUser('director', null, 'D-VPGD');
        $employee = $this->makeUser('employee', 'KV3');
        $this->seedInvoice($employee, 'complete');

        $response = $this->actingAs($director, 'sanctum')
            ->postJson('/api/v1/reports/legal-compliance/approve')
            ->assertOk()
            ->assertJsonPath('data.report_type', 'legal_compliance');

        $approval = AuditApproval::firstOrFail();
        $this->assertSame($director->id, $approval->approver_id);
        $this->assertNotNull($approval->signature_snapshot_id);
        $this->assertSame($approval->signature_snapshot_id, $response->json('data.signature_snapshot_id'));
    }

    public function test_employee_cannot_access_legal_compliance_report(): void
    {
        $employee = $this->makeUser('employee', 'KV3');

        $this->actingAs($employee, 'sanctum')
            ->getJson('/api/v1/reports/legal-compliance')
            ->assertForbidden();
    }

    private function seedInvoice($creator, string $legalStatus): InvoiceRequest
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
            'legal_complete' => $legalStatus === 'complete',
            'legal_status_cache' => [
                'required' => ['contract'],
                'completed' => $legalStatus === 'complete' ? ['contract'] : [],
                'missing' => $legalStatus === 'complete' ? [] : ['contract'],
                'status' => $legalStatus,
            ],
        ]);
    }
}
