<?php

namespace Tests\Feature\Customer;

use Tests\TestCase;

class CustomerExtendedFieldsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_customer_can_store_and_update_buyer_fields(): void
    {
        $employee = $this->makeUser('admin');

        $response = $this->actingAs($employee, 'sanctum')
            ->postJson('/api/v1/customers', [
                'name' => 'Khách hàng P0',
                'tax_code' => 'P000000001',
                'address' => 'Hà Nội',
                'buyer_name' => 'Người mua hàng',
                'buyer_email' => 'buyer@example.test',
                'buyer_phone' => '0909000000',
            ])
            ->assertCreated()
            ->assertJsonPath('data.buyer_name', 'Người mua hàng')
            ->assertJsonPath('data.buyer_email', 'buyer@example.test');

        $id = $response->json('data.id');

        $this->actingAs($employee, 'sanctum')
            ->putJson("/api/v1/customers/{$id}", [
                'buyer_name' => 'Người mua cập nhật',
                'buyer_email' => 'buyer.updated@example.test',
                'buyer_phone' => '0909000001',
            ])
            ->assertOk()
            ->assertJsonPath('data.buyer_name', 'Người mua cập nhật')
            ->assertJsonPath('data.buyer_phone', '0909000001');
    }

    public function test_buyer_email_must_be_valid(): void
    {
        $employee = $this->makeUser('employee', 'KV3');

        $this->actingAs($employee, 'sanctum')
            ->postJson('/api/v1/customers', [
                'name' => 'Khách hàng lỗi',
                'tax_code' => 'P000000002',
                'buyer_email' => 'not-email',
            ])
            ->assertStatus(422);
    }
}
