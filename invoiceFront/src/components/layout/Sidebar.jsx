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

const ICON = {
  ClipboardList, FileText, FilePlus, ShieldCheck,
  CheckSquare, Monitor, Settings,
}

const ROLE_DOT = {
  employee:   'bg-sky-400',
  manager:    'bg-violet-400',
  accountant: 'bg-emerald-400',
  admin:      'bg-rose-400',
}

export function Sidebar() {
  const { role, user } = useRole()
  const items = NAV_ITEMS.filter(i => i.roles.includes(role))

  return (
    <aside
      aria-label="Điều hướng chính"
      className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar-mesh text-[hsl(var(--sidebar-fg))]"
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-base tracking-tight shadow-sm">
          V
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold text-white tracking-tight font-display">VTK Invoice</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--sidebar-fg-muted))]">
            Viettel Telecom
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-6 mb-3 text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--sidebar-fg-muted))] font-semibold">
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
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150',
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-bg-elev))] hover:text-white',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          'h-[18px] w-[18px] transition-colors shrink-0',
                          isActive ? 'text-white' : 'text-[hsl(var(--sidebar-fg-muted))] group-hover:text-white',
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
        <div className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-[hsl(var(--sidebar-bg-elev))] transition-colors">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
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
        </div>
      </div>
    </aside>
  )
}
