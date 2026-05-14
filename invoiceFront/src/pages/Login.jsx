import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useRole } from '@/context/RoleContext'
import { useToast } from '@/components/ui/toast'
import { ROLE_LABELS } from '@/data/masterData'

/* -----------------------------------------------------------------------
 * Login screen — demo only. Picks a role, sets it on RoleContext,
 * and routes to "/". Username/password are not validated.
 *
 * Design notes:
 *   - Full-screen centered card on white bg with subtle gradient.
 *   - Viettel Red logo block to match AppShell branding.
 *   - Mobile-first: card maxes at sm.
 * --------------------------------------------------------------------- */

export default function Login() {
  const { setRole } = useRole()
  const navigate = useNavigate()
  const { state } = useLocation()
  const { toast } = useToast()

  const [username, setUsername] = useState('demo')
  const [password, setPassword] = useState('demo1234')
  const [role, setRoleLocal] = useState('accountant')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!username || !password) {
      toast.error('Vui lòng nhập tài khoản và mật khẩu')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setRole(role)
      toast.success(`Đăng nhập thành công · ${ROLE_LABELS[role]}`)
      navigate(state?.from ?? '/', { replace: true })
    }, 350)
  }

  return (
    <div className="min-h-svh bg-gradient-to-br from-background to-muted/40">
      <div className="mx-auto flex min-h-svh max-w-md flex-col items-stretch justify-center px-4 py-10">
        {/* Brand block */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"
            aria-hidden
          >
            <span className="text-xl font-bold tracking-tight">VTK</span>
          </div>
          <div className="text-center">
            <div className="text-base font-semibold">VTK Hoá đơn</div>
            <div className="text-xs text-muted-foreground">
              Hệ thống quản lý hoá đơn điện tử
            </div>
          </div>
        </div>

        <Card className="shadow-md">
          <CardHeader className="space-y-1 pb-3">
            <CardTitle className="text-lg">Đăng nhập</CardTitle>
            <CardDescription className="text-xs">
              Phiên bản demo · chọn vai trò để xem giao diện tương ứng.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Field label="Tài khoản" htmlFor="username">
                <Input
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="vd: an.nv"
                  disabled={loading}
                />
              </Field>

              <Field label="Mật khẩu" htmlFor="password">
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <Field label="Vai trò (demo)" htmlFor="role">
                <Select value={role} onValueChange={setRoleLocal}>
                  <SelectTrigger id="role" disabled={loading}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Button type="submit" className="w-full" disabled={loading}>
                <LogIn className="h-4 w-4" />
                {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Quên mật khẩu? Liên hệ quản trị viên.
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Viettel Construction. Demo build.
        </p>
      </div>
    </div>
  )
}

function Field({ label, htmlFor, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}
