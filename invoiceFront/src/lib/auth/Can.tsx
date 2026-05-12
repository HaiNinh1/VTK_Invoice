import { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import {
  hasAllPermissions,
  hasAnyPermission,
  hasAnyRole,
  hasPermission,
  hasRole,
  Permission,
  Role,
} from './permissions';

/**
 * Conditional renderer for permission/role-gated UI.
 *
 * Backend remains the source of truth — these gates only hide UI affordances.
 * Mutating actions still re-authorize server-side via policies/middleware.
 *
 * Resolution order (first satisfied wins):
 *   - role + roles: any-of role match
 *   - permission: single permission
 *   - permissions + requireAll: any-of (default) or all-of
 *   - no gate: always render
 *
 * Examples:
 *   <Can permission="invoice.create"><Button .../></Can>
 *   <Can role="admin" fallback={<Forbidden/>}><AdminPanel/></Can>
 *   <Can permissions={['invoice.approve.accountant','invoice.approve.director']}>
 *     <ApproveBar/>
 *   </Can>
 */
export interface CanProps {
  role?: Role;
  roles?: Role[];
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export function Can({
  role,
  roles,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: CanProps): ReactNode {
  const { user } = useAuth();

  let allowed = false;

  if (role) {
    allowed = hasRole(user, role);
  } else if (roles && roles.length > 0) {
    allowed = hasAnyRole(user, roles);
  } else if (permission) {
    allowed = hasPermission(user, permission);
  } else if (permissions && permissions.length > 0) {
    allowed = requireAll
      ? hasAllPermissions(user, permissions)
      : hasAnyPermission(user, permissions);
  } else {
    // No gate specified — render unconditionally.
    allowed = true;
  }

  return <>{allowed ? children : fallback}</>;
}

/**
 * Hook form of `<Can>` — useful for disabling buttons or filtering nav items
 * without an extra wrapper element.
 */
export function useCan(): {
  role: (r: Role) => boolean;
  anyRole: (rs: Role[]) => boolean;
  permission: (p: Permission) => boolean;
  anyPermission: (ps: Permission[]) => boolean;
  allPermissions: (ps: Permission[]) => boolean;
} {
  const { user } = useAuth();
  return {
    role: (r) => hasRole(user, r),
    anyRole: (rs) => hasAnyRole(user, rs),
    permission: (p) => hasPermission(user, p),
    anyPermission: (ps) => hasAnyPermission(user, ps),
    allPermissions: (ps) => hasAllPermissions(user, ps),
  };
}
