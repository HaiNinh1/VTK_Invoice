<?php

namespace Tests;

use App\Models\Department;
use App\Models\RevenueCenter;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\DepartmentRevenueCenterSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function setUpFixtures(): void
    {
        $this->seed([
            RolePermissionSeeder::class,
            DepartmentRevenueCenterSeeder::class,
            CatalogSeeder::class,
        ]);
    }

    protected function makeUser(string $role, ?string $rcCode = null, ?string $deptCode = 'D-KD'): User
    {
        static $i = 0;
        $i++;
        $rc = $rcCode ? RevenueCenter::where('code', $rcCode)->first() : null;
        $dept = $deptCode ? Department::where('code', $deptCode)->first() : null;
        $user = User::create([
            'name' => ucfirst($role).' '.$i,
            'email' => $role.$i.'@test.local',
            'password' => 'password',
            'is_active' => true,
            'department_id' => $dept?->id,
            'revenue_center_id' => $rc?->id,
        ]);
        $user->assignRole($role);

        return $user;
    }
}
