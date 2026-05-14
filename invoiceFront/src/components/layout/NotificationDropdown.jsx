import { Link } from 'react-router-dom'
import {
  Bell, CheckCheck, AlertTriangle, FilePlus, CheckCircle2, Info, Clock,
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/components/shared/formatters'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/context/NotificationsContext'

/* -----------------------------------------------------------------------
 * NotificationDropdown — bell icon + popup list (Prompt 18).
 * Data source: NotificationsContext (single source of truth).
 * --------------------------------------------------------------------- */

const KIND_ICON = {
  pendingApproval: { Icon: FilePlus,      tone: 'bg-blue-100 text-blue-700' },
  commitment:      { Icon: AlertTriangle, tone: 'bg-amber-100 text-amber-700' },
  approved:        { Icon: CheckCircle2,  tone: 'bg-green-100 text-green-700' },
  system:          { Icon: Info,          tone: 'bg-slate-100 text-slate-700' },
}

export function NotificationDropdown() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const items = notifications.slice(0, 6)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Thông báo${unreadCount ? ` (${unreadCount} mới)` : ''}`}
          className="relative h-10 w-10"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              aria-hidden
              className="absolute right-1.5 top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
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
            {unreadCount > 0 && (
              <Badge variant="muted" className="text-[10px]">{unreadCount} mới</Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={unreadCount === 0}
            onClick={markAllRead}
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
                const meta = KIND_ICON[n.kind] ?? KIND_ICON.system
                const Icon = meta.Icon
                return (
                  <li key={n.id}>
                    <Link
                      to={n.to ?? '#'}
                      onClick={() => markRead(n.id)}
                      className={cn(
                        'flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-accent/40',
                        !n.read && 'bg-primary/[0.03]',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                          meta.tone,
                        )}
                        aria-hidden
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn('truncate text-sm', !n.read ? 'font-semibold' : 'font-medium')}>
                            {n.title}
                          </span>
                          {!n.read && (
                            <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        {n.description && (
                          <div className="truncate text-xs text-muted-foreground">
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
        </div>

        <div className="border-t px-3 py-2 text-right">
          <Button asChild variant="link" className="h-auto p-0 text-xs">
            <Link to="/thong-bao">Xem tất cả thông báo →</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
