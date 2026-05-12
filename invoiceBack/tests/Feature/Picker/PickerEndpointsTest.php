<?php

namespace Tests\Feature\Picker;

use App\Models\RevenueCenter;
use Tests\TestCase;

class PickerEndpointsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_revenue_centers_index_requires_authentication(): void
    {
        $this->getJson('/api/v1/revenue-centers')->assertUnauthorized();
    }

    public function test_users_index_requires_authentication(): void
    {
        $this->getJson('/api/v1/users')->assertUnauthorized();
    }

    public function test_any_authenticated_user_can_list_revenue_centers(): void
    {
        $employee = $this->makeUser('employee', 'KV3');

        RevenueCenter::query()->firstOrCreate(
            ['code' => 'KV-PICKER-1'],
            ['name' => 'Picker Test Center 1']
        );

        $this->actingAs($employee, 'sanctum')
            ->getJson('/api/v1/revenue-centers')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'code', 'name']],
                'total',
                'per_page',
            ]);
    }

    public function test_revenue_centers_search_filters_by_code_or_name(): void
    {
        $admin = $this->makeUser('admin', 'KV3');

        RevenueCenter::query()->firstOrCreate(
            ['code' => 'KV-UNIQ-XYZ'],
            ['name' => 'Search Target Center']
        );

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/revenue-centers?search=UNIQ-XYZ')
            ->assertOk()
            ->assertJsonPath('data.0.code', 'KV-UNIQ-XYZ');
    }

    public function test_any_authenticated_user_can_list_users_lite(): void
    {
        $employee = $this->makeUser('employee', 'KV3');

        $this->actingAs($employee, 'sanctum')
            ->getJson('/api/v1/users')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'name', 'employee_code', 'department_id', 'revenue_center_id']],
                'total',
                'per_page',
            ])
            // Lite shape must not leak sensitive fields.
            ->assertJsonMissingPath('data.0.email')
            ->assertJsonMissingPath('data.0.phone')
            ->assertJsonMissingPath('data.0.password');
    }

    public function test_users_search_filters_by_name_or_employee_code(): void
    {
        $admin = $this->makeUser('admin', 'KV3');
        $target = $this->makeUser('employee', 'KV3');
        $target->update(['name' => 'PickerTarget User', 'employee_code' => 'EMP-PICK-1']);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/users?search=PickerTarget')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'PickerTarget User');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/users?search=EMP-PICK-1')
            ->assertOk()
            ->assertJsonPath('data.0.employee_code', 'EMP-PICK-1');
    }

    public function test_users_role_filter_works(): void
    {
        $admin = $this->makeUser('admin', 'KV3');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/users?role=admin')
            ->assertOk()
            ->assertJsonStructure(['data', 'total']);
    }
}
