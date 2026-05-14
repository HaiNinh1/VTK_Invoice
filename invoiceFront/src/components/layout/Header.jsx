import { useLocation, useNavigate } from 'react-router-dom'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { NotificationDropdown } from '@/components/layout/NotificationDropdown'
import { useRole } from '@/context/RoleContext'
import { initials } from '@/components/shared/formatters'
import { NAV_ITEMS, ROLE_LABELS } from '@/data/masterData'
import { useToast } from '@/components/ui/toast'
import { LogOut, User as UserIcon, Settings, ChevronRight } from 'lucide-react'

function usePageInfo() {
  const { pathname } = useLocation()
  const match = NAV_ITEMS.find(
    i => i.to === pathname || (i.to !== '/' && pathname.startsWith(i.to)),
  )
  return {
    title: match?.label ?? 'VTK Hóa đơn',
    crumb: match?.label ? 'Quản lý' : null,
  }
}

export function Header() {
  const { role, setRole, user } = useRole()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { title, crumb } = usePageInfo()

  function handleLogout() {
    toast.success('Đã đăng xuất (demo)')
    navigate('/login')
  }

  return (
    <header
      className="sticky top-0 z-20 flex h-16 items-center justify-between bg-card/90 backdrop-blur-md px-6 md:px-10 lg:px-12 border-b border-border"
      role="banner"
    >
      <div className="min-w-0">
        {crumb && (
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-0.5">
            <span>{crumb}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground/70">{title}</span>
          </div>
        )}
        <h1 className="text-[17px] font-semibold tracking-tight truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Role switcher */}
        <div className="hidden sm:block">
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger
              className="h-9 w-[160px] bg-muted/50 border-border text-[13px]"
              aria-label="Vai trò demo"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

        <NotificationDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Tài khoản"
              className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-transform hover:scale-105"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{user.email}</div>
              <div className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">
                  {ROLE_LABELS[role]} · {user.department}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/cai-dat')}>
              <UserIcon className="h-4 w-4" /> Tài khoản
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/cai-dat')}>
              <Settings className="h-4 w-4" /> Cài đặt
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" /> Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
