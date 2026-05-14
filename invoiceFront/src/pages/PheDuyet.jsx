import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Inbox, RotateCcw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { useToast } from '@/components/ui/toast'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatVND, formatDate } from '@/components/shared/formatters'
import { INVOICE_REQUESTS } from '@/data/masterData'
import { useRole } from '@/context/RoleContext'

/* -----------------------------------------------------------------------
 * Page: "Phê duyệt"  — Spec: Prompt 7.
 *
 * Two tabs:
 *   Chờ duyệt    → status === 'Chờ duyệt'  (actionable for accountant/manager)
 *   Đã xử lý     → status === 'Đã duyệt' | 'Từ chối' | 'Đã xuất HĐ'
 *
 * Master-detail layout:
 *   left  = list of requests
 *   right = summary card with Duyệt / Từ chối / Trả lại bổ sung actions
 *
 * Actions are mock — they alert and remove from local state.
 * --------------------------------------------------------------------- */

const TABS = {
  'cho-duyet': ['Chờ duyệt'],
  'da-xu-ly':  ['Đã duyệt', 'Từ chối', 'Đã xuất HĐ'],
}

export default function PheDuyet() {
  const { toast } = useToast()
  const [tab, setTab] = useState('cho-duyet')
  const [data, setData] = useState(INVOICE_REQUESTS)
  const [selectedId, setSelectedId] = useState(null)
  const [confirmApprove, setConfirmApprove] = useState(false)
  const [confirmReturn, setConfirmReturn] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const list = useMemo(
    () => data.filter(r => TABS[tab].includes(r.status)),
    [data, tab],
  )
  const selected = list.find(r => r.id === selectedId) ?? list[0] ?? null

  function applyStatus(newStatus, note) {
    setData(prev => prev.map(r =>
      r.id === selected.id ? { ...r, status: newStatus } : r,
    ))
    toast.success(`${selected.id}: ${newStatus}${note ? ` — ${note}` : ''} (demo)`)
    setSelectedId(null)
  }

  function handleApprove() {
    if (!selected) return
    applyStatus('Đã duyệt')
  }
  function handleReject() {
    if (!selected || !rejectReason.trim()) {
      toast.warning('Vui lòng nhập lý do từ chối')
      return
    }
    applyStatus('Từ chối', rejectReason.trim())
    setRejectOpen(false)
    setRejectReason('')
  }
  function handleReturn() {
    if (!selected) return
    applyStatus('Trả lại bổ sung')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Phê duyệt đề nghị</h1>
        {!canApprove && (
          <p className="text-sm text-muted-foreground">
            Bạn đang ở vai trò chỉ-xem. Đổi sang vai trò Kế toán/Quản lý để duyệt.
          </p>
        )}
      </div>

      <Tabs value={tab} onValueChange={v => { setTab(v); setSelectedId(null) }}>
        <TabsList>
          <TabsTrigger value="cho-duyet">
            Chờ duyệt ({data.filter(r => r.status === 'Chờ duyệt').length})
          </TabsTrigger>
          <TabsTrigger value="da-xu-ly">
            Đã xử lý ({data.filter(r => TABS['da-xu-ly'].includes(r.status)).length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
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
                {r.hasCommitment && (
                  <div className="mt-2 rounded border border-dashed border-orange-400 bg-orange-50 px-2 py-1 text-xs text-orange-900">
                    Có cam kết bổ sung — hạn {formatDate(r.commitmentDeadline)}
                  </div>
                )}
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
                  value={`${selected.legalChecklist.checked}/${selected.legalChecklist.total}`}
                />
                <div className="pt-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/de-nghi/${selected.id}`}>Xem đầy đủ</Link>
                  </Button>
                </div>
                {canApprove && selected.status === 'Chờ duyệt' && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button variant="outline" onClick={() => setConfirmReturn(true)}>
                      <RotateCcw className="h-4 w-4" /> Trả lại
                    </Button>
                    <Button variant="outline" onClick={() => setRejectOpen(true)}>
                      <XCircle className="h-4 w-4" /> Từ chối
                    </Button>
                    <Button className="col-span-2" onClick={() => setConfirmApprove(true)}>
                      <CheckCircle2 className="h-4 w-4" /> Duyệt
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      {/* Confirm: Approve */}
      <ConfirmModal
        open={confirmApprove}
        onOpenChange={setConfirmApprove}
        title="Xác nhận duyệt"
        description={selected ? `Duyệt đề nghị ${selected.id} — ${selected.customerName}?` : ''}
        confirmLabel="Duyệt"
        onConfirm={handleApprove}
      />

      {/* Confirm: Return for revision */}
      <ConfirmModal
        open={confirmReturn}
        onOpenChange={setConfirmReturn}
        title="Trả lại để bổ sung"
        description={selected ? `Yêu cầu bổ sung hồ sơ cho ${selected.id}?` : ''}
        confirmLabel="Trả lại"
        onConfirm={handleReturn}
      />

      {/* Reject dialog with reason */}
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
            <Button variant="destructive" onClick={handleReject}>
              <XCircle className="h-4 w-4" /> Từ chối
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
