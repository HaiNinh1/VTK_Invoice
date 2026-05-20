import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import { api, errorMessage } from '@/services/api'
import { useRole } from '@/context/RoleContext'

/* -----------------------------------------------------------------------
 * NotificationsContext — server-backed.
 *
 * Reads /api/notifications (server already enriches each item with
 * id, kind, category, title, description, date, read, to). Settings
 * come from /api/notification-settings.
 *
 * Public API preserved:
 *   { notifications, unreadCount, markRead, markAllRead,
 *     settings, updateSettings, pushNotification }
 *
 * `pushNotification` becomes a client-only ephemeral toast-like add
 * (no backend create endpoint exists). Used by pages to surface
 * cross-cutting events alongside server notifications.
 * --------------------------------------------------------------------- */

export const NOTIFICATION_KINDS = [
  'pendingApproval', 'approved', 'rejected', 'returned',
  'exportSuccess', 'exportError', 'legalDueSoon', 'commitmentOverdue', 'system',
]

export const KIND_TO_CATEGORY = {
  pendingApproval: 'approval',
  approved: 'approval',
  rejected: 'approval',
  returned: 'approval',
  legalDueSoon: 'legal',
  commitmentOverdue: 'legal',
  exportSuccess: 'system',
  exportError: 'system',
  system: 'system',
}

const DEFAULT_SETTINGS = {
  pendingApproval: true, approved: true, rejected: true, returned: true,
  exportSuccess: true, exportError: true, legalDueSoon: true,
  commitmentOverdue: true, system: false,
}

const NotificationsContext = createContext(null)

export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useRole()
  const [serverItems, setServerItems] = useState([])
  const [serverUnread, setServerUnread] = useState(0)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [extras, setExtras] = useState([])
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    if (!isAuthenticated) { setServerItems([]); setServerUnread(0); return }
    try {
      const res = await api.get('/notifications')
      setServerItems(Array.isArray(res.data?.data) ? res.data.data : [])
      setServerUnread(Number(res.data?.unreadCount ?? 0))
    } catch (err) { setError(errorMessage(err)) }
  }, [isAuthenticated])

  const reloadSettings = useCallback(async () => {
    if (!isAuthenticated) { setSettings(DEFAULT_SETTINGS); return }
    try {
      const res = await api.get('/notification-settings')
      setSettings({ ...DEFAULT_SETTINGS, ...(res.data?.data ?? {}) })
    } catch { /* ignore */ }
  }, [isAuthenticated])

  useEffect(() => { reload(); reloadSettings() }, [reload, reloadSettings])

  // Poll every 60s for freshness; cheap and good enough without websockets.
  useEffect(() => {
    if (!isAuthenticated) return
    const t = setInterval(() => { reload() }, 60_000)
    return () => clearInterval(t)
  }, [isAuthenticated, reload])

  const notifications = useMemo(() => {
    const merged = [
      ...extras.map(e => ({ ...e, read: false, category: KIND_TO_CATEGORY[e.kind] ?? 'system' })),
      ...serverItems.map(n => ({ ...n, category: n.category ?? KIND_TO_CATEGORY[n.kind] ?? 'system' })),
    ]
    return merged
      .filter(n => settings[n.kind] !== false)
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  }, [serverItems, extras, settings])

  const unreadCount = notifications.filter(n => !n.read).length || serverUnread

  const markRead = useCallback(async (id) => {
    // Optimistic
    setServerItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setExtras(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    try { await api.post(`/notifications/${id}/read`) }
    catch { /* server may not know synthetic id; ignore */ }
  }, [])

  const markAllRead = useCallback(async () => {
    setServerItems(prev => prev.map(n => ({ ...n, read: true })))
    setServerUnread(0)
    try { await api.post('/notifications/read-all') } catch { /* ignore */ }
  }, [])

  const updateSettings = useCallback(async (patch) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    try {
      const res = await api.patch('/notification-settings', patch)
      if (res.data?.data) setSettings({ ...DEFAULT_SETTINGS, ...res.data.data })
    } catch { /* revert silently on next reload */ }
  }, [settings])

  const pushNotification = useCallback((evt) => {
    setExtras(prev => [{
      id: evt.id ?? `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind: evt.kind ?? 'system',
      title: evt.title ?? '',
      description: evt.description ?? '',
      date: evt.date ?? new Date().toISOString().slice(0, 10),
      to: evt.to ?? '#',
    }, ...prev])
    // Refresh from server soon — most pushed events also create a real
    // server-side notification.
    setTimeout(() => reload(), 800)
  }, [reload])

  const value = useMemo(
    () => ({ notifications, unreadCount, markRead, markAllRead, settings, updateSettings, pushNotification, reload, error }),
    [notifications, unreadCount, markRead, markAllRead, settings, updateSettings, pushNotification, reload, error],
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationsProvider>')
  return ctx
}
