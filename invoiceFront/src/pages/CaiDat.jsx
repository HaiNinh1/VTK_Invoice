import { useMemo, useState } from 'react'
import {
  ShieldCheck, KeyRound, FileCog, Users, Bell, Plus, Pencil, Trash2,
  Check, X as XIcon, ToggleLeft, ToggleRight, Plug, Server, Mail,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { initials } from '@/components/shared/formatters'
import { USERS, ROLE_LABELS } from '@/data/masterData'
import { useRole } from '@/context/RoleContext'
import { useToast } from '@/components/ui/toast'
import { useInvoiceTypes } from '@/context/InvoiceTypesContext'
import { useNotifications } from '@/context/NotificationsContext'
import { cn } from '@/lib/utils'

/* -----------------------------------------------------------------------
 * Trang Cài đặt — Prompt 9 + 12 + 18.
 *
 * 5 tabs:
 *   Tài khoản  — quick view + đổi mật khẩu (chi tiết hơn ở /ho-so-ca-nhan)
 *   Chữ ký số  — trạng thái CKS
 *   Loại HĐ    — FULL CRUD theo Prompt 12 (loại + nhóm hồ sơ + tài liệu)
 *   Thông báo  — toggles loại thông báo nhận
 *   Người dùng — admin only, read-only
 * --------------------------------------------------------------------- */

export default function CaiDat() {
  const { role, user } = useRole()
  const [tab, setTab] = useState('tai-khoan')
  const { toast } = useToast()

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold page-title">Cài đặt</h1>

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
          <TabsTrigger value="thong-bao">
            <span className="inline-flex items-center gap-1.5"><Bell className="h-4 w-4" /> Thông báo</span>
          </TabsTrigger>
          <TabsTrigger value="ket-noi">
            <span className="inline-flex items-center gap-1.5"><Plug className="h-4 w-4" /> Kết nối</span>
          </TabsTrigger>
          <TabsTrigger value="nguoi-dung" disabled={role !== 'admin'}>
            <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" /> Người dùng</span>
          </TabsTrigger>
        </TabsList>

        {/* ----- Tab: Tài khoản (quick) ----- */}
        <TabsContent value="tai-khoan">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback>{initials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-lg font-semibold">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="mt-1 flex gap-2">
                    <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
                    <Badge variant="muted">{user.department}</Badge>
                  </div>
                </div>
                <Button asChild variant="outline">
                  <a href="/ho-so-ca-nhan">Mở hồ sơ</a>
                </Button>
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

        {/* ----- Tab: Loại HĐ (FULL CRUD) ----- */}
        <TabsContent value="loai-hd">
          <InvoiceTypesEditor />
        </TabsContent>

        {/* ----- Tab: Thông báo ----- */}
        <TabsContent value="thong-bao">
          <NotificationSettings />
        </TabsContent>

        {/* ----- Tab: Kết nối (Prompt 9) ----- */}
        <TabsContent value="ket-noi">
          <ConnectionsTab />
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

/* ============================== HELPERS ============================== */

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  )
}

/* --------------------- Invoice Types CRUD editor --------------------- */

function InvoiceTypesEditor() {
  const {
    types, addType, updateType, deleteType, toggleActive,
    addGroup, renameGroup, deleteGroup,
    addDocument, updateDocument, deleteDocument,
  } = useInvoiceTypes()
  const { toast } = useToast()
  const [selectedId, setSelectedId] = useState(types[0]?.id ?? null)
  const [confirmDelType, setConfirmDelType] = useState(null)
  const [confirmDelGroup, setConfirmDelGroup] = useState(null)

  // Re-sync selection if list changes externally
  if (selectedId && !types.some(t => t.id === selectedId)) {
    const next = types[0]?.id ?? null
    setSelectedId(next)
  }
  const selected = types.find(t => t.id === selectedId) ?? null

  function handleAddType() {
    const name = window.prompt('Tên loại HĐ mới:')?.trim()
    if (!name) return
    const serviceType = window.prompt('Loại dịch vụ (mã ngắn):', name)?.trim() || name
    const id = addType({ name, serviceType })
    setSelectedId(id)
    toast.success(`Đã thêm "${name}"`)
  }

  function handleRenameType(t) {
    const name = window.prompt('Tên mới:', t.name)?.trim()
    if (!name || name === t.name) return
    const serviceType = window.prompt('Loại dịch vụ:', t.serviceType)?.trim() || t.serviceType
    updateType(t.id, { name, serviceType })
    toast.success('Đã cập nhật loại HĐ')
  }

  function handleAddGroup() {
    if (!selected) return
    const name = window.prompt('Tên nhóm hồ sơ mới:')?.trim()
    if (!name) return
    addGroup(selected.id, name)
    toast.success(`Đã thêm nhóm "${name}"`)
  }

  function handleRenameGroup(groupIdx, oldName) {
    const name = window.prompt('Tên nhóm:', oldName)?.trim()
    if (!name || name === oldName) return
    renameGroup(selected.id, groupIdx, name)
  }

  function handleAddDoc(groupIdx) {
    const name = window.prompt('Tên tài liệu:')?.trim()
    if (!name) return
    addDocument(selected.id, groupIdx, { name, required: true })
    toast.success(`Đã thêm "${name}"`)
  }

  function handleRenameDoc(groupIdx, doc) {
    const name = window.prompt('Tên tài liệu:', doc.name)?.trim()
    if (!name || name === doc.name) return
    updateDocument(selected.id, groupIdx, doc.id, { name })
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="grid gap-0 lg:grid-cols-[260px_1fr]">
          {/* Left: type list */}
          <div className="border-b lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Danh sách ({types.length})
              </span>
              <Button size="sm" onClick={handleAddType}>
                <Plus className="h-3.5 w-3.5" /> Thêm
              </Button>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto divide-y">
              {types.map(t => {
                const docCount = t.documentGroups.reduce((s, g) => s + g.documents.length, 0)
                const active = t.id === selectedId
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className={cn(
                        'flex w-full items-start justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors',
                        active ? 'bg-primary/5' : 'hover:bg-accent/40',
                      )}
                    >
                      <div className="min-w-0">
                        <div className={cn('truncate font-medium', active && 'text-primary')}>
                          {t.name}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {t.serviceType} · {docCount} tài liệu
                        </div>
                      </div>
                      <Badge variant={t.active ? 'success' : 'muted'} className="shrink-0 text-[10px]">
                        {t.active ? 'Bật' : 'Tắt'}
                      </Badge>
                    </button>
                  </li>
                )
              })}
              {types.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Chưa có loại HĐ nào.
                </li>
              )}
            </ul>
          </div>

          {/* Right: detail editor */}
          <div className="p-5">
            {!selected ? (
              <p className="text-sm text-muted-foreground">Chọn một loại HĐ ở danh sách bên trái để chỉnh sửa.</p>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold">{selected.name}</h2>
                      <Badge variant={selected.active ? 'success' : 'muted'}>
                        {selected.active ? 'Đang dùng' : 'Tạm ẩn'}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Loại DV: {selected.serviceType} · ID: <span className="font-mono">{selected.id}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleRenameType(selected)}>
                      <Pencil className="h-3.5 w-3.5" /> Đổi tên
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { toggleActive(selected.id); toast.info(selected.active ? 'Đã tắt' : 'Đã bật') }}
                    >
                      {selected.active
                        ? <><ToggleRight className="h-3.5 w-3.5" /> Tắt</>
                        : <><ToggleLeft  className="h-3.5 w-3.5" /> Bật</>}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDelType(selected)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Xóa
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Nhóm hồ sơ bắt buộc</h3>
                  <Button size="sm" variant="outline" onClick={handleAddGroup}>
                    <Plus className="h-3.5 w-3.5" /> Thêm nhóm
                  </Button>
                </div>

                {selected.documentGroups.length === 0 && (
                  <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                    Chưa có nhóm hồ sơ. Thêm nhóm đầu tiên để bắt đầu.
                  </p>
                )}

                <div className="space-y-4">
                  {selected.documentGroups.map((g, gi) => (
                    <div key={gi} className="rounded-md border bg-card/60">
                      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{g.groupName}</div>
                          <div className="text-[11px] text-muted-foreground">{g.documents.length} tài liệu</div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleRenameGroup(gi, g.groupName)} aria-label="Đổi tên nhóm">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDelGroup({ idx: gi, name: g.groupName })}
                            className="text-destructive"
                            aria-label="Xóa nhóm"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <ul className="divide-y">
                        {g.documents.map(d => (
                          <li key={d.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                            <div className="min-w-0 flex-1">
                              <div className="truncate">{d.name}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => updateDocument(selected.id, gi, d.id, { required: !d.required })}
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
                                d.required
                                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                  : 'bg-muted text-muted-foreground hover:bg-accent',
                              )}
                              title={d.required ? 'Đang bắt buộc — bấm để tắt' : 'Không bắt buộc — bấm để bật'}
                            >
                              {d.required ? 'Bắt buộc' : 'Tuỳ chọn'}
                            </button>
                            <Button size="sm" variant="ghost" onClick={() => handleRenameDoc(gi, d)} aria-label="Đổi tên">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteDocument(selected.id, gi, d.id)}
                              className="text-destructive"
                              aria-label="Xóa tài liệu"
                            >
                              <XIcon className="h-3.5 w-3.5" />
                            </Button>
                          </li>
                        ))}
                        <li className="px-3 py-2">
                          <Button size="sm" variant="ghost" className="text-xs" onClick={() => handleAddDoc(gi)}>
                            <Plus className="h-3 w-3" /> Thêm tài liệu
                          </Button>
                        </li>
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <ConfirmModal
        open={!!confirmDelType}
        onOpenChange={(o) => !o && setConfirmDelType(null)}
        title="Xóa loại HĐ?"
        description={confirmDelType ? `Xóa "${confirmDelType.name}" sẽ làm các hợp đồng đang dùng loại này không còn checklist mặc định. Hành động không thể hoàn tác.` : ''}
        confirmLabel="Xóa"
        confirmVariant="destructive"
        onConfirm={() => {
          if (!confirmDelType) return
          deleteType(confirmDelType.id)
          toast.success(`Đã xóa "${confirmDelType.name}"`)
          setConfirmDelType(null)
        }}
      />
      <ConfirmModal
        open={!!confirmDelGroup}
        onOpenChange={(o) => !o && setConfirmDelGroup(null)}
        title="Xóa nhóm hồ sơ?"
        description={confirmDelGroup ? `Xóa nhóm "${confirmDelGroup.name}" sẽ xóa luôn các tài liệu trong nhóm.` : ''}
        confirmLabel="Xóa"
        confirmVariant="destructive"
        onConfirm={() => {
          if (!confirmDelGroup || !selected) return
          deleteGroup(selected.id, confirmDelGroup.idx)
          toast.success('Đã xóa nhóm hồ sơ')
          setConfirmDelGroup(null)
        }}
      />
    </Card>
  )
}

/* Suppress unused import lint */
void Check

/* ------------------------ Notification settings ----------------------- */

function NotificationSettings() {
  const { settings, updateSettings } = useNotifications()
  const { toast } = useToast()

  const items = [
    { key: 'pendingApproval',   label: 'Đề nghị chờ duyệt',       desc: 'Khi có ĐN mới cần duyệt (kế toán/quản trị).' },
    { key: 'approved',          label: 'ĐN của tôi đã duyệt',      desc: 'Khi đề nghị của tôi được duyệt.' },
    { key: 'rejected',          label: 'ĐN của tôi bị từ chối',      desc: 'Khi đề nghị bị từ chối.' },
    { key: 'returned',          label: 'ĐN của tôi bị trả lại',    desc: 'Khi đề nghị bị trả lại để bổ sung hồ sơ.' },
    { key: 'exportSuccess',     label: 'Xuất HĐ thành công',      desc: 'Khi hóa đơn điện tử được phát hành thành công.' },
    { key: 'exportError',       label: 'Xuất HĐ lỗi',              desc: 'Khi cổng S-Invoice phản hồi lỗi, cần thử lại.' },
    { key: 'legalDueSoon',      label: 'Cam kết sắp đến hạn',       desc: 'Nhắc cam kết bổ sung hồ sơ còn ≤ 3 ngày.' },
    { key: 'commitmentOverdue', label: 'Cam kết quá hạn',           desc: 'Cam kết đã quá hạn nhưng chưa bổ sung.' },
    { key: 'system',            label: 'Thông báo hệ thống',         desc: 'Cập nhật phần mềm, nhắc nộp báo cáo định kỳ (mặc định tắt).' },
  ]

  function toggle(key) {
    updateSettings({ [key]: !settings[key] })
    toast.info(`${settings[key] ? 'Đã tắt' : 'Đã bật'} thông báo`)
  }

  return (
    <Card>
      <CardContent className="space-y-1 p-2">
        <ul className="divide-y">
          {items.map(it => (
            <li key={it.key} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">{it.label}</div>
                <div className="text-xs text-muted-foreground">{it.desc}</div>
              </div>
              <button
                type="button"
                onClick={() => toggle(it.key)}
                aria-pressed={!!settings[it.key]}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors',
                  settings[it.key] ? 'bg-primary' : 'bg-muted',
                )}
                aria-label={`Bật/tắt ${it.label}`}
              >
                <span
                  className={cn(
                    'inline-block h-5 w-5 translate-x-0.5 translate-y-0.5 transform rounded-full bg-white shadow transition-transform',
                    settings[it.key] && 'translate-x-[22px]',
                  )}
                />
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

/* --------------------------- Connections tab -------------------------- */

function ConnectionsTab() {
  const { toast } = useToast()
  const [sInvoiceStatus, setSInvoiceStatus] = useState({ state: 'unknown', message: '' })
  const [smtpStatus, setSmtpStatus] = useState({ state: 'unknown', message: '' })
  const [sInvoiceForm, setSInvoiceForm] = useState({
    endpoint: 'https://api-vinvoice.viettel.vn',
    taxCode: '0100109106',
    username: 'vtk-prod',
  })
  const [smtpForm, setSmtpForm] = useState({
    host: 'smtp.viettel.com.vn',
    port: '465',
    username: 'no-reply@vtk.vn',
    from: 'VTK Hoá đơn <no-reply@vtk.vn>',
  })

  function testSInvoice() {
    setSInvoiceStatus({ state: 'testing', message: 'Đang gửi gói kiểm tra...' })
    setTimeout(() => {
      setSInvoiceStatus({ state: 'ok', message: `Kết nối thành công · MST ${sInvoiceForm.taxCode}` })
      toast.success('Cổng S-Invoice phản hồi OK')
    }, 700)
  }

  function testSmtp() {
    setSmtpStatus({ state: 'testing', message: 'Đang gửi email test...' })
    setTimeout(() => {
      setSmtpStatus({ state: 'ok', message: `Đã gửi mail test tới ${smtpForm.username}` })
      toast.success('SMTP phản hồi OK')
    }, 700)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* S-Invoice Viettel */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Cổng S-Invoice Viettel</h3>
            <ConnStatusBadge status={sInvoiceStatus.state} />
          </div>
          <div className="grid gap-3">
            <Field label="Endpoint">
              <Input value={sInvoiceForm.endpoint} onChange={e => setSInvoiceForm({ ...sInvoiceForm, endpoint: e.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="MST đơn vị">
                <Input value={sInvoiceForm.taxCode} onChange={e => setSInvoiceForm({ ...sInvoiceForm, taxCode: e.target.value })} />
              </Field>
              <Field label="Tài khoản API">
                <Input value={sInvoiceForm.username} onChange={e => setSInvoiceForm({ ...sInvoiceForm, username: e.target.value })} />
              </Field>
            </div>
            {sInvoiceStatus.message && (
              <div className={cn('rounded-md border px-3 py-2 text-xs',
                sInvoiceStatus.state === 'ok' ? 'border-green-200 bg-green-50 text-green-800' :
                sInvoiceStatus.state === 'error' ? 'border-red-200 bg-red-50 text-red-800' :
                'border-amber-200 bg-amber-50 text-amber-800',
              )}>
                {sInvoiceStatus.message}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => toast.success('Đã lưu cấu hình (demo)')}>Lưu</Button>
            <Button onClick={testSInvoice} disabled={sInvoiceStatus.state === 'testing'}>
              <Plug className="h-4 w-4" /> {sInvoiceStatus.state === 'testing' ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SMTP Email */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Email SMTP</h3>
            <ConnStatusBadge status={smtpStatus.state} />
          </div>
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
              <Field label="SMTP Host">
                <Input value={smtpForm.host} onChange={e => setSmtpForm({ ...smtpForm, host: e.target.value })} />
              </Field>
              <Field label="Port">
                <Input value={smtpForm.port} onChange={e => setSmtpForm({ ...smtpForm, port: e.target.value })} />
              </Field>
            </div>
            <Field label="Tài khoản">
              <Input value={smtpForm.username} onChange={e => setSmtpForm({ ...smtpForm, username: e.target.value })} />
            </Field>
            <Field label="From">
              <Input value={smtpForm.from} onChange={e => setSmtpForm({ ...smtpForm, from: e.target.value })} />
            </Field>
            {smtpStatus.message && (
              <div className={cn('rounded-md border px-3 py-2 text-xs',
                smtpStatus.state === 'ok' ? 'border-green-200 bg-green-50 text-green-800' :
                smtpStatus.state === 'error' ? 'border-red-200 bg-red-50 text-red-800' :
                'border-amber-200 bg-amber-50 text-amber-800',
              )}>
                {smtpStatus.message}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => toast.success('Đã lưu cấu hình (demo)')}>Lưu</Button>
            <Button onClick={testSmtp} disabled={smtpStatus.state === 'testing'}>
              <Mail className="h-4 w-4" /> {smtpStatus.state === 'testing' ? 'Đang gửi...' : 'Gửi mail test'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ConnStatusBadge({ status }) {
  if (status === 'ok')      return <Badge variant="success">Đã kết nối</Badge>
  if (status === 'error')   return <Badge variant="destructive">Lỗi</Badge>
  if (status === 'testing') return <Badge variant="warning">Đang kiểm tra...</Badge>
  return <Badge variant="muted">Chưa kiểm tra</Badge>
}
