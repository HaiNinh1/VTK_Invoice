import { Outlet, NavLink } from 'react-router-dom'
import {
  ClipboardList, FileText, FilePlus, CheckSquare, Monitor,
} from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '@/lib/utils'

// Mobile bottom-tab items — 5 most-used routes per spec (Prompt 11)
const MOBILE_TABS = [
  { to: '/',          label: 'Việc',     icon: ClipboardList },
  { to: '/hop-dong',  label: 'HĐ',       icon: FileText },
  { to: '/de-nghi',   label: 'Đề nghị',  icon: FilePlus },
  { to: '/phe-duyet', label: 'Duyệt',    icon: CheckSquare },
  { to: '/s-invoice', label: 'S-Inv',    icon: Monitor },
]

/**
 * AppShell — desktop: sidebar + header + main.
 *            mobile : header + main + bottom tab bar (per Prompt 11).
 * Spec keeps content max-width 1200px and pads 24px.
 */
export function AppShell() {
  return (
    <div className="flex h-full min-h-screen bg-muted/30">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 overflow-x-hidden pb-16 md:pb-0" role="main">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-5 md:px-6 md:py-6">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom tabs */}
        <nav
          aria-label="Điều hướng di động"
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card md:hidden"
        >
          {MOBILE_TABS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
