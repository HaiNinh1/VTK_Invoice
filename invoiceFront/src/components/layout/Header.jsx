import { Bell } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useRole } from '@/context/RoleContext'
import { initials } from '@/components/shared/formatters'
import { NAV_ITEMS, ROLE_LABELS } from '@/data/masterData'

function usePageTitle() {
  const { pathname } = useLocation()
  const match = NAV_ITEMS.find(
    i => i.to === pathname || (i.to !== '/' && pathname.startsWith(i.to)),
  )
  return match?.label ?? 'VTK Hoá đơn'
}

export function Header() {
  const { role, setRole, user } = useRole()
  const title = usePageTitle()

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

        <Button
          variant="ghost"
          size="icon"
          aria-label="Thông báo"
          className="relative h-10 w-10"
        >
          <Bell className="h-5 w-5" />
          <span
            aria-hidden
            className="absolute right-2 top-2 inline-flex h-2 w-2 rounded-full bg-primary"
          />
        </Button>

        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary/10 text-primary">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
