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
import { LogOut, User as UserIcon, Settings } from 'lucide-react'

function usePageTitle() {
  const { pathname } = useLocation()
  const match = NAV_ITEMS.find(
    i => i.to === pathname || (i.to !== '/' && pathname.startsWith(i.to)),
  )
  return match?.label ?? 'VTK Hoá đơn'
}

export function Header() {
  const { role, setRole, user } = useRole()
  const navigate = useNavigate()
  const { toast } = useToast()
  const title = usePageTitle()

  function handleLogout() {
    toast.success('Đã đăng xuất (demo)')
    navigate('/login')
  }

  return (
    <header
      className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-card px-4 md:px-6"
      role="banner"
    >
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Role switcher — demo aid, spec calls it out explicitly */}
        <div className="hidden sm:block">
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-9 w-[150px]" aria-label="Vai trò demo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <NotificationDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Tài khoản"
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {ROLE_LABELS[role]} · {user.department}
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
            <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" /> Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
