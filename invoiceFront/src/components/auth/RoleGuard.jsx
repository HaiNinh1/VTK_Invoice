import { Navigate, useLocation } from 'react-router-dom'
import { useRole } from '@/context/RoleContext'

/**
 * RoleGuard — combined auth + role gate.
 *
 * - If still hydrating the session, render nothing (avoid flash redirect).
 * - If not authenticated, bounce to /login (preserving intended path).
 * - If role is not in `allow`, bounce to /.
 */
export function RoleGuard({ allow, children }) {
  const { role, isAuthenticated, isHydrating } = useRole()
  const location = useLocation()

  if (isHydrating) return null
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  if (allow && !allow.includes(role)) {
    return <Navigate to="/" replace />
  }
  return children
}
