import { createContext, useContext, useMemo, useState } from 'react'
import { CURRENT_USER_BY_ROLE, ROLE_LABELS } from '@/data/masterData'

const RoleContext = createContext(null)

/**
 * RoleProvider — holds the demo "current role" and derives the current user.
 * Spec: const [currentRole, setCurrentRole] = useState('accountant')  (Prompt 1 §4)
 * Default is 'accountant' so the demo lands on the role with full visibility.
 */
export function RoleProvider({ children }) {
  const [role, setRole] = useState('accountant')
  const value = useMemo(
    () => ({
      role,
      setRole,
      user: CURRENT_USER_BY_ROLE[role],
      roleLabel: ROLE_LABELS[role],
    }),
    [role],
  )
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used inside <RoleProvider>')
  return ctx
}
