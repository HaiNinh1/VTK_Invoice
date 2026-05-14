import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell, CheckCheck, AlertTriangle, FilePlus, CheckCircle2, Clock,
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/components/shared/formatters'
import { cn } from '@/lib/utils'
import { useRole } from '@/context/RoleContext'
import { INVOICE_REQUESTS } from '@/data/masterData'

/* Mock notifications derived from current data — keeps the UI honest
 * (showing data the user can actually find on real pages). */
function buildNotifications(role, user) {
  const items = []

  if (role === 'accountant' || role === 'admin') {
    INVOICE_REQUESTS
      .filter(r => r.status === 'Chờ duyệt')
      .slice(0, 4)
      .forEach(r => items.push({
        id: `pending-${r.id}`,
        icon: FilePlus,
        tone: 'info',
        title: `Đề nghị chờ duyệt: ${r.id}`,
        description: `${r.customerName}`,
        date: r.createdDate,
        to: `/phe-duyet/${r.id}`,
      }))
  }

  // Commitments approaching deadline (mine only)
  INVOICE_REQUESTS
    .filter(r => r.hasCommitment && r.createdById === user.id)
    .slice(0, 3)
    .forEach(r => items.push({
      id: `commit-${r.id}`,
      icon: AlertTriangle,
      tone: 'warning',
      title: `Cam kết: ${r.id}`,
      description: `Hạn ${formatDate(r.commitmentDeadline)}`,
      date: r.commitmentDeadline,
      to: `/de-nghi/${r.id}`,
    }))

  // Recently approved (employee view)
  if (role === 'employee' || role === 'manager') {
    INVOICE_REQUESTS
      .filter(r => r.createdById === user.id && r.status === 'Đã duyệt')
      .slice(0, 3)
      .forEach(r => items.push({
        id: `approved-${r.id}`,
        icon: CheckCircle2,
        tone: 'success',
        title: `Đã duyệt: ${r.id}`,
        description: `${r.customerName}`,
        date: r.approvedDate,
        to: `/de-nghi/${r.id}`,
      }))
  }

  return items
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, 6)
}

const TONE_RING = {
  info:    'bg-blue-100 text-blue-700',
  warning: 'bg-amber-100 text-amber-700',
  success: 'bg-green-100 text-green-700',
}

export function NotificationDropdown() {
  const { role, user } = useRole()
  const [readIds, setReadIds] = useState(new Set())
  const items = buildNotifications(role, user)
  const unread = items.filter(i => !readIds.has(i.id)).length

  function markAll() {
    setReadIds(new Set(items.map(i => i.id)))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Thông báo${unread ? ` (${unread} mới)` : ''}`}
          className="relative h-10 w-10"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span
              aria-hidden
              className="absolute right-1.5 top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[22rem] max-w-[calc(100vw-1.5rem)] p-0"
      >
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Thông báo</span>
            {unread > 0 && (
              <Badge variant="muted" className="text-[10px]">{unread} mới</Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={unread === 0}
            onClick={markAll}
            className="h-7 px-2 text-xs"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Đánh dấu đã đọc
          </Button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Clock className="h-6 w-6 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Chưa có thông báo nào.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map(n => {
                const isRead = readIds.has(n.id)
                const Icon = n.icon
                return (
                  <li key={n.id}>
                    <Link
                      to={n.to}
                      onClick={() => setReadIds(s => new Set(s).add(n.id))}
                      className={cn(
                        'flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-accent/40',
                        !isRead && 'bg-primary/[0.03]',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                          TONE_RING[n.tone] || TONE_RING.info,
                        )}
                        aria-hidden
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'truncate text-sm',
                            !isRead ? 'font-semibold' : 'font-medium',
                          )}>
                            {n.title}
                          </span>
                          {!isRead && (
                            <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {n.description}
                        </div>
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
        </div>

        <div className="border-t px-3 py-2 text-right">
          <Button asChild variant="link" className="h-auto p-0 text-xs">
            <Link to="/">Xem việc cần làm →</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
