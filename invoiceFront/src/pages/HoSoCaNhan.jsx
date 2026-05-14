import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, KeyRound, ShieldCheck, Mail, Building2, BadgeCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { initials } from '@/components/shared/formatters'
import { useRole } from '@/context/RoleContext'
import { useToast } from '@/components/ui/toast'
import { ROLE_LABELS } from '@/data/masterData'

/* -----------------------------------------------------------------------
 * Trang Hồ sơ cá nhân — Prompt 19.
 *
 * Hiển thị thông tin tài khoản hiện tại + form đổi mật khẩu + trạng thái
 * chữ ký số. Đây là page độc lập (không trộn vào Cài đặt nữa) để bám đúng
 * spec Prompt 19 — Profile page tách biệt.
 * --------------------------------------------------------------------- */
const PROFILE_KEY = 'vtk:profile:v1'
function loadProfile() {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(window.localStorage.getItem(PROFILE_KEY) || '{}') } catch { return {} }
}

export default function HoSoCaNhan() {
  const { role, user } = useRole()
  const { toast } = useToast()
  const stored = loadProfile()
  const [name, setName] = useState(stored.name ?? user.name)
  const [email, setEmail] = useState(stored.email ?? user.email)
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const setupSig = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('setup') === 'signature'

  useEffect(() => {
    if (setupSig) toast.info('Vui lòng thiết lập chữ ký số để bắt đầu sử dụng hệ thống')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSaveProfile() {
    try {
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify({ name, email, hasSignature: user.hasSignature }))
      toast.success('Đã cập nhật hồ sơ')
    } catch {
      toast.error('Không thể lưu hồ sơ')
    }
  }

  function handleChangePwd() {
    if (!currentPwd || !newPwd || !confirmPwd) {
      toast.error('Vui lòng nhập đủ 3 trường mật khẩu')
      return
    }
    if (newPwd.length < 8) {
      toast.error('Mật khẩu mới phải có tối thiểu 8 ký tự')
      return
    }
    if (newPwd !== confirmPwd) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }
    toast.success('Đã đổi mật khẩu (demo)')
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild aria-label="Quay lại">
          <Link to="/"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-semibold page-title">Hồ sơ cá nhân</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT — overview card */}
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-semibold">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary">{ROLE_LABELS[role]}</Badge>
              <Badge variant="muted">{user.department}</Badge>
              {user.hasSignature && (
                <Badge variant="success" className="gap-1">
                  <BadgeCheck className="h-3 w-3" /> Đã có CKS
                </Badge>
              )}
            </div>

            <Separator className="my-2" />

            <ul className="w-full space-y-2 text-left text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" /> Đơn vị: {user.department}
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Vai trò: {ROLE_LABELS[role]}
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* RIGHT — editable forms */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin tài khoản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Họ và tên">
                  <Input value={name} onChange={e => setName(e.target.value)} />
                </Field>
                <Field label="Email">
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </Field>
                <Field label="Đơn vị">
                  <Input value={user.department} disabled />
                </Field>
                <Field label="Vai trò">
                  <Input value={ROLE_LABELS[role]} disabled />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile}>Lưu thay đổi</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-4 w-4" /> Đổi mật khẩu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Mật khẩu hiện tại">
                  <Input
                    type="password"
                    value={currentPwd}
                    onChange={e => setCurrentPwd(e.target.value)}
                    autoComplete="current-password"
                  />
                </Field>
                <span className="hidden md:block" />
                <Field label="Mật khẩu mới (≥ 8 ký tự)">
                  <Input
                    type="password"
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Nhập lại mật khẩu mới">
                  <Input
                    type="password"
                    value={confirmPwd}
                    onChange={e => setConfirmPwd(e.target.value)}
                    autoComplete="new-password"
                  />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleChangePwd}>Cập nhật mật khẩu</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chữ ký số</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
                <div className="flex-1 text-sm">
                  {user.hasSignature
                    ? <span className="text-green-700">Đã thiết lập — chứng thư còn hạn đến 31/12/2026.</span>
                    : <span className="text-amber-700">Chưa thiết lập. Liên hệ IT để được hỗ trợ.</span>}
                </div>
                <Button asChild variant="outline">
                  <Link to="/cai-dat">Cấu hình</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  )
}
