import { Navigate } from 'react-router-dom'
import { useRole } from '@/context/RoleContext'

/**
 * RoleGuard — chỉ render children nếu role hiện tại nằm trong allow list.
 * Nếu không, redirect tới /. Spec: chỉ Kế toán/QTV vào /s-invoice, /cai-dat;
 * Nhân viên/Quản lý không vào /phe-duyet.
 */
export function RoleGuard({ allow, children }) {
  const { role } = useRole()
  if (!allow.includes(role)) {
    return <Navigate to="/" replace />
  }
  return children
}
