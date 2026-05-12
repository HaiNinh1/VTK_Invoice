<?php

namespace Tests\Feature\Rbac;

use Database\Seeders\RolePermissionSeeder;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PermissionMatrixTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    #[DataProvider('matrixProvider')]
    public function test_role_has_expected_permission(string $role, string $permission, bool $expected): void
    {
        $user = $this->makeUser($role, 'KV1');
        $this->assertSame($expected, $user->can($permission), "{$role} ⇒ {$permission} should be ".($expected ? 'true' : 'false'));
    }

    public static function matrixProvider(): array
    {
        $cases = [];
        foreach (RolePermissionSeeder::ROLE_MATRIX as $role => $perms) {
            $allowed = $role === 'admin' ? RolePermissionSeeder::PERMISSIONS : $perms;
            foreach (RolePermissionSeeder::PERMISSIONS as $perm) {
                $expected = in_array($perm, $allowed, true);
                $cases["{$role}:{$perm}"] = [$role, $perm, $expected];
            }
        }

        return $cases;
    }
}
