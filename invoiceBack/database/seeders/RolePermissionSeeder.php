<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /** P0+ role matrix aligned to frontend approval model. */
    public const PERMISSIONS = [
        'invoice.view.own',
        'invoice.view.center',
        'invoice.view.all',
        'invoice.create',
        'invoice.update',
        'invoice.delete',
        'invoice.approve.accountant',
        'invoice.approve.director',
        'invoice.return',
        'invoice.issue',
        'invoice.account',
        'contract.manage',
        'invoice_type.manage',
        'user.manage',
        'report.view.center',
        'report.view.company',
    ];

    public const ROLE_MATRIX = [
        'employee' => [
            'invoice.view.own', 'invoice.create', 'invoice.update',
        ],
        'manager' => [
            'invoice.view.own', 'invoice.view.center',
            'report.view.center',
        ],
        'accountant' => [
            'invoice.view.own', 'invoice.view.all',
            'invoice.approve.accountant', 'invoice.return',
            'invoice.issue', 'invoice.account',
            'report.view.company',
        ],
        'director' => [
            'invoice.view.own', 'invoice.view.all',
            'invoice.approve.director', 'invoice.return',
            'report.view.company',
        ],
        'admin' => self::PERMISSIONS,
    ];

    public function run(): void
    {
        $guard = 'web';

        foreach (self::PERMISSIONS as $slug) {
            Permission::findOrCreate($slug, $guard);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (self::ROLE_MATRIX as $roleName => $permissions) {
            $role = Role::findOrCreate($roleName, $guard);
            $perms = $roleName === 'admin' ? self::PERMISSIONS : $permissions;
            $role->syncPermissions($perms);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
