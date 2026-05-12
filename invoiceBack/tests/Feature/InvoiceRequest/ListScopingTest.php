<?php

namespace Tests\Feature\InvoiceRequest;

use App\Models\Customer;
use App\Models\InvoiceRequest;
use App\Models\InvoiceType;
use App\Models\RevenueCenter;
use App\Models\ServiceType;
use App\Services\InvoiceCodeGenerator;
use Tests\TestCase;

class ListScopingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_employee_sees_only_own_requests(): void
    {
        $ownerKv3 = $this->makeUser('employee', 'KV3');
        $otherKv3 = $this->makeUser('employee', 'KV3');
        $this->seedRequest($ownerKv3, 'KV3');
        $this->seedRequest($ownerKv3, 'KV3');
        $this->seedRequest($otherKv3, 'KV3');

        $response = $this->actingAs($ownerKv3, 'sanctum')->getJson('/api/v1/invoice-requests');
        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_manager_sees_revenue_center_requests(): void
    {
        $manager = $this->makeUser('manager', 'KV3');
        $kv3a = $this->makeUser('employee', 'KV3');
        $kv1 = $this->makeUser('employee', 'KV1');
        $this->seedRequest($kv3a, 'KV3');
        $this->seedRequest($kv3a, 'KV3');
        $this->seedRequest($kv1, 'KV1');

        $response = $this->actingAs($manager, 'sanctum')->getJson('/api/v1/invoice-requests');
        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_accountant_sees_all_requests(): void
    {
        $accountant = $this->makeUser('accountant', null, 'D-KT');
        $kv3 = $this->makeUser('employee', 'KV3');
        $kv1 = $this->makeUser('employee', 'KV1');
        $this->seedRequest($kv3, 'KV3');
        $this->seedRequest($kv1, 'KV1');

        $response = $this->actingAs($accountant, 'sanctum')->getJson('/api/v1/invoice-requests');
        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    private function seedRequest($creator, string $rcCode): InvoiceRequest
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
