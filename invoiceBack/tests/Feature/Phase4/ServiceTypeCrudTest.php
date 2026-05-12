<?php

namespace Tests\Feature\Phase4;

use Tests\TestCase;

class ServiceTypeCrudTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_admin_can_create_read_update_and_delete_service_type(): void
    {
        $admin = $this->makeUser('admin', 'KV3');

        $id = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/service-types', [
                'code' => 'P4-SV-001',
                'name' => 'Phase 4 Service Type',
            ])
            ->assertCreated()
            ->assertJsonPath('data.code', 'P4-SV-001')
            ->json('data.id');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/service-types?search=Phase%204')
            ->assertOk()
            ->assertJsonPath('data.0.code', 'P4-SV-001');

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/service-types/{$id}", ['name' => 'Updated Service Type'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Service Type');

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/service-types/{$id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('service_types', ['id' => $id]);
    }

    public function test_service_type_validation_rejects_duplicate_code(): void
    {
        $admin = $this->makeUser('admin', 'KV3');

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/service-types', [
                'code' => 'SV-INSTALL',
                'name' => '',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['code', 'name']);
    }
}
