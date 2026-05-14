import { NavLink } from 'react-router-dom'
import {
  ClipboardList, FileText, FilePlus, ShieldCheck,
  CheckSquare, Monitor, Settings, Sparkles,
} from 'lucide-react'
import { NAV_ITEMS, ROLE_LABELS } from '@/data/masterData'
import { useRole } from '@/context/RoleContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { initials } from '@/components/shared/formatters'
import { cn } from '@/lib/utils'

const ICON = {
  ClipboardList, FileText, FilePlus, ShieldCheck,
  CheckSquare, Monitor, Settings,
}

const ROLE_DOT = {
  employee:   'bg-blue-400',
  manager:    'bg-purple-400',
  accountant: 'bg-amber-400',
  admin:      'bg-red-400',
}

export function Sidebar() {
  const { role, user } = useRole()
  const items = NAV_ITEMS.filter(i => i.roles.includes(role))

  return (
    <aside
      aria-label="Điều hướng chính"
      className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar-mesh text-[hsl(var(--sidebar-fg))] border-r border-[hsl(var(--sidebar-border))]"
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-[hsl(var(--sidebar-border))]">
        <div className="relative">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-base tracking-tight shadow-sm">
            V
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[hsl(var(--gold))] ring-2 ring-[hsl(var(--sidebar-bg))]" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white tracking-tight">VTK Hóa đơn</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--sidebar-fg-muted))]">
            Viettel Telecom
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-5 mb-2 text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--sidebar-fg-muted))]">
          Quản lý
        </div>
        <ul className="space-y-0.5 px-3">
          {items.map(item => {
            const Icon = ICON[item.icon] ?? FileText
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150',
                      isActive
                        ? 'bg-[hsl(var(--sidebar-bg-elev))] text-white'
                        : 'text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-bg-elev))] hover:text-white',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active red bar */}
                      <span
                        className={cn(
                          'absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full transition-all',
                          isActive ? 'bg-primary' : 'bg-transparent group-hover:bg-[hsl(var(--gold)/0.4)]',
                        )}
                      />
                      <Icon
                        className={cn(
                          'h-[18px] w-[18px] transition-colors',
                          isActive ? 'text-primary' : 'text-[hsl(var(--sidebar-fg-muted))] group-hover:text-[hsl(var(--gold))]',
                        )}
                        aria-hidden
                      />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-[hsl(var(--sidebar-border))] p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-[hsl(var(--sidebar-bg-elev))] transition-colors">
          <Avatar className="h-9 w-9 ring-1 ring-[hsl(var(--gold)/0.3)]">
            <AvatarFallback className="bg-[hsl(var(--sidebar-bg-elev))] text-[hsl(var(--gold))] font-semibold">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium leading-tight text-white">
              {user.name}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className={cn('h-1.5 w-1.5 rounded-full', ROLE_DOT[role])} />
              <span className="text-[11px] text-[hsl(var(--sidebar-fg-muted))]">
                {ROLE_LABELS[role]}
              </span>
            </div>
          </div>
          <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--gold)/0.5)]" aria-hidden />
        </div>
      </div>
    </aside>
  )
}
