// Frontend mirror of backend role + permission catalog.
//
// Source of truth: invoiceBack/database/seeders/RolePermissionSeeder.php
// Keep this file in sync if backend permissions change. CI should verify.

export const ROLES = [
  'admin',
  'director',
  'accountant',
  'manager',
  'employee',
] as const;
export type Role = (typeof ROLES)[number];

// Exact permission strings as defined in backend seeder. Do NOT rename.
export const PERMISSIONS = [
  // Invoice viewing — scope-based
  'invoice.view.own',
  'invoice.view.center',
  'invoice.view.all',
  // Invoice lifecycle
  'invoice.create',
  'invoice.update',
  'invoice.delete',
  'invoice.approve.accountant',
  'invoice.approve.director',
  'invoice.return',
  'invoice.issue',
  'invoice.account',
  // Catalogs / admin
  'contract.manage',
  'invoice_type.manage',
  'catalog.manage',
  'user.manage',
  // Reports
  'report.view.center',
  'report.view.company',
  // Commitments
  'commitment.create',
  'commitment.extend',
  'commitment.approve',
  'commitment.remind',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

// Role -> default permission set, mirroring RolePermissionSeeder.php.
// `admin` implicitly has all permissions; this map is informational only.
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [...PERMISSIONS],
  director: [
    'invoice.view.own',
    'invoice.view.all',
    'invoice.approve.director',
    'invoice.return',
    'report.view.company',
    'commitment.extend',
    'commitment.approve',
    'commitment.remind',
  ],
  accountant: [
    'invoice.view.own',
    'invoice.view.all',
    'invoice.approve.accountant',
    'invoice.return',
    'invoice.issue',
    'invoice.account',
    'report.view.company',
    'commitment.remind',
  ],
  manager: ['invoice.view.own', 'invoice.view.center', 'report.view.center'],
  employee: ['invoice.view.own', 'invoice.create', 'invoice.update', 'commitment.create'],
};

// --------------------------------------------------------------------------
// Authorization helpers — pure functions over a `Principal`.
// --------------------------------------------------------------------------

export interface Principal {
  roles?: string[] | null;
  permissions?: string[] | null;
}

export function hasRole(p: Principal | null | undefined, role: Role): boolean {
  if (!p?.roles) return false;
  return p.roles.includes(role);
}

export function hasAnyRole(p: Principal | null | undefined, roles: Role[]): boolean {
  if (!p?.roles || roles.length === 0) return false;
  return roles.some((r) => p.roles!.includes(r));
}

/**
 * `admin` is treated as a super-role: it satisfies any permission check, matching
 * backend Spatie behavior where role gates short-circuit permission checks.
 */
export function hasPermission(
  p: Principal | null | undefined,
  permission: Permission
): boolean {
  if (!p) return false;
  if (p.roles?.includes('admin')) return true;
  return p.permissions?.includes(permission) ?? false;
}

export function hasAnyPermission(
  p: Principal | null | undefined,
  permissions: Permission[]
): boolean {
  if (!p || permissions.length === 0) return false;
  if (p.roles?.includes('admin')) return true;
  return permissions.some((perm) => p.permissions?.includes(perm));
}

export function hasAllPermissions(
  p: Principal | null | undefined,
  permissions: Permission[]
): boolean {
  if (!p) return false;
  if (p.roles?.includes('admin')) return true;
  return permissions.every((perm) => p.permissions?.includes(perm) ?? false);
}
