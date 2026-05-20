import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Inbox, RotateCcw, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatVND, formatDate } from '@/components/shared/formatters'
import { useRequests } from '@/context/RequestsContext'
import { useRole } from '@/context/RoleContext'
import { useNotifications } from '@/context/NotificationsContext'

/* -----------------------------------------------------------------------
 * Trang Phê duyệt — Spec Prompt 7 + 10.
 *
 * 3 tabs riêng biệt:
 *   Chờ duyệt   → status 'Chờ duyệt' (sort oldest first)
 *   Đã duyệt    → 'Đã duyệt' | 'Đã xuất HĐ'
 *   Đã từ chối  → 'Từ chối' | 'Trả lại bổ sung'
 *
 * Accountant approval form: số CT ghi sổ, TK Doanh thu, TK Thuế, TK Phải thu, ghi chú.
 * Reject/Return modal: yêu cầu nhập lý do.
 * Approve confirm: signature preview (tên, vai trò, đơn vị, timestamp).
 * --------------------------------------------------------------------- */

const TABS = {
  'cho-duyet':   { label: 'Chờ duyệt',   statuses: ['Chờ duyệt'] },
  'da-duyet':    { label: 'Đã duyệt',    statuses: ['Đã duyệt', 'Đã xuất HĐ'] },
  'tu-choi':     { label: 'Đã từ chối',  statuses: ['Từ chối', 'Trả lại bổ sung'] },
}

export default function PheDuyet() {
  const { toast } = useToast()
  const { role, user } = useRole()
  const canApprove = role === 'accountant' || role === 'admin'
  const { requests, approveRequest, rejectRequest, returnRequest } = useRequests()
  const { pushNotification } = useNotifications()
  const [tab, setTab] = useState('cho-duyet')
  const [selectedId, setSelectedId] = useState(null)

  // Approval form state
  const [approveOpen, setApproveOpen] = useState(false)
  const [accountingRefNo, setAccountingRefNo] = useState('')
  const [accountRevenue, setAccountRevenue] = useState('5113')
  const [accountTax, setAccountTax] = useState('33311')
  const [accountReceivable, setAccountReceivable] = useState('131')
  const [approvalNote, setApprovalNote] = useState('')

  // Reject + Return modals (both need reason)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [returnOpen, setReturnOpen] = useState(false)
  const [returnReason, setReturnReason] = useState('')

  const list = useMemo(() => {
    const allowed = TABS[tab].statuses
    const rows = requests.filter(r => allowed.includes(r.status))
    // Spec: chờ duyệt sort oldest first; còn lại sort newest first
    if (tab === 'cho-duyet') {
      return rows.sort((a, b) => (a.createdDate ?? '').localeCompare(b.createdDate ?? ''))
    }
    return rows.sort((a, b) => (b.approvedDate ?? b.createdDate ?? '').localeCompare(a.approvedDate ?? a.createdDate ?? ''))
  }, [requests, tab])

  const selected = list.find(r => r.id === selectedId) ?? list[0] ?? null

  function resetApprovalForm() {
    setAccountingRefNo('')
    setAccountRevenue('5113')
    setAccountTax('33311')
    setAccountReceivable('131')
    setApprovalNote('')
  }

  async function handleApprove() {
    if (!selected) return
    if (!accountingRefNo.trim()) {
      toast.warning('Vui lòng nhập số chứng từ ghi sổ')
      return
    }
    const res = await approveRequest(selected.id, {
      approvedBy: user?.name ?? 'Kế toán',
      approvedById: user?.id ?? null,
      accountingRefNo: accountingRefNo.trim(),
      accountRevenue,
      accountTax,
      accountReceivable,
      approvalNote: approvalNote.trim() || null,
    })
    if (!res.ok) {
      toast.error(res.reason ?? 'Không thể duyệt')
      return
    }
    pushNotification({
      kind: 'approval',
      title: `Đã duyệt: ${selected.id}`,
      description: `${selected.customerName} — ${formatVND(selected.valueAfterVAT)}`,
      to: `/de-nghi/${selected.id}`,
    })
    toast.success(`Đã duyệt đề nghị ${selected.id}`)
    setApproveOpen(false)
    resetApprovalForm()
    setSelectedId(null)
  }

  async function handleReject() {
    if (!selected || !rejectReason.trim()) {
      toast.warning('Vui lòng nhập lý do từ chối')
      return
    }
    const res = await rejectRequest(selected.id, rejectReason.trim())
    if (!res.ok) {
      toast.error(res.reason ?? 'Không thể từ chối')
      return
    }
    pushNotification({
      kind: 'approval',
      title: `Đã từ chối: ${selected.id}`,
      description: rejectReason.trim(),
      to: `/de-nghi/${selected.id}`,
    })
    toast.success(`Đã từ chối ${selected.id}`)
    setRejectOpen(false)
    setRejectReason('')
    setSelectedId(null)
  }

  async function handleReturn() {
    if (!selected || !returnReason.trim()) {
      toast.warning('Vui lòng nhập lý do trả lại')
      return
    }
    const res = await returnRequest(selected.id, returnReason.trim())
    if (!res.ok) {
      toast.error(res.reason ?? 'Không thể trả lại')
      return
    }
    pushNotification({
      kind: 'approval',
      title: `Trả lại bổ sung: ${selected.id}`,
      description: returnReason.trim(),
      to: `/de-nghi/${selected.id}`,
    })
    toast.success(`Đã trả lại ${selected.id}`)
    setReturnOpen(false)
    setReturnReason('')
    setSelectedId(null)
  }

  const counts = {
    'cho-duyet': requests.filter(r => TABS['cho-duyet'].statuses.includes(r.status)).length,
    'da-duyet':  requests.filter(r => TABS['da-duyet'].statuses.includes(r.status)).length,
    'tu-choi':   requests.filter(r => TABS['tu-choi'].statuses.includes(r.status)).length,
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold page-title">Phê duyệt đề nghị</h1>
        {!canApprove && (
          <p className="text-sm text-muted-foreground">
            Bạn đang ở vai trò chỉ-xem.
          </p>
        )}
      </div>

      <Tabs value={tab} onValueChange={v => { setTab(v); setSelectedId(null) }}>
        <TabsList>
          <TabsTrigger value="cho-duyet">Chờ duyệt ({counts['cho-duyet']})</TabsTrigger>
          <TabsTrigger value="da-duyet">Đã duyệt ({counts['da-duyet']})</TabsTrigger>
          <TabsTrigger value="tu-choi">Đã từ chối ({counts['tu-choi']})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        {/* List */}
        <div className="space-y-2">
          {list.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                <Inbox className="h-8 w-8" aria-hidden />
                <p className="text-sm">Không có đề nghị nào trong danh sách này.</p>
              </CardContent>
            </Card>
          )}
          {list.map(r => {
            const active = selected?.id === r.id
            const lc = r.legalChecklist ?? { total: 0, checked: 0 }
            const legalComplete = lc.total === 0 || lc.checked >= lc.total
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedId(r.id)}
                className={`w-full rounded-lg border bg-card p-4 text-left transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active ? 'border-primary ring-1 ring-primary/30' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-primary">{r.id}</div>
                    <div className="truncate text-sm">{r.customerName}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {r.contractNumber} · {r.department} · {r.createdBy}
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={r.status} />
                    <div className="mt-1 text-sm font-medium tabular-nums">
                      {formatVND(r.valueAfterVAT, true)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className={legalComplete ? 'text-green-700' : 'text-amber-700'}>
                    Pháp lý {lc.checked}/{lc.total}
                  </span>
                  {r.hasCommitment && (
                    <span className="rounded border border-dashed border-orange-400 bg-orange-50 px-1.5 py-0.5 text-orange-900">
                      Cam kết: {formatDate(r.commitmentDeadline)}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Detail panel */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          {!selected && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                Chọn một đề nghị để xem chi tiết.
              </CardContent>
            </Card>
          )}
          {selected && (
            <Card>
              <CardContent className="space-y-4 p-5">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Đề nghị</div>
                  <div className="text-lg font-semibold text-primary">{selected.id}</div>
                </div>
                <SummaryRow label="Khách hàng" value={selected.customerName} />
                <SummaryRow label="MST" value={selected.customerTaxCode} />
                <SummaryRow label="Hợp đồng" value={selected.contractNumber} />
                <SummaryRow label="Loại DV" value={selected.serviceType} />
                <SummaryRow label="Trước VAT" value={formatVND(selected.valueBeforeVAT)} tabular />
                <SummaryRow label={`VAT ${selected.vatRate}%`} value={formatVND(selected.vatAmount)} tabular />
                <SummaryRow label="Tổng" value={formatVND(selected.valueAfterVAT)} tabular strong />
                <SummaryRow
                  label="Hồ sơ"
                  value={`${selected.legalChecklist?.checked ?? 0}/${selected.legalChecklist?.total ?? 0}`}
                />

                {/* Accounting fields (only Pending) */}
                {canApprove && selected.status === 'Chờ duyệt' && (
                  <>
                    <div className="border-t pt-3">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Thông tin kế toán</div>
                      <div className="grid grid-cols-2 gap-2">
                        <FieldInput label="Số CT ghi sổ" value={accountingRefNo} onChange={setAccountingRefNo} placeholder="VD: PT-2026-001" />
                        <FieldInput label="Ghi chú" value={approvalNote} onChange={setApprovalNote} placeholder="(tuỳ chọn)" />
                        <FieldInput label="TK Doanh thu" value={accountRevenue} onChange={setAccountRevenue} />
                        <FieldInput label="TK Thuế" value={accountTax} onChange={setAccountTax} />
                        <FieldInput label="TK Phải thu" value={accountReceivable} onChange={setAccountReceivable} />
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/de-nghi/${selected.id}`}>Xem đầy đủ</Link>
                  </Button>
                </div>

                {canApprove && selected.status === 'Chờ duyệt' && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button variant="outline" onClick={() => setReturnOpen(true)}>
                      <RotateCcw className="h-4 w-4" /> Trả lại
                    </Button>
                    <Button variant="outline" onClick={() => setRejectOpen(true)}>
                      <XCircle className="h-4 w-4" /> Từ chối
                    </Button>
                    <Button className="col-span-2" onClick={() => setApproveOpen(true)}>
                      <CheckCircle2 className="h-4 w-4" /> Duyệt
                    </Button>
                  </div>
                )}

                {/* Show approval metadata on already-approved */}
                {selected.status === 'Đã duyệt' || selected.status === 'Đã xuất HĐ' ? (
                  <div className="rounded border bg-muted/30 p-3 text-xs space-y-1">
                    <div className="font-semibold text-green-700">Đã duyệt</div>
                    {selected.approvedBy && <div>Người duyệt: {selected.approvedBy}</div>}
                    {selected.approvedDate && <div>Ngày: {formatDate(selected.approvedDate)}</div>}
                    {selected.accountingRefNo && <div>Số CT: {selected.accountingRefNo}</div>}
                    {selected.sInvoiceNumber && <div>S-Invoice: <span className="font-mono">{selected.sInvoiceNumber}</span></div>}
                  </div>
                ) : null}
                {selected.status === 'Từ chối' && selected.rejectReason && (
                  <div className="rounded border bg-red-50 p-3 text-xs">
                    <div className="font-semibold text-red-700">Đã từ chối</div>
                    <div className="mt-1">{selected.rejectReason}</div>
                  </div>
                )}
                {selected.status === 'Trả lại bổ sung' && selected.returnReason && (
                  <div className="rounded border bg-amber-50 p-3 text-xs">
                    <div className="font-semibold text-amber-700">Trả lại bổ sung</div>
                    <div className="mt-1">{selected.returnReason}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      {/* Approve modal with signature preview */}
      <Dialog open={approveOpen} onOpenChange={(o) => { setApproveOpen(o); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận duyệt</DialogTitle>
            <DialogDescription>
              {selected ? `${selected.id} — ${selected.customerName}` : ''}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">Tổng tiền</span>
                <span className="font-semibold tabular-nums text-primary">{formatVND(selected.valueAfterVAT)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Số CT ghi sổ</span>
                <span className="font-mono">{accountingRefNo || '—'}</span>
              </div>
              {/* Signature preview block */}
              <div className="rounded border bg-card p-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" /> Chữ ký số sẽ áp dụng
                </div>
                <div className="mt-2 space-y-0.5 text-sm">
                  <div className="font-semibold">{user?.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {role === 'admin' ? 'Quản trị viên' : 'Kế toán'} · {user?.department}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Thời điểm: {new Date().toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Hành động này không thể hoàn tác. Sau khi duyệt, đề nghị sẽ chuyển sang trạng thái sẵn sàng xuất hoá đơn.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>Huỷ</Button>
            <Button onClick={handleApprove}>
              <CheckCircle2 className="h-4 w-4" /> Xác nhận duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog with required reason */}
      <Dialog open={rejectOpen} onOpenChange={(o) => { setRejectOpen(o); if (!o) setRejectReason('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối đề nghị</DialogTitle>
            <DialogDescription>
              {selected ? `${selected.id} — ${selected.customerName}. Vui lòng nhập lý do.` : ''}
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Ví dụ: Thiếu BB nghiệm thu…"
            onKeyDown={e => { if (e.key === 'Enter') handleReject() }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Huỷ</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()}>
              <XCircle className="h-4 w-4" /> Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return dialog with required reason */}
      <Dialog open={returnOpen} onOpenChange={(o) => { setReturnOpen(o); if (!o) setReturnReason('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trả lại để bổ sung</DialogTitle>
            <DialogDescription>
              {selected ? `${selected.id} — Yêu cầu bổ sung điều gì?` : ''}
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={returnReason}
            onChange={e => setReturnReason(e.target.value)}
            placeholder="Ví dụ: Bổ sung biên bản quyết toán…"
            onKeyDown={e => { if (e.key === 'Enter') handleReturn() }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnOpen(false)}>Huỷ</Button>
            <Button onClick={handleReturn} disabled={!returnReason.trim()}>
              <RotateCcw className="h-4 w-4" /> Trả lại
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryRow({ label, value, tabular, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border pb-1 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm ${tabular ? 'tabular-nums' : ''} ${strong ? 'font-semibold text-primary' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function FieldInput({ label, value, onChange, placeholder }) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="h-8 text-sm" />
    </label>
  )
}
