// Central axios client.
// Rules (per Oracle):
//   - Bearer-token mode only: withCredentials = false
//   - No UI side effects here except 401 -> dispatch 'auth:unauthorized'
//   - Errors are normalized to ApiError; callers never deal with raw axios errors
//   - Token is read from a pluggable provider so the AuthProvider can manage state
//     without circular imports.

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { normalizeError, ApiError } from './errors';

const TOKEN_STORAGE_KEY = 'vtk_auth_token';

// ---------- token store ----------
// Memory + localStorage. AuthProvider also subscribes via getter for hydration.
let memoryToken: string | null = null;

export function getStoredToken(): string | null {
  if (memoryToken) return memoryToken;
  try {
    memoryToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    memoryToken = null;
  }
  return memoryToken;
}

export function setStoredToken(token: string | null) {
  memoryToken = token;
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// ---------- axios instance ----------
const baseURL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api/v1';

export const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: false,
  headers: {
    Accept: 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (resp) => resp,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;
    const normalized = normalizeError(status, body);

    // Only 401 has a central side effect: clear token and broadcast.
    // Everything else (403/422/428/409) is handled by hooks/UI.
    if (status === 401) {
      setStoredToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    return Promise.reject(normalized);
  }
);

// ---------- helpers ----------
/** Unwrap Laravel `{data: T}` envelope; passes through bare T. */
export function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.get(url, config);
  return res.data as T;
}
export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.post(url, body, config);
  return res.data as T;
}
export async function apiPut<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.put(url, body, config);
  return res.data as T;
}
export async function apiPatch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.patch(url, body, config);
  return res.data as T;
}
export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.delete(url, config);
  return res.data as T;
}

export { ApiError };
