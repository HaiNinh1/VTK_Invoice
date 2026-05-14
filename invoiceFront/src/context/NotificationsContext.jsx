import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import { useRole } from '@/context/RoleContext'
import { useRequests } from '@/context/RequestsContext'

/* -----------------------------------------------------------------------
 * NotificationsContext — Prompt 18.
 *
 * Settings (9 keys, persisted):
 *   pendingApproval  — ĐN chờ duyệt (kế toán/admin)
 *   approved         — ĐN của tôi được duyệt
 *   rejected         — ĐN của tôi bị từ chối
 *   returned         — ĐN của tôi bị trả lại bổ sung
 *   exportSuccess    — Hoá đơn phát hành thành công
 *   exportError      — Hoá đơn phát hành lỗi (cần thử lại)
 *   legalDueSoon     — Hồ sơ pháp lý sắp đến hạn cam kết (≤ 3 ngày)
 *   commitmentOverdue — Cam kết quá hạn chưa bổ sung
 *   system           — Tin nội bộ / cập nhật phần mềm (DEFAULT OFF)
 *
 * Kind → Category (cho ThongBao tabs):
 *   approval  : pendingApproval, approved, rejected, returned
 *   legal     : legalDueSoon, commitmentOverdue
 *   system    : exportSuccess, exportError, system
 * --------------------------------------------------------------------- */

const READ_KEY     = 'vtk:notifications:read:v1'
const SETTINGS_KEY = 'vtk:notifications:settings:v2'

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
  pendingApproval:   true,
  approved:          true,
  rejected:          true,
  returned:          true,
  exportSuccess:     true,
  exportError:       true,
  legalDueSoon:      true,
  commitmentOverdue: true,
  system:            false, // DEFAULT OFF per spec
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

/** Synthetic system notifications — small fixed list. */
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

function today() {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(aISO, bISO) {
  if (!aISO || !bISO) return 0
  const a = new Date(aISO).getTime()
  const b = new Date(bISO).getTime()
  return Math.round((a - b) / (1000 * 60 * 60 * 24))
}

function buildAll(role, userId, INV) {
  const items = []
  const now = today()

  // pendingApproval — kế toán/admin
  if (role === 'accountant' || role === 'admin') {
    INV.filter(r => r.status === 'Chờ duyệt').forEach(r => items.push({
      id: `pending-${r.id}`, kind: 'pendingApproval',
      title: `Đề nghị chờ duyệt: ${r.id}`, description: r.customerName,
      date: r.createdDate, to: `/phe-duyet/${r.id}`,
    }))
  }

  // approved / rejected / returned — creator
  INV.filter(r => r.createdById === userId).forEach(r => {
    if (r.status === 'Đã duyệt' || r.status === 'Đã xuất HĐ') {
      items.push({
        id: `approved-${r.id}`, kind: 'approved',
        title: `Đã duyệt: ${r.id}`, description: r.customerName,
        date: r.approvedDate, to: `/de-nghi/${r.id}`,
      })
    }
    if (r.status === 'Từ chối') {
      items.push({
        id: `rejected-${r.id}`, kind: 'rejected',
        title: `Từ chối: ${r.id}`, description: r.rejectReason || r.customerName,
        date: r.approvedDate || r.createdDate, to: `/de-nghi/${r.id}`,
      })
    }
    if (r.status === 'Trả lại bổ sung') {
      items.push({
        id: `returned-${r.id}`, kind: 'returned',
        title: `Trả lại bổ sung: ${r.id}`, description: r.returnReason || r.customerName,
        date: r.approvedDate || r.createdDate, to: `/de-nghi/${r.id}`,
      })
    }
  })

  // exportSuccess / exportError — kế toán/admin, tất cả requests đã xuất
  if (role === 'accountant' || role === 'admin') {
    INV.filter(r => r.status === 'Đã xuất HĐ').forEach(r => {
      if (r.sInvoiceStatus === 'Lỗi') {
        items.push({
          id: `export-error-${r.id}`, kind: 'exportError',
          title: `Phát hành HĐ lỗi: ${r.id}`,
          description: r.sInvoiceError || 'Lỗi không xác định',
          date: r.exportedAt || r.approvedDate, to: '/s-invoice',
        })
      } else if (r.sInvoiceNumber) {
        items.push({
          id: `export-ok-${r.id}`, kind: 'exportSuccess',
          title: `Đã phát hành: ${r.sInvoiceNumber}`,
          description: r.customerName,
          date: r.exportedAt || r.approvedDate, to: '/s-invoice',
        })
      }
    })
  }

  // commitmentOverdue & legalDueSoon — creator có cam kết
  INV.filter(r => r.hasCommitment && r.createdById === userId && r.commitmentDeadline).forEach(r => {
    const diff = daysBetween(r.commitmentDeadline, now) // > 0 còn ngày, < 0 quá hạn
    if (diff < 0) {
      items.push({
        id: `commit-overdue-${r.id}`, kind: 'commitmentOverdue',
        title: `Cam kết quá hạn: ${r.id}`,
        description: `Hạn ${r.commitmentDeadline} (quá ${-diff} ngày)`,
        date: r.commitmentDeadline, to: `/de-nghi/${r.id}`,
      })
    } else if (diff <= 3) {
      items.push({
        id: `legal-due-${r.id}`, kind: 'legalDueSoon',
        title: `Cam kết sắp đến hạn: ${r.id}`,
        description: `Còn ${diff} ngày — hạn ${r.commitmentDeadline}`,
        date: r.commitmentDeadline, to: `/de-nghi/${r.id}`,
      })
    }
  })

  // System events
  SYSTEM_EVENTS.filter(s => s.roles.includes(role)).forEach(s => items.push(s))
  return items.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
}

export function NotificationsProvider({ children }) {
  const { role, user } = useRole()
  const userId = user?.id
  const { requests } = useRequests()
  const [readIds, setReadIds] = useState(() => loadSet(READ_KEY))
  const [settings, setSettings] = useState(loadSettings)
  const [extras, setExtras] = useState([])
  useEffect(() => persistSet(READ_KEY, readIds), [readIds])
  useEffect(() => {
    if (typeof window === 'undefined') return
    try { window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch { /* ignore */ }
  }, [settings])

  const all = useMemo(
    () => [...buildAll(role, userId, requests), ...extras].sort(
      (a, b) => (b.date ?? '').localeCompare(a.date ?? ''),
    ),
    [role, userId, requests, extras],
  )

  // Apply user settings filter
  const notifications = useMemo(
    () => all
      .filter(n => settings[n.kind] !== false)
      .map(n => ({ ...n, read: readIds.has(n.id), category: KIND_TO_CATEGORY[n.kind] ?? 'system' })),
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

  const pushNotification = useCallback((evt) => {
    setExtras(prev => [{
      id: evt.id ?? `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind: evt.kind ?? 'system',
      title: evt.title ?? '', description: evt.description ?? '',
      date: evt.date ?? new Date().toISOString().slice(0, 10),
      to: evt.to ?? '#',
    }, ...prev])
  }, [])

  const value = useMemo(
    () => ({ notifications, unreadCount, markRead, markAllRead, settings, updateSettings, pushNotification }),
    [notifications, unreadCount, markRead, markAllRead, settings, updateSettings, pushNotification],
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
