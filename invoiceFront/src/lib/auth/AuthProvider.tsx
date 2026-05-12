import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { authApi } from '../api/endpoints/auth';
import { getStoredToken, setStoredToken } from '../api/client';
import type { User } from '../api/types';
import { ApiError } from '../api/errors';
import { queryClient } from '../api/queryClient';

type UserRole = 'employee' | 'manager' | 'accountant' | 'director' | 'admin';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  /** Best-effort single-role string used by the existing role-aware UI. */
  primaryRole: UserRole;
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (perm: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ROLE_RANK: Record<UserRole, number> = {
  admin: 5,
  director: 4,
  accountant: 3,
  manager: 2,
  employee: 1,
};

function pickPrimaryRole(roles?: string[]): UserRole {
  if (!roles || roles.length === 0) return 'employee';
  let best: UserRole = 'employee';
  for (const r of roles) {
    const k = r as UserRole;
    if (k in ROLE_RANK && ROLE_RANK[k] > ROLE_RANK[best]) best = k;
  }
  return best;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState<boolean>(!!getStoredToken());
  const bootRef = useRef(false);

  // Boot: if we have a token in storage, fetch /auth/me to validate it.
  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    const t = getStoredToken();
    if (!t) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const me = await authApi.me();
        setUser(me);
      } catch (e) {
        // Invalid token — clear silently
        setStoredToken(null);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Listen for 401 broadcast from axios client.
  useEffect(() => {
    const handler = () => {
      setStoredToken(null);
      setToken(null);
      setUser(null);
      queryClient.clear();
    };
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const resp = await authApi.login({ email, password });
    setStoredToken(resp.token);
    setToken(resp.token);
    setUser(resp.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore — clear locally regardless */
    }
    setStoredToken(null);
    setToken(null);
    setUser(null);
    // Drop all cached server state so the next signed-in user starts clean.
    queryClient.clear();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
    } catch (e) {
      if (e instanceof ApiError && e.isUnauthorized()) {
        setStoredToken(null);
        setToken(null);
        setUser(null);
      }
    }
  }, []);

  const hasRole = useCallback(
    (role: string | string[]) => {
      if (!user?.roles) return false;
      const list = Array.isArray(role) ? role : [role];
      return list.some((r) => user.roles!.includes(r));
    },
    [user]
  );

  const hasPermission = useCallback(
    (perm: string) => !!user?.permissions?.includes(perm),
    [user]
  );

  const primaryRole = useMemo(() => pickPrimaryRole(user?.roles), [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      primaryRole,
      hasRole,
      hasPermission,
      login,
      logout,
      refresh,
    }),
    [user, token, loading, primaryRole, hasRole, hasPermission, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export type { UserRole };
