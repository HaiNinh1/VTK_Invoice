import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ROLE_LABELS } from '@/data/masterData'
import { api, getToken, setToken, setUnauthorizedHandler } from '@/services/api'

/* -----------------------------------------------------------------------
 * RoleContext (a.k.a. AuthContext)
 *
 * Backed by real Sanctum auth. On mount, if a bearer token exists in
 * localStorage we call GET /api/auth/me to hydrate the current user.
 *
 * Public API (preserved from the demo version so all consumers keep
 * working without changes):
 *   { role, setRole, user, roleLabel }
 *
 * Additional auth API:
 *   { token, isAuthenticated, isHydrating, login, logout, refreshUser }
 *
 * `setRole` is now a no-op (role comes from the server user). It's kept
 * so legacy callers don't crash.
 * --------------------------------------------------------------------- */

const RoleContext = createContext(null)

function normalizeUser(u) {
  if (!u) return null
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    roleLabel: u.roleLabel ?? ROLE_LABELS[u.role] ?? u.role,
    department: u.department,
    phone: u.phone ?? null,
    title: u.title ?? null,
    hasSignature: Boolean(u.hasSignature),
    signaturePath: u.signaturePath ?? null,
  }
}

export function RoleProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setTokenState] = useState(() => getToken())
  const [isHydrating, setIsHydrating] = useState(Boolean(getToken()))

  // Hydrate user when a token exists (page reload, new tab, etc.)
  useEffect(() => {
    let cancelled = false
    if (!token) {
      setUser(null)
      setIsHydrating(false)
      return
    }
    setIsHydrating(true)
    api.get('/auth/me')
      .then(res => {
        if (cancelled) return
        const data = res.data?.data ?? res.data
        setUser(normalizeUser(data))
      })
      .catch(() => {
        if (cancelled) return
        setToken(null)
        setTokenState(null)
        setUser(null)
      })
      .finally(() => { if (!cancelled) setIsHydrating(false) })
    return () => { cancelled = true }
  }, [token])

  // Wire 401 -> clear local state. The api client also redirects.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setTokenState(null)
      setUser(null)
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token: newToken, user: u } = res.data
    setToken(newToken)
    setTokenState(newToken)
    setUser(normalizeUser(u))
    return { token: newToken, user: normalizeUser(u) }
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    setToken(null)
    setTokenState(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const res = await api.get('/auth/me')
    const data = res.data?.data ?? res.data
    const u = normalizeUser(data)
    setUser(u)
    return u
  }, [])

  // Legacy alias: components used to do useRole().setRole(role). It now
  // becomes a no-op so nothing crashes; the role is the server-provided one.
  const setRole = useCallback(() => { /* no-op under real auth */ }, [])

  const role = user?.role ?? 'employee'
  const roleLabel = user?.roleLabel ?? ROLE_LABELS[role] ?? role

  const value = useMemo(
    () => ({
      role, setRole,
      user,
      roleLabel,
      token,
      isAuthenticated: Boolean(token && user),
      isHydrating,
      login, logout, refreshUser, setUser,
    }),
    [role, setRole, user, roleLabel, token, isHydrating, login, logout, refreshUser],
  )

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used inside <RoleProvider>')
  return ctx
}

/** Backward-compatible alias for new call sites. */
export const useAuth = useRole
