import { Outlet, NavLink, Navigate, useLocation } from 'react-router-dom'
import {
  ClipboardList, FileText, FilePlus, CheckSquare, Monitor,
} from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '@/lib/utils'
import { useRole } from '@/context/RoleContext'

const MOBILE_TABS = [
  { to: '/',          label: 'Việc',     icon: ClipboardList, roles: ['employee','manager','accountant','admin'] },
  { to: '/hop-dong',  label: 'HĐ',       icon: FileText, roles: ['employee','manager','accountant','admin'] },
  { to: '/de-nghi',   label: 'Đề nghị',  icon: FilePlus, roles: ['employee','manager','accountant','admin'] },
  { to: '/phe-duyet', label: 'Duyệt',    icon: CheckSquare, roles: ['accountant','admin'] },
  { to: '/s-invoice', label: 'S-Inv',    icon: Monitor, roles: ['accountant','admin'] },
]

export function AppShell() {
  const { role, isAuthenticated, isHydrating } = useRole()
  const location = useLocation()
  if (isHydrating) return null
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  const visibleTabs = MOBILE_TABS.filter(t => t.roles.includes(role))
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
          className={cn('fixed inset-x-0 bottom-0 z-30 grid border-t border-border bg-card/95 backdrop-blur md:hidden', visibleTabs.length === 3 ? 'grid-cols-3' : visibleTabs.length === 4 ? 'grid-cols-4' : 'grid-cols-5')}
        >
          {visibleTabs.map(({ to, label, icon: Icon }) => (
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
