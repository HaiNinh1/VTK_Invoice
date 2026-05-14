import { NavLink } from 'react-router-dom'
import {
  ClipboardList, FileText, FilePlus, ShieldCheck,
  CheckSquare, Monitor, Settings,
} from 'lucide-react'
import { NAV_ITEMS, ROLE_LABELS } from '@/data/masterData'
import { useRole } from '@/context/RoleContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { initials } from '@/components/shared/formatters'
import { cn } from '@/lib/utils'

// Icon name → component map (data file stays framework-free)
const ICON = {
  ClipboardList, FileText, FilePlus, ShieldCheck,
  CheckSquare, Monitor, Settings,
}

const ROLE_BADGE = {
  employee:   'bg-blue-100   text-blue-800',
  manager:    'bg-purple-100 text-purple-800',
  accountant: 'bg-amber-100  text-amber-800',
  admin:      'bg-red-100    text-red-800',
}

export function Sidebar() {
  const { role, user } = useRole()
  const items = NAV_ITEMS.filter(i => i.roles.includes(role))

  return (
    <aside
      aria-label="Điều hướng chính"
      className="hidden md:flex w-60 shrink-0 flex-col border-r bg-card"
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-5 border-b">
        <span className="text-xl font-bold text-primary tracking-tight">VTK</span>
        <span className="text-sm font-medium text-muted-foreground">Hoá đơn</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {items.map(item => {
            const Icon = ICON[item.icon] ?? FileText
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      'border-l-[3px] border-transparent',
                      isActive
                        ? 'bg-[hsl(var(--brand-tint))] border-primary text-primary'
                        : 'text-foreground/80 hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium leading-tight">{user.name}</div>
            <span
              className={cn(
                'mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium',
                ROLE_BADGE[role],
              )}
            >
              {ROLE_LABELS[role]}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
