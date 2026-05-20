import axios from 'axios'

/* -----------------------------------------------------------------------
 * api.js — single axios client used by all contexts/pages.
 *
 * Auth: Sanctum personal-access bearer token. Token is persisted in
 * localStorage under `vtk:auth:token` and replayed via an interceptor.
 *
 * On 401, the token is cleared and the page is redirected to /login.
 *
 * Base URL: VITE_API_BASE_URL (defaults to "/api" so the Vite dev proxy
 * forwards calls to http://localhost:8000).
 * --------------------------------------------------------------------- */

export const TOKEN_KEY = 'vtk:auth:token'

export function getToken() {
  try { return window.localStorage.getItem(TOKEN_KEY) } catch { return null }
}
export function setToken(token) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch { /* ignore */ }
}

const baseURL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '')

export const api = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use(config => {
  const token = getToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let onUnauthorized = null
/** Allow the AuthProvider to react to 401s (clear local state + redirect). */
export function setUnauthorizedHandler(fn) { onUnauthorized = fn }

api.interceptors.response.use(
  res => res,
  err => {
    if (err?.response?.status === 401) {
      setToken(null)
      if (typeof onUnauthorized === 'function') {
        try { onUnauthorized() } catch { /* ignore */ }
      } else if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(err)
  },
)

/**
 * Extract a human-friendly message from a Laravel/axios error.
 * Handles 422 validation bags, plain {message}, {reason}, and network errors.
 */
export function errorMessage(err, fallback = 'Đã có lỗi xảy ra') {
  if (!err) return fallback
  const r = err.response
  if (!r) return err.message || fallback
  const d = r.data
  if (!d) return fallback
  if (typeof d === 'string') return d
  if (d.reason) return d.reason
  if (d.message && r.status === 422 && d.errors) {
    const first = Object.values(d.errors)[0]
    if (Array.isArray(first) && first[0]) return first[0]
  }
  if (d.message) return d.message
  return fallback
}

/** Storage URL helper for files served by Laravel's local disk. */
export function storageUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const apiBase = baseURL.replace(/\/api$/i, '')
  const origin = apiBase || ''
  return `${origin}/storage/${path.replace(/^\/+/, '')}`
}
