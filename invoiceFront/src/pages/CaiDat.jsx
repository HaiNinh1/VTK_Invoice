import { useState } from 'react'
import { ShieldCheck, KeyRound, FileCog, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { initials } from '@/components/shared/formatters'
import {
  USERS, INVOICE_TYPE_CONFIGS, ROLE_LABELS,
} from '@/data/masterData'
import { useRole } from '@/context/RoleContext'
import { useToast } from '@/components/ui/toast'

/* -----------------------------------------------------------------------
 * Page: "Cài đặt" — Spec: Prompt 9 + Prompt 12 + Prompt 18.
 *
 * 4 tabs:
 *   Tài khoản     — current user profile + password change form
 *   Chữ ký số     — signature certificate status + setup CTA
 *   Loại HĐ       — invoice type configs (read-only listing)
 *   Người dùng    — users table (admin only, read-only here)
 * --------------------------------------------------------------------- */

export default function CaiDat() {
  const { role, user } = useRole()
  const [tab, setTab] = useState('tai-khoan')
  const { toast } = useToast()

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Cài đặt</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="tai-khoan">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Tài khoản</span>
          </TabsTrigger>
          <TabsTrigger value="chu-ky">
            <span className="inline-flex items-center gap-1.5"><KeyRound className="h-4 w-4" /> Chữ ký số</span>
          </TabsTrigger>
          <TabsTrigger value="loai-hd">
            <span className="inline-flex items-center gap-1.5"><FileCog className="h-4 w-4" /> Loại HĐ</span>
          </TabsTrigger>
          <TabsTrigger value="nguoi-dung" disabled={role !== 'admin'}>
            <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" /> Người dùng</span>
          </TabsTrigger>
        </TabsList>

        {/* ----- Tab: Tài khoản ----- */}
        <TabsContent value="tai-khoan">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback>{initials(user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-lg font-semibold">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="mt-1 flex gap-2">
                    <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
                    <Badge variant="muted">{user.department}</Badge>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Mật khẩu hiện tại"><Input type="password" /></Field>
                <span className="hidden md:block" />
                <Field label="Mật khẩu mới"><Input type="password" /></Field>
                <Field label="Nhập lại mật khẩu mới"><Input type="password" /></Field>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => toast.success('Đã đổi mật khẩu (demo)')}>Cập nhật</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----- Tab: Chữ ký số ----- */}
        <TabsContent value="chu-ky">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
                <div className="flex-1">
                  <div className="font-semibold">Trạng thái chữ ký số</div>
                  <div className="mt-1 text-sm">
                    {user.hasSignature
                      ? <span className="text-green-700">Đã thiết lập — chứng thư còn hạn đến 31/12/2026.</span>
                      : <span className="text-amber-700">Chưa thiết lập. Vui lòng cấu hình USB-Token hoặc HSM.</span>}
                  </div>
                </div>
                <Button
                  variant={user.hasSignature ? 'outline' : 'default'}
                  onClick={() => toast.info('Mở wizard thiết lập chữ ký số (demo)')}
                >
                  {user.hasSignature ? 'Cấu hình lại' : 'Thiết lập ngay'}
                </Button>
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">
                Chữ ký số được sử dụng khi ký duyệt đề nghị xuất hoá đơn và ký phát hành
                hoá đơn điện tử theo TT78/2021 + NĐ123/2020.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----- Tab: Loại HĐ ----- */}
        <TabsContent value="loai-hd">
          <Card>
            <CardContent className="space-y-3 p-6">
              <p className="text-sm text-muted-foreground">
                Mỗi loại dịch vụ có danh mục hồ sơ pháp lý bắt buộc/khuyến nghị riêng.
                Đề nghị xuất hoá đơn sẽ tự động sinh checklist tương ứng.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {INVOICE_TYPE_CONFIGS.map(cfg => (
                  <Card key={cfg.id} className="border-border/60">
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{cfg.name}</div>
                        <Badge variant={cfg.active ? 'success' : 'muted'}>
                          {cfg.active ? 'Đang dùng' : 'Tạm ẩn'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Loại DV: {cfg.serviceType} ·{' '}
                        {cfg.documentGroups.reduce((s, g) => s + g.documents.length, 0)} hồ sơ
                      </div>
                      <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        {cfg.documentGroups.map(g => (
                          <li key={g.groupName}>
                            • {g.groupName} ({g.documents.length})
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----- Tab: Người dùng (admin) ----- */}
        <TabsContent value="nguoi-dung">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Người dùng</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Vai trò</th>
                    <th className="px-4 py-3">Đơn vị</th>
                    <th className="px-4 py-3">Chữ ký số</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {USERS.map(u => (
                    <tr key={u.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{initials(u.name)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3"><Badge variant="secondary">{ROLE_LABELS[u.role]}</Badge></td>
                      <td className="px-4 py-3">{u.department}</td>
                      <td className="px-4 py-3">
                        {u.hasSignature
                          ? <Badge variant="success">Đã có</Badge>
                          : <Badge variant="warning">Chưa có</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
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
