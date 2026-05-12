<?php

namespace Tests\Feature\Dashboard;

use App\Models\Customer;
use App\Models\InvoiceRequest;
use App\Models\InvoiceType;
use App\Models\RevenueCenter;
use App\Models\ServiceType;
use App\Services\InvoiceCodeGenerator;
use Tests\TestCase;

class DashboardAggregatesTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_employee_dashboard_is_own_scope(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $other = $this->makeUser('employee', 'KV1');
        $this->seedInvoice($employee, 'draft');
        $this->seedInvoice($employee, 'pending');
        $this->seedInvoice($other, 'approved', 'KV1');

        $this->actingAs($employee, 'sanctum')
            ->getJson('/api/v1/dashboard')
            ->assertOk()
            ->assertJsonPath('data.scope', 'own')
            ->assertJsonPath('data.total', 2)
            ->assertJsonPath('data.pending', 1);
    }

    public function test_manager_dashboard_is_revenue_center_scope(): void
    {
        $manager = $this->makeUser('manager', 'KV3');
        $employee = $this->makeUser('employee', 'KV3');
        $other = $this->makeUser('employee', 'KV1');
        $this->seedInvoice($employee, 'draft');
        $this->seedInvoice($employee, 'pending_vpgd');
        $this->seedInvoice($other, 'approved', 'KV1');

        $this->actingAs($manager, 'sanctum')
            ->getJson('/api/v1/dashboard')
            ->assertOk()
            ->assertJsonPath('data.scope', 'revenue-center')
            ->assertJsonPath('data.total', 2)
            ->assertJsonPath('data.pending', 1);
    }

    public function test_accountant_dashboard_is_company_scope(): void
    {
        $accountant = $this->makeUser('accountant');
        $employee = $this->makeUser('employee', 'KV3');
        $other = $this->makeUser('employee', 'KV1');
        $this->seedInvoice($employee, 'pending');
        $this->seedInvoice($other, 'approved', 'KV1');

        $this->actingAs($accountant, 'sanctum')
            ->getJson('/api/v1/dashboard')
            ->assertOk()
            ->assertJsonPath('data.scope', 'company')
            ->assertJsonPath('data.total', 2)
            ->assertJsonPath('data.by_status.pending', 1)
            ->assertJsonPath('data.by_status.approved', 1);
    }

    private function seedInvoice($creator, string $status, string $center = 'KV3'): InvoiceRequest
    {
        return InvoiceRequest::create([
            'request_code' => app(InvoiceCodeGenerator::class)->generate(),
            'invoice_type_id' => InvoiceType::first()->id,
            'customer_id' => Customer::first()->id,
            'service_type_id' => ServiceType::first()->id,
            'revenue_center_id' => RevenueCenter::where('code', $center)->first()->id,
            'creator_id' => $creator->id,
            'department_id' => $creator->department_id,
            'before_vat' => 1000000,
            'tax_rate' => 10,
            'after_vat' => 1100000,
            'status' => $status,
        ]);
    }
}
