<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /** Plan §5.3 — 16 permissions × 5 roles. */
    public const PERMISSIONS = [
        'invoice.view.own',
        'invoice.view.center',
        'invoice.view.all',
        'invoice.create',
        'invoice.update',
        'invoice.delete',
        'invoice.approve.dept',
        'invoice.approve.accountant',
        'invoice.approve.director',
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
            'invoice.create', 'invoice.update',
            'invoice.approve.dept',
            'report.view.center',
        ],
        'accountant' => [
            'invoice.view.own', 'invoice.view.center', 'invoice.view.all',
            'invoice.create', 'invoice.update',
            'invoice.approve.accountant',
            'invoice.issue', 'invoice.account',
            'report.view.center', 'report.view.company',
        ],
        'director' => [
            'invoice.view.own', 'invoice.view.center', 'invoice.view.all',
            'invoice.create', 'invoice.update', 'invoice.delete',
            'invoice.approve.dept', 'invoice.approve.accountant', 'invoice.approve.director',
            'invoice.issue', 'invoice.account',
            'contract.manage', 'invoice_type.manage',
            'report.view.center', 'report.view.company',
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
