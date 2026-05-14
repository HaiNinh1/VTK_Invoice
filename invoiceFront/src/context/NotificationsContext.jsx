import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import { INVOICE_REQUESTS } from '@/data/masterData'
import { useRole } from '@/context/RoleContext'

/* -----------------------------------------------------------------------
 * NotificationsContext — central notification store (Prompt 18).
 *
 * Derives notifications from INVOICE_REQUESTS for the current user/role,
 * plus a few synthetic system events. Persists per-user "read" set + user
 * settings (which notification types are enabled) in localStorage.
 *
 * Public API:
 *   const {
 *     notifications,      // derived list (filtered by role, sorted)
 *     unreadCount,
 *     markRead(id),
 *     markAllRead(),
 *     settings,           // { pendingApproval, commitment, approved, system }
 *     updateSettings(patch),
 *   } = useNotifications()
 * --------------------------------------------------------------------- */

const READ_KEY     = 'vtk:notifications:read:v1'
const SETTINGS_KEY = 'vtk:notifications:settings:v1'

const DEFAULT_SETTINGS = {
  pendingApproval: true, // ĐN chờ duyệt (kế toán/admin)
  commitment:      true, // cam kết bổ sung sắp đến hạn
  approved:        true, // ĐN của tôi đã duyệt
  system:          true, // tin nội bộ
}

const NotificationsContext = createContext(null)

function loadSet(key) {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return new Set(Array.isArray(arr) ? arr : [])
  } catch { return new Set() }
}
function persistSet(key, set) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(key, JSON.stringify([...set])) } catch { /* ignore */ }
}
function loadSettings() {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch { return DEFAULT_SETTINGS }
}

/** Synthetic system notifications — small, fixed list. */
const SYSTEM_EVENTS = [
  {
    id: 'sys-2026-001',
    kind: 'system',
    title: 'Cập nhật hệ thống VTK Hoá đơn v2.4',
    description: 'Bổ sung tính năng quản lý loại HĐ + hồ sơ pháp lý tập trung.',
    date: '2026-03-12',
    to: '/cai-dat',
    roles: ['employee', 'manager', 'accountant', 'admin'],
  },
  {
    id: 'sys-2026-002',
    kind: 'system',
    title: 'Nhắc: hạn báo cáo VAT Q1/2026',
    description: 'Hạn nộp tờ khai thuế GTGT Q1: 30/04/2026.',
    date: '2026-03-20',
    to: '/s-invoice',
    roles: ['accountant', 'admin'],
  },
]

function buildAll(role, userId) {
  const items = []

  // ĐN chờ duyệt — kế toán/admin
  if (role === 'accountant' || role === 'admin') {
    INVOICE_REQUESTS
      .filter(r => r.status === 'Chờ duyệt')
      .forEach(r => items.push({
        id: `pending-${r.id}`,
        kind: 'pendingApproval',
        title: `Đề nghị chờ duyệt: ${r.id}`,
        description: r.customerName,
        date: r.createdDate,
        to: `/phe-duyet/${r.id}`,
      }))
  }

  // Cam kết sắp đến hạn — của tôi
  INVOICE_REQUESTS
    .filter(r => r.hasCommitment && r.createdById === userId)
    .forEach(r => items.push({
      id: `commit-${r.id}`,
      kind: 'commitment',
      title: `Cam kết bổ sung: ${r.id}`,
      description: `Hạn ${r.commitmentDeadline}`,
      date: r.commitmentDeadline,
      to: `/de-nghi/${r.id}`,
    }))

  // ĐN của tôi đã duyệt — nhân viên/quản lý
  if (role === 'employee' || role === 'manager') {
    INVOICE_REQUESTS
      .filter(r => r.createdById === userId && r.status === 'Đã duyệt')
      .forEach(r => items.push({
        id: `approved-${r.id}`,
        kind: 'approved',
        title: `Đã duyệt: ${r.id}`,
        description: r.customerName,
        date: r.approvedDate,
        to: `/de-nghi/${r.id}`,
      }))
  }

  // Hệ thống
  SYSTEM_EVENTS
    .filter(s => s.roles.includes(role))
    .forEach(s => items.push(s))

  return items.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
}

export function NotificationsProvider({ children }) {
  const { role, user } = useRole()
  const userId = user?.id
  const [readIds, setReadIds] = useState(() => loadSet(READ_KEY))
  const [settings, setSettings] = useState(loadSettings)

  useEffect(() => persistSet(READ_KEY, readIds), [readIds])
  useEffect(() => {
    if (typeof window === 'undefined') return
    try { window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch { /* ignore */ }
  }, [settings])

  const all = useMemo(() => buildAll(role, userId), [role, userId])

  // Apply user settings filter
  const notifications = useMemo(
    () => all
      .filter(n => settings[n.kind] !== false)
      .map(n => ({ ...n, read: readIds.has(n.id) })),
    [all, settings, readIds],
  )

  const unreadCount = notifications.filter(n => !n.read).length

  const markRead = useCallback((id) => {
    setReadIds(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev); next.add(id); return next
    })
  }, [])

  const markAllRead = useCallback(() => {
    setReadIds(prev => {
      const next = new Set(prev)
      notifications.forEach(n => next.add(n.id))
      return next
    })
  }, [notifications])

  const updateSettings = useCallback((patch) => {
    setSettings(prev => ({ ...prev, ...patch }))
  }, [])

  const value = useMemo(
    () => ({ notifications, unreadCount, markRead, markAllRead, settings, updateSettings }),
    [notifications, unreadCount, markRead, markAllRead, settings, updateSettings],
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
