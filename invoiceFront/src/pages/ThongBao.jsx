import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Bell, CheckCheck, Search, AlertTriangle, FilePlus, CheckCircle2, Info, Clock,
  XCircle, RotateCcw, FileCheck2, FileX2, AlarmClock, Mail,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useNotifications } from '@/context/NotificationsContext'
import { formatDate } from '@/components/shared/formatters'
import { cn } from '@/lib/utils'

/* -----------------------------------------------------------------------
 * Trang Thông báo — Prompt 18 (Notification Center).
 *
 * 4 tabs theo category: Tất cả / Phê duyệt / Pháp lý / Hệ thống
 * - Mark all read
 * - Per-item: nút Đánh dấu đã đọc + click điều hướng tự đánh dấu
 * - Pagination "Xem thêm" 20/page
 * --------------------------------------------------------------------- */

const KIND_META = {
  pendingApproval:   { label: 'Chờ duyệt',          Icon: FilePlus,      tone: 'bg-blue-100 text-blue-700' },
  approved:          { label: 'Đã duyệt',           Icon: CheckCircle2,  tone: 'bg-green-100 text-green-700' },
  rejected:          { label: 'Từ chối',            Icon: XCircle,       tone: 'bg-red-100 text-red-700' },
  returned:          { label: 'Trả lại',            Icon: RotateCcw,     tone: 'bg-amber-100 text-amber-700' },
  exportSuccess:     { label: 'Xuất HĐ OK',         Icon: FileCheck2,    tone: 'bg-emerald-100 text-emerald-700' },
  exportError:       { label: 'Xuất HĐ lỗi',        Icon: FileX2,        tone: 'bg-red-100 text-red-700' },
  legalDueSoon:      { label: 'Sắp đến hạn',        Icon: AlarmClock,    tone: 'bg-amber-100 text-amber-700' },
  commitmentOverdue: { label: 'Cam kết quá hạn',    Icon: AlertTriangle, tone: 'bg-red-100 text-red-700' },
  system:            { label: 'Hệ thống',           Icon: Info,          tone: 'bg-slate-100 text-slate-700' },
}

const CATEGORY_TABS = [
  { value: 'all',      label: 'Tất cả' },
  { value: 'approval', label: 'Phê duyệt' },
  { value: 'legal',    label: 'Pháp lý' },
  { value: 'system',   label: 'Hệ thống' },
]

const PAGE_SIZE = 20

export default function ThongBao() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(PAGE_SIZE)

  // Reset pagination khi đổi tab / query
  useEffect(() => { setVisible(PAGE_SIZE) }, [tab, query])

  const categoryCounts = useMemo(() => {
    const counts = { all: notifications.length, approval: 0, legal: 0, system: 0 }
    notifications.forEach(n => { counts[n.category] = (counts[n.category] ?? 0) + 1 })
    return counts
  }, [notifications])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return notifications.filter(n => {
      if (tab !== 'all' && n.category !== tab) return false
      if (q) {
        const hay = `${n.title} ${n.description ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [notifications, tab, query])

  const paged = filtered.slice(0, visible)
  const hasMore = filtered.length > visible

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild aria-label="Quay lại">
            <Link to="/"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-semibold page-title">Thông báo</h1>
          {unreadCount > 0 && (
            <Badge variant="muted">{unreadCount} chưa đọc</Badge>
          )}
        </div>
        <Button
          variant="outline"
          disabled={unreadCount === 0}
          onClick={markAllRead}
        >
          <CheckCheck className="h-4 w-4" /> Đánh dấu tất cả đã đọc
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          {CATEGORY_TABS.map(t => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label} ({categoryCounts[t.value] ?? 0})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} forceMount={false}>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Tìm theo nội dung..."
              aria-label="Tìm thông báo"
              className="pl-9"
            />
          </div>

          <Card className="mt-4 overflow-hidden">
            <CardContent className="p-0">
              {paged.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
                  <Clock className="h-6 w-6 text-muted-foreground" aria-hidden />
                  <p className="text-sm text-muted-foreground">
                    Không có thông báo phù hợp.
                  </p>
                </div>
              ) : (
                <ul className="divide-y">
                  {paged.map(n => {
                    const meta = KIND_META[n.kind] ?? KIND_META.system
                    const Icon = meta.Icon
                    return (
                      <li key={n.id} className={cn('flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/40', !n.read && 'bg-primary/[0.03]')}>
                        <span className={cn(
                          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                          meta.tone,
                        )} aria-hidden>
                          <Icon className="h-4 w-4" />
                        </span>
                        <Link
                          to={n.to ?? '#'}
                          onClick={() => markRead(n.id)}
                          className="min-w-0 flex-1"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn('truncate text-sm', !n.read ? 'font-semibold' : 'font-medium')}>
                              {n.title}
                            </span>
                            <Badge variant="muted" className="text-[10px]">{meta.label}</Badge>
                            {!n.read && (
                              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />
                            )}
                          </div>
                          {n.description && (
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {n.description}
                            </div>
                          )}
                          {n.date && (
                            <div className="mt-0.5 text-[11px] text-muted-foreground">
                              {formatDate(n.date)}
                            </div>
                          )}
                        </Link>
                        {!n.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="shrink-0 text-xs"
                            onClick={() => markRead(n.id)}
                            aria-label="Đánh dấu đã đọc"
                          >
                            <CheckCheck className="h-3.5 w-3.5" /> Đã đọc
                          </Button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {hasMore && (
            <div className="mt-3 flex justify-center">
              <Button variant="outline" onClick={() => setVisible(v => v + PAGE_SIZE)}>
                Xem thêm ({filtered.length - visible} còn lại)
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* Suppress unused import lint */
void Bell; void Mail
