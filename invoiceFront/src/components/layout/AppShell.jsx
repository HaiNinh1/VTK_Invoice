import { Outlet, NavLink } from 'react-router-dom'
import {
  ClipboardList, FileText, FilePlus, CheckSquare, Monitor,
} from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '@/lib/utils'

const MOBILE_TABS = [
  { to: '/',          label: 'Việc',     icon: ClipboardList },
  { to: '/hop-dong',  label: 'HĐ',       icon: FileText },
  { to: '/de-nghi',   label: 'Đề nghị',  icon: FilePlus },
  { to: '/phe-duyet', label: 'Duyệt',    icon: CheckSquare },
  { to: '/s-invoice', label: 'S-Inv',    icon: Monitor },
]

export function AppShell() {
  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 overflow-x-hidden pb-20 md:pb-0" role="main">
          <div className="w-full px-6 py-6 md:px-10 md:py-8 lg:px-12">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom tabs */}
        <nav
          aria-label="Điều hướng di động"
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card/95 backdrop-blur md:hidden"
        >
          {MOBILE_TABS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-b-full bg-primary" />
                  )}
                  <Icon className="h-5 w-5" aria-hidden />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
