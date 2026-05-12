<?php

namespace Tests\Feature\InvoiceRequest;

use App\Models\Customer;
use App\Models\InvoiceType;
use App\Models\ServiceType;
use Tests\TestCase;

class CreateInvoiceRequestTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_employee_can_create_invoice_request(): void
    {
        $user = $this->makeUser('employee', 'KV3');
        $payload = $this->validPayload();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/invoice-requests', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonStructure(['data' => ['id', 'request_code']]);

        $this->assertMatchesRegularExpression('/^DN-\d{4}-\d{5}$/', $response->json('data.request_code'));

        $this->assertDatabaseHas('invoice_requests', [
            'creator_id' => $user->id,
            'revenue_center_id' => $user->revenue_center_id,
            'customer_id' => $payload['customer_id'],
        ]);
    }

    public function test_create_requires_auth(): void
    {
        $this->postJson('/api/v1/invoice-requests', $this->validPayload())->assertStatus(401);
    }

    public function test_validation_fails_for_missing_fields(): void
    {
        $user = $this->makeUser('employee', 'KV3');
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/invoice-requests', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['invoice_type_id', 'customer_id', 'service_type_id', 'before_vat', 'after_vat']);
    }

    public function test_user_without_create_permission_is_forbidden(): void
    {
        // accountant role has invoice.create per matrix; use a role without it.
        // From matrix, only employee/manager/accountant/director have invoice.create. admin has all.
        // No role lacks it explicitly — simulate by creating an active user without any role.
        $user = $this->makeUser('employee', 'KV3');
        $user->syncRoles([]); // strip role

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/invoice-requests', $this->validPayload())
            ->assertStatus(403);
    }

    private function validPayload(): array
    {
        return [
            'invoice_type_id' => InvoiceType::first()->id,
            'customer_id' => Customer::first()->id,
            'service_type_id' => ServiceType::first()->id,
            'before_vat' => 1000000,
            'tax_rate' => 10,
            'after_vat' => 1100000,
            'notes' => 'test create',
        ];
    }
}
