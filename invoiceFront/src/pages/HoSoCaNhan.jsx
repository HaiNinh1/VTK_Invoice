import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, KeyRound, ShieldCheck, Mail, Building2, BadgeCheck, Upload } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { initials } from '@/components/shared/formatters'
import { useRole } from '@/context/RoleContext'
import { useToast } from '@/components/ui/toast'
import { api, errorMessage, storageUrl } from '@/services/api'

/* -----------------------------------------------------------------------
 * Hồ sơ cá nhân — real backend wiring.
 *   PATCH /api/profile                    (name, email)
 *   POST  /api/auth/change-password       (currentPwd, newPwd, confirmPwd)
 *   POST  /api/profile/signature          (multipart `signature` file)
 * --------------------------------------------------------------------- */

export default function HoSoCaNhan() {
  const { role, roleLabel, user, refreshUser, setUser } = useRole()
  const { toast } = useToast()
  const fileRef = useRef(null)

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)

  const [uploadingSig, setUploadingSig] = useState(false)

  const setupSig = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('setup') === 'signature'

  useEffect(() => {
    if (setupSig) toast.info('Vui lòng thiết lập chữ ký số để bắt đầu sử dụng hệ thống')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep local form in sync if user is hydrated later.
  useEffect(() => {
    if (user) { setName(user.name); setEmail(user.email) }
  }, [user?.id])  // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveProfile() {
    if (!name.trim() || !email.trim()) {
      toast.error('Vui lòng nhập đủ họ tên và email'); return
    }
    setSavingProfile(true)
    try {
      const res = await api.patch('/profile', { name: name.trim(), email: email.trim() })
      const data = res.data?.data ?? res.data
      if (data) setUser({
        ...user,
        name: data.name, email: data.email,
        role: data.role, roleLabel: data.roleLabel,
        department: data.department, phone: data.phone,
        title: data.title, hasSignature: data.hasSignature,
        signaturePath: data.signaturePath,
      })
      toast.success('Đã cập nhật hồ sơ')
    } catch (err) {
      toast.error(errorMessage(err, 'Không thể lưu hồ sơ'))
    } finally { setSavingProfile(false) }
  }

  async function handleChangePwd() {
    if (!currentPwd || !newPwd || !confirmPwd) {
      toast.error('Vui lòng nhập đủ 3 trường mật khẩu'); return
    }
    if (newPwd.length < 8) { toast.error('Mật khẩu mới phải có tối thiểu 8 ký tự'); return }
    if (newPwd !== confirmPwd) { toast.error('Mật khẩu xác nhận không khớp'); return }
    setSavingPwd(true)
    try {
      await api.post('/auth/change-password', { currentPwd, newPwd, confirmPwd })
      toast.success('Đã đổi mật khẩu')
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    } catch (err) {
      toast.error(errorMessage(err, 'Không thể đổi mật khẩu'))
    } finally { setSavingPwd(false) }
  }

  async function handleSignatureSelected(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      toast.error('Chữ ký phải là PNG hoặc JPG'); return
    }
    if (file.size > 1024 * 1024) { toast.error('Tệp tối đa 1MB'); return }
    setUploadingSig(true)
    try {
      const form = new FormData()
      form.append('signature', file)
      const res = await api.post('/profile/signature', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const u = res.data?.user
      if (u) setUser({
        ...user,
        hasSignature: true,
        signaturePath: u.signaturePath ?? res.data?.signaturePath ?? null,
      })
      else await refreshUser()
      toast.success('Đã cập nhật chữ ký số')
    } catch (err) {
      toast.error(errorMessage(err, 'Tải chữ ký thất bại'))
    } finally { setUploadingSig(false) }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild aria-label="Quay lại">
          <Link to="/"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-semibold page-title">Hồ sơ cá nhân</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
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
              <Badge variant="secondary">{roleLabel}</Badge>
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
                <ShieldCheck className="h-3.5 w-3.5" /> Vai trò: {roleLabel}
              </li>
            </ul>
          </CardContent>
        </Card>

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
                  <Input value={roleLabel} disabled />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={savingProfile}>
                  {savingProfile ? 'Đang lưu…' : 'Lưu thay đổi'}
                </Button>
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
                  <Input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} autoComplete="current-password" />
                </Field>
                <span className="hidden md:block" />
                <Field label="Mật khẩu mới (≥ 8 ký tự)">
                  <Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} autoComplete="new-password" />
                </Field>
                <Field label="Nhập lại mật khẩu mới">
                  <Input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} autoComplete="new-password" />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleChangePwd} disabled={savingPwd}>
                  {savingPwd ? 'Đang cập nhật…' : 'Cập nhật mật khẩu'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chữ ký số</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
                <div className="flex-1 text-sm">
                  {user.hasSignature
                    ? <span className="text-green-700">Đã thiết lập chữ ký số.</span>
                    : <span className="text-amber-700">Chưa thiết lập. Tải lên ảnh chữ ký (PNG/JPG, tối đa 1MB).</span>}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleSignatureSelected}
                  className="hidden"
                />
                <Button variant="outline" disabled={uploadingSig} onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  {uploadingSig ? 'Đang tải…' : (user.hasSignature ? 'Cập nhật chữ ký' : 'Tải chữ ký')}
                </Button>
              </div>
              {user.signaturePath && (
                <div className="rounded-md border bg-muted/40 p-3">
                  <img
                    src={storageUrl(user.signaturePath)}
                    alt="Chữ ký số"
                    className="max-h-28"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* unused to silence import warning if needed */}
      <span className="hidden">{role}</span>
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
