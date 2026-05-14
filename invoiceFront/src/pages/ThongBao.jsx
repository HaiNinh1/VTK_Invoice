import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Bell, CheckCheck, Search, AlertTriangle, FilePlus, CheckCircle2, Info, Clock,
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
 * Trang Thông báo — Prompt 18 (Notification Center, full page).
 *
 * - Tabs: Tất cả / Chưa đọc / Theo loại
 * - Search keyword
 * - Mark all read
 * - Mỗi item click → điều hướng + tự đánh dấu đã đọc
 * --------------------------------------------------------------------- */

const KIND_META = {
  pendingApproval: { label: 'Chờ duyệt',     Icon: FilePlus,       tone: 'bg-blue-100 text-blue-700' },
  commitment:      { label: 'Cam kết',       Icon: AlertTriangle,  tone: 'bg-amber-100 text-amber-700' },
  approved:        { label: 'Đã duyệt',      Icon: CheckCircle2,   tone: 'bg-green-100 text-green-700' },
  system:          { label: 'Hệ thống',      Icon: Info,           tone: 'bg-slate-100 text-slate-700' },
}

export default function ThongBao() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [tab, setTab] = useState('tat-ca')
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return notifications.filter(n => {
      if (tab === 'chua-doc' && n.read) return false
      if (kind !== 'all' && n.kind !== kind) return false
      if (q) {
        const hay = `${n.title} ${n.description ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [notifications, tab, query, kind])

  const kindCounts = useMemo(() => {
    const counts = { pendingApproval: 0, commitment: 0, approved: 0, system: 0 }
    notifications.forEach(n => { if (counts[n.kind] != null) counts[n.kind] += 1 })
    return counts
  }, [notifications])

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
          <TabsTrigger value="tat-ca">Tất cả ({notifications.length})</TabsTrigger>
          <TabsTrigger value="chua-doc">Chưa đọc ({unreadCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} forceMount={false}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
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
            <div className="flex flex-wrap gap-1.5">
              <FilterChip active={kind === 'all'} onClick={() => setKind('all')}>
                Tất cả loại
              </FilterChip>
              {Object.entries(KIND_META).map(([k, m]) => (
                <FilterChip key={k} active={kind === k} onClick={() => setKind(k)}>
                  {m.label} ({kindCounts[k] ?? 0})
                </FilterChip>
              ))}
            </div>
          </div>

          <Card className="mt-4 overflow-hidden">
            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
                  <Clock className="h-6 w-6 text-muted-foreground" aria-hidden />
                  <p className="text-sm text-muted-foreground">
                    Không có thông báo phù hợp.
                  </p>
                </div>
              ) : (
                <ul className="divide-y">
                  {filtered.map(n => {
                    const meta = KIND_META[n.kind] ?? KIND_META.system
                    const Icon = meta.Icon
                    return (
                      <li key={n.id}>
                        <Link
                          to={n.to ?? '#'}
                          onClick={() => markRead(n.id)}
                          className={cn(
                            'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/40',
                            !n.read && 'bg-primary/[0.03]',
                          )}
                        >
                          <span className={cn(
                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                            meta.tone,
                          )} aria-hidden>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
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
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground hover:bg-accent/40',
      )}
    >
      {children}
    </button>
  )
}

/* Suppress unused import lint */
void Bell
