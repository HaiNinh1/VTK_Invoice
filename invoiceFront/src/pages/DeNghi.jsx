import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Search, Eye, FileCheck2, Undo2, ShieldCheck, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatVND, formatDate } from '@/components/shared/formatters'
import { useRequests } from '@/context/RequestsContext'
import { useContracts } from '@/context/ContractsContext'
import { useInvoiceTypes } from '@/context/InvoiceTypesContext'
import { useRole } from '@/context/RoleContext'
import { useToast } from '@/components/ui/toast'
import { useNotifications } from '@/context/NotificationsContext'

/* -----------------------------------------------------------------------
 * Trang Đề nghị xuất HĐ — Prompt 5 + 6 + 13 + 15 + 16-revised.
 *
 * Tabs (5):
 *   Đang xử lý     — Nháp + Chờ duyệt + Trả lại bổ sung  (có nút Thu hồi)
 *   Chờ xuất HĐ    — Đã duyệt (preview + xác nhận xuất)  ← Prompt 13
 *   Hồ sơ pháp lý  — tổng hợp checklist pháp lý theo HĐ   ← Prompt 16 revised
 *   Đã xuất        — Đã xuất HĐ
 *   Từ chối        — Từ chối
 * --------------------------------------------------------------------- */

const TAB_GROUPS = {
  'dang-xu-ly':    ['Nháp', 'Chờ duyệt', 'Trả lại bổ sung'],
  'cho-xuat':      ['Đã duyệt'],
  'da-xuat':       ['Đã xuất HĐ'],
  'tu-choi':       ['Từ chối'],
}
const DEPT_OPTIONS = ['Tất cả', 'KV1', 'KV2', 'KV3', 'KV4', 'KV5', 'DL', 'DDL']

export default function DeNghi() {
  const { user, role } = useRole()
  const { requests, recallRequest, exportRequest } = useRequests()
  const { toast } = useToast()
  const { pushNotification } = useNotifications()
  const [tab, setTab] = useState('dang-xu-ly')
  const [query, setQuery] = useState('')
  const [dept, setDept] = useState('Tất cả')

  // Modals
  const [previewReq, setPreviewReq] = useState(null)
  const [confirmExport, setConfirmExport] = useState(null)
  const [confirmRecall, setConfirmRecall] = useState(null)

  // Role-based base scoping per spec Prompt 5
  const allRequests = useMemo(() => {
    if (role === 'accountant' || role === 'admin') return requests
    if (role === 'manager') return requests.filter(r => r.department === user.department)
    return requests.filter(r => r.createdById === user.id)
  }, [requests, role, user])
  const canSeeLegalTab = role === 'accountant' || role === 'manager' || role === 'admin'
  const showCreatorCol = role !== 'employee'

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const allowed = TAB_GROUPS[tab]
    return allRequests.filter(r => {
      if (allowed && !allowed.includes(r.status)) return false
      if (dept !== 'Tất cả' && r.department !== dept) return false
      if (q && !(
        r.id.toLowerCase().includes(q) ||
        r.contractNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q)
      )) return false
      return true
    })
  }, [allRequests, tab, query, dept])

  // Pagination 10/page
  const PAGE_SIZE = 10
  const [page, setPage] = useState(1)
  // Reset to page 1 when tab/query/dept changes
  useMemo(() => { setPage(1) }, [tab, query, dept])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts = useMemo(() => ({
    'dang-xu-ly': allRequests.filter(r => TAB_GROUPS['dang-xu-ly'].includes(r.status)).length,
    'cho-xuat':   allRequests.filter(r => TAB_GROUPS['cho-xuat'].includes(r.status)).length,
    'da-xuat':    allRequests.filter(r => TAB_GROUPS['da-xuat'].includes(r.status)).length,
    'tu-choi':    allRequests.filter(r => TAB_GROUPS['tu-choi'].includes(r.status)).length,
  }), [allRequests])

  async function doRecall(req) {
    const res = await recallRequest(req.id, user.id)
    if (!res.ok) {
      toast.error(res.reason ?? 'Không thể thu hồi')
      return
    }
    pushNotification({
      kind: 'system',
      title: `ĐN đã thu hồi: ${req.id}`,
      description: `${req.customerName} — ${user?.name ?? 'Nhân viên'} đã thu hồi`,
      to: `/de-nghi/${req.id}`,
    })
    toast.success(`Đã thu hồi ${req.id} — chuyển về Nháp`)
  }

  async function doExport(req) {
    const res = await exportRequest(req.id)
    if (!res.ok) {
      toast.error(res.reason ?? 'Không thể xuất HĐ')
      return
    }
    pushNotification({
      kind: 'export',
      title: `Đã xuất HĐ: ${res.sInvoiceNumber}`,
      description: `${req.customerName} — ${formatVND(req.valueAfterVAT)}`,
      to: `/de-nghi/${req.id}`,
    })
    toast.success(`Đã xuất HĐ ${res.sInvoiceNumber}`)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold page-title">Đề nghị xuất hoá đơn</h1>
        <Button asChild>
          <Link to="/de-nghi/moi">
            <Plus className="h-4 w-4" /> Tạo đề nghị
          </Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="dang-xu-ly">Đang xử lý ({counts['dang-xu-ly']})</TabsTrigger>
          <TabsTrigger value="cho-xuat">Chờ xuất HĐ ({counts['cho-xuat']})</TabsTrigger>
          {canSeeLegalTab && (
            <TabsTrigger value="ho-so-phap-ly">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Hồ sơ pháp lý
              </span>
            </TabsTrigger>
          )}
          <TabsTrigger value="da-xuat">Đã xuất ({counts['da-xuat']})</TabsTrigger>
          <TabsTrigger value="tu-choi">Từ chối ({counts['tu-choi']})</TabsTrigger>
        </TabsList>

        {/* ----- Filters for list tabs ----- */}
        {tab !== 'cho-xuat' && tab !== 'ho-so-phap-ly' && (
          <ListFilters query={query} setQuery={setQuery} dept={dept} setDept={setDept} />
        )}
        {tab === 'cho-xuat' && (
          <ListFilters query={query} setQuery={setQuery} dept={dept} setDept={setDept} />
        )}

        {/* ----- Tab content: list-style tabs ----- */}
        <TabsContent value="dang-xu-ly">
          <RequestTable
            rows={paged}
            currentUserId={user.id}
            onRecall={r => setConfirmRecall(r)}
            showCreatorCol={showCreatorCol}
          />
          <Pagination page={page} setPage={setPage} totalPages={totalPages} totalRows={filtered.length} />
        </TabsContent>

        <TabsContent value="cho-xuat">
          <PendingExportCards
            rows={paged}
            onPreview={r => setPreviewReq(r)}
            onConfirmExport={r => setConfirmExport(r)}
          />
          <Pagination page={page} setPage={setPage} totalPages={totalPages} totalRows={filtered.length} />
        </TabsContent>

        {canSeeLegalTab && (
          <TabsContent value="ho-so-phap-ly">
            <LegalDossiersTab />
          </TabsContent>
        )}

        <TabsContent value="da-xuat">
          <RequestTable rows={paged} currentUserId={user.id} onRecall={null} showCreatorCol={showCreatorCol} />
          <Pagination page={page} setPage={setPage} totalPages={totalPages} totalRows={filtered.length} />
        </TabsContent>

        <TabsContent value="tu-choi">
          <RequestTable rows={paged} currentUserId={user.id} onRecall={null} showCreatorCol={showCreatorCol} />
          <Pagination page={page} setPage={setPage} totalPages={totalPages} totalRows={filtered.length} />
        </TabsContent>
      </Tabs>

      <InvoicePreviewModal req={previewReq} onClose={() => setPreviewReq(null)} />

      <ConfirmModal
        open={!!confirmExport}
        onOpenChange={(o) => !o && setConfirmExport(null)}
        title="Xác nhận xuất hoá đơn?"
        description={confirmExport
          ? `Sẽ phát hành hoá đơn điện tử cho đề nghị ${confirmExport.id} - ${confirmExport.customerName}. Hành động không thể hoàn tác.`
          : ''}
        confirmLabel="Xuất hoá đơn"
        onConfirm={() => { if (confirmExport) doExport(confirmExport) }}
      />
      <ConfirmModal
        open={!!confirmRecall}
        onOpenChange={(o) => !o && setConfirmRecall(null)}
        title="Thu hồi đề nghị?"
        description={confirmRecall
          ? `Đề nghị ${confirmRecall.id} sẽ được chuyển về trạng thái Nháp để bạn chỉnh sửa.`
          : ''}
        confirmLabel="Thu hồi"
        confirmVariant="destructive"
        onConfirm={() => { if (confirmRecall) doRecall(confirmRecall) }}
      />


    </div>
  )
}

/* ============================== HELPERS ============================== */

function ListFilters({ query, setQuery, dept, setDept }) {
  return (
    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Tìm mã đề nghị, số HĐ, CĐT..."
          aria-label="Tìm đề nghị"
          className="pl-9"
        />
      </div>
      <Select value={dept} onValueChange={setDept}>
        <SelectTrigger className="w-full sm:w-[160px]" aria-label="Lọc theo đơn vị">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DEPT_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}

function Pagination({ page, setPage, totalPages, totalRows }) {
  if (totalRows === 0) return null
  return (
    <div className="mt-3 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">Trang {page}/{totalPages} · {totalRows} đề nghị</span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
          Trước
        </Button>
        <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
          Sau
        </Button>
      </div>
    </div>
  )
}

function RequestTable({ rows, currentUserId, onRecall, showCreatorCol }) {
  return (
    <>
      <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
        {rows.length} đề nghị
      </p>
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Mã đề nghị</th>
                <th className="px-4 py-3">Hợp đồng</th>
                <th className="px-4 py-3">CĐT</th>
                <th className="px-4 py-3 text-right">Giá trị</th>
                <th className="px-4 py-3">Đơn vị</th>
                {showCreatorCol && <th className="px-4 py-3">Người tạo</th>}
                <th className="px-4 py-3">Pháp lý</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link to={`/de-nghi/${r.id}`} className="font-medium text-primary hover:underline">{r.id}</Link>
                    <div className="text-xs text-muted-foreground">{formatDate(r.createdDate)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.contractNumber}</div>
                    <div className="text-xs text-muted-foreground">{r.serviceType}</div>
                  </td>
                  <td className="px-4 py-3">{r.customerName}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatVND(r.valueAfterVAT, true)}</td>
                  <td className="px-4 py-3">{r.department}</td>
                  {showCreatorCol && <td className="px-4 py-3">{r.createdBy}</td>}
                  <td className="px-4 py-3">
                    {r.legalChecklist ? (
                      <span className={r.legalChecklist.checked === r.legalChecklist.total ? 'text-green-700 font-medium' : 'text-amber-700 font-medium'}>
                        {r.legalChecklist.checked}/{r.legalChecklist.total}
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {onRecall && r.status === 'Chờ duyệt' && r.createdById === currentUserId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRecall(r)}
                        className="text-amber-700 hover:bg-amber-50"
                      >
                        <Undo2 className="h-3.5 w-3.5" /> Thu hồi
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={showCreatorCol ? 9 : 8} className="px-4 py-12 text-center text-muted-foreground">
                    Không có đề nghị phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {rows.map(r => (
          <Card key={r.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <Link to={`/de-nghi/${r.id}`} className="min-w-0">
                  <div className="truncate font-semibold text-primary">{r.id}</div>
                  <div className="truncate text-sm">{r.customerName}</div>
                </Link>
                <StatusBadge status={r.status} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{r.contractNumber}</span>
                <span className="font-medium tabular-nums">{formatVND(r.valueAfterVAT, true)}</span>
              </div>
              {onRecall && r.status === 'Chờ duyệt' && r.createdById === currentUserId && (
                <Button size="sm" variant="outline" className="w-full" onClick={() => onRecall(r)}>
                  <Undo2 className="h-3.5 w-3.5" /> Thu hồi
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 && (
          <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Không có đề nghị phù hợp.</CardContent></Card>
        )}
      </div>
    </>
  )
}

function PendingExportCards({ rows, onPreview, onConfirmExport }) {
  return (
    <>
      <p className="mt-3 text-sm text-muted-foreground">
        {rows.length} đề nghị đã duyệt — sẵn sàng xuất hoá đơn điện tử
      </p>
      {rows.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          Không có đề nghị nào đang chờ xuất HĐ.
        </CardContent></Card>
      )}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(r => (
          <Card key={r.id} className="transition-shadow hover:shadow-md">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link to={`/de-nghi/${r.id}`} className="block truncate font-semibold text-primary hover:underline">
                    {r.id}
                  </Link>
                  <div className="truncate text-xs text-muted-foreground">{r.contractNumber}</div>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="space-y-1 text-sm">
                <Row label="CĐT" value={r.customerName} />
                <Row label="Loại DV" value={r.serviceType} />
                <Row label="Đợt thanh toán" value={r.paymentTerm} />
                <Row label="Đơn vị" value={r.department} />
                <Row label="Tổng tiền" value={<span className="font-semibold tabular-nums">{formatVND(r.valueAfterVAT)}</span>} />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => onPreview(r)} className="flex-1">
                  <Eye className="h-3.5 w-3.5" /> Xem trước
                </Button>
                <Button size="sm" onClick={() => onConfirmExport(r)} className="flex-1">
                  <FileCheck2 className="h-3.5 w-3.5" /> Xuất HĐ
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-right">{value}</span>
    </div>
  )
}

/* --------------- Hồ sơ pháp lý (Prompt 16 revised) -------------------- */
function LegalDossiersTab() {
  const { contracts } = useContracts()
  const { types } = useInvoiceTypes()

  const stats = useMemo(() => {
    const rows = contracts.map(c => {
      const typeCfg = types.find(t => t.serviceType === c.serviceType)
      const total = typeCfg
        ? typeCfg.documentGroups.reduce((s, g) => s + g.documents.length, 0)
        : c.totalDocs ?? 0
      const uploaded = Math.min(total, c.uploadedCount ?? 0)
      const pct = total ? Math.round((uploaded / total) * 100) : 0
      return { ...c, total, uploaded, pct }
    })
    const totalC = rows.length
    const completeC = rows.filter(r => r.pct === 100).length
    const incompleteC = totalC - completeC
    const avgPct = totalC ? Math.round(rows.reduce((s, r) => s + r.pct, 0) / totalC) : 0
    return { rows, totalC, completeC, incompleteC, avgPct }
  }, [contracts, types])

  const [filter, setFilter] = useState('all') // all | complete | incomplete
  const filteredRows = useMemo(() => {
    if (filter === 'complete')   return stats.rows.filter(r => r.pct === 100)
    if (filter === 'incomplete') return stats.rows.filter(r => r.pct < 100)
    return stats.rows
  }, [filter, stats.rows])

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard icon={ShieldCheck} label="Tổng HĐ" value={stats.totalC} tone="text-primary" />
        <StatCard icon={CheckCircle2} label="Hoàn thiện" value={stats.completeC} tone="text-green-600" />
        <StatCard icon={AlertTriangle} label="Còn thiếu" value={stats.incompleteC} tone="text-amber-600" />
        <StatCard icon={ShieldCheck} label="Trung bình" value={`${stats.avgPct}%`} tone="text-blue-600" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>Tất cả</FilterChip>
        <FilterChip active={filter === 'incomplete'} onClick={() => setFilter('incomplete')}>Còn thiếu</FilterChip>
        <FilterChip active={filter === 'complete'} onClick={() => setFilter('complete')}>Đã đủ hồ sơ</FilterChip>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Hợp đồng</th>
                <th className="px-4 py-3">CĐT</th>
                <th className="px-4 py-3">Loại DV</th>
                <th className="px-4 py-3">Tiến độ hồ sơ</th>
                <th className="px-4 py-3 text-right">% Hoàn thành</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRows.map(c => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link to={`/hop-dong/${c.id}`} className="font-medium text-primary hover:underline">
                      {c.contractNumber}
                    </Link>
                    <div className="text-xs text-muted-foreground">{formatDate(c.signDate)}</div>
                  </td>
                  <td className="px-4 py-3">{c.customerName}</td>
                  <td className="px-4 py-3">{c.serviceType}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Progress value={c.pct} className="h-2 w-32" />
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {c.uploaded}/{c.total}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant={c.pct === 100 ? 'success' : c.pct >= 50 ? 'warning' : 'destructive'}>
                      {c.pct}%
                    </Badge>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Không có hợp đồng phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className={`flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 ${tone}`} aria-hidden>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground hover:bg-accent/40'
      }`}
    >
      {children}
    </button>
  )
}

/* ----------------------- Invoice Preview Modal ----------------------- */
function InvoicePreviewModal({ req, onClose }) {
  return (
    <Dialog open={!!req} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        {req && (
          <>
            <DialogHeader>
              <DialogTitle>Xem trước hoá đơn — {req.id}</DialogTitle>
              <DialogDescription>
                Bản xem trước trước khi phát hành hoá đơn điện tử (demo).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 rounded-md border bg-card p-5 text-sm">
              <div className="border-b pb-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Mẫu số 01GTKT</div>
                <h3 className="text-lg font-semibold">HOÁ ĐƠN GIÁ TRỊ GIA TĂNG</h3>
                <div className="text-xs text-muted-foreground">Số hoá đơn: <span className="font-mono">[Sẽ cấp khi xuất]</span> · Ký hiệu: K26TYY</div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Đơn vị bán hàng">Tổng Công ty Cổ phần Công trình Viettel</Field>
                <Field label="Mã số thuế bên bán">0104753398</Field>
                <Field label="Đơn vị mua hàng">{req.customerName}</Field>
                <Field label="Mã số thuế bên mua">{req.customerTaxCode}</Field>
                <Field label="Địa chỉ" wide>{req.customerAddress}</Field>
              </div>

              <table className="w-full border-collapse text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="border px-2 py-1.5 text-left">Tên hàng hoá / dịch vụ</th>
                    <th className="border px-2 py-1.5 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-2 py-1.5">{req.serviceType} — HĐ {req.contractNumber} ({req.paymentTerm})</td>
                    <td className="border px-2 py-1.5 text-right tabular-nums">{formatVND(req.valueBeforeVAT)}</td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1.5 text-right text-muted-foreground">Thuế GTGT ({req.vatRate}%)</td>
                    <td className="border px-2 py-1.5 text-right tabular-nums">{formatVND(req.vatAmount)}</td>
                  </tr>
                  <tr className="font-semibold">
                    <td className="border px-2 py-1.5 text-right">Tổng cộng tiền thanh toán</td>
                    <td className="border px-2 py-1.5 text-right tabular-nums text-primary">{formatVND(req.valueAfterVAT)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <div>Email người nhận: <span className="font-medium text-foreground">{req.buyerEmail}</span></div>
                <div>Đơn vị tạo: <span className="font-medium text-foreground">{req.department}</span></div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Đóng</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children, wide }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-medium">{children}</div>
    </div>
  )
}
