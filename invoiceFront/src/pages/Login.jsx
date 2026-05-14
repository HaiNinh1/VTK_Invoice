import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogIn, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useRole } from '@/context/RoleContext'
import { useToast } from '@/components/ui/toast'
import { ROLE_LABELS } from '@/data/masterData'

/* -----------------------------------------------------------------------
 * Login — modern two-pane layout.
 * Left  : dark slate brand panel with indigo mesh (desktop only)
 * Right : clean white card with form
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
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      {/* ─── Left: Brand hero ───────────────────────────────── */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-sidebar-mesh text-white px-12 py-10">
        {/* decorative grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* indigo glow accents */}
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[hsl(var(--primary)/0.25)] blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[hsl(265_84%_60%/0.18)] blur-3xl" />

        {/* logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl tracking-tight shadow-lg">
            V
          </div>
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--sidebar-fg-muted))]">
              Viettel Telecom · 2026
            </div>
          </div>
        </div>

        {/* headline */}
        <div className="relative max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Phiên bản 2026
          </div>
          <h2 className="text-4xl font-display font-bold leading-[1.1] tracking-tight text-white">
            Quản trị hóa đơn,
            <br />
            <span className="text-[hsl(var(--primary-soft))]">
              tinh gọn &amp; trọn vẹn.
            </span>
          </h2>
          <p className="text-[15px] leading-relaxed text-[hsl(var(--sidebar-fg))]">
            Tập trung quy trình từ hợp đồng đến S-Invoice trên một nền tảng duy nhất.
            Thiết kế cho cán bộ kế toán Viettel, vận hành nhanh, hồ sơ minh bạch.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {['Hợp đồng', 'Đề nghị xuất HĐ', 'Phê duyệt 3 cấp', 'S-Invoice'].map(t => (
              <span
                key={t}
                className="rounded-full border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-bg-elev))] px-3 py-1 text-[11px] text-[hsl(var(--sidebar-fg))]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* footer signal */}
        <div className="relative flex items-center gap-3 text-[11px] text-[hsl(var(--sidebar-fg-muted))]">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Kết nối nội bộ Viettel · Mã hóa TLS 1.3 · Tuân thủ Nghị định 123/2020/NĐ-CP
        </div>
      </aside>

      {/* ─── Right: Form ────────────────────────────────────── */}
      <main className="flex flex-col items-center justify-center px-6 py-10 lg:px-16">
        <div className="w-full max-w-sm">
          {/* mobile brand */}
          <div className="lg:hidden mb-8 flex items-center justify-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg shadow-sm">
              V
            </div>
            <div className="leading-tight">
              <div className="text-base font-semibold">VTK Hóa đơn</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Viettel Telecom
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-[11px] uppercase tracking-[0.18em] text-primary font-semibold mb-2">
              Đăng nhập hệ thống
            </div>
            <h1 className="text-3xl font-display font-bold tracking-tight leading-tight">
              Xin chào,
              <br />
              <span className="text-primary">trở lại làm việc.</span>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Phiên bản demo — chọn vai trò bên dưới để xem giao diện tương ứng.
            </p>
          </div>

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

            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              <LogIn className="h-4 w-4" />
              {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </Button>

            <div className="flex items-center gap-3 pt-1">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">hoặc</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => toast.info('SSO Viettel sẽ khả dụng ở bản chính thức')}
              disabled={loading}
            >
              Đăng nhập SSO Viettel
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Quên mật khẩu? Liên hệ <span className="text-foreground font-medium">quản trị viên</span>.
          </p>

          <p className="mt-10 text-center text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Viettel Construction · Demo build
          </p>
        </div>
      </main>
    </div>
  )
}

function Field({ label, htmlFor, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}
