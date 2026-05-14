import { useEffect, useMemo, useState } from 'react'
import { Search, Download, RefreshCw, AlertCircle, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatVND, formatDate } from '@/components/shared/formatters'
import { useRequests } from '@/context/RequestsContext'
import { useToast } from '@/components/ui/toast'

/* -----------------------------------------------------------------------
 * S-Invoice — Spec Prompt 8.
 *
 * Spec: 4 trạng thái S-Invoice gateway:
 *   Chờ xuất    — đã duyệt nhưng chưa export (KHÔNG hiển thị ở đây, đã có ở
 *                 trang Đề nghị tab "Chờ xuất HĐ" — theo Prompt 13 split)
 *   Đang xử lý  — đã export, đang chờ gateway phản hồi
 *   Thành công  — gateway trả về số hoá đơn + mã CQT
 *   Lỗi        — gateway lỗi, có thể thử lại
 *
 * Auto-refresh toggle default OFF (spec).
 * Tabs: Đang xử lý | Thành công | Lỗi | Tất cả
 * Modal: error detail (Lỗi), invoice detail (Thành công).
 * --------------------------------------------------------------------- */

const TABS = [
  { value: 'dang-xu-ly', label: 'Đang xử lý', match: r => r.status === 'Đã xuất HĐ' && r.sInvoiceStatus === 'Đang xử lý' },
  { value: 'thanh-cong', label: 'Thành công', match: r => r.status === 'Đã xuất HĐ' && (r.sInvoiceStatus === 'Thành công' || !r.sInvoiceStatus) },
  { value: 'loi',        label: 'Lỗi',        match: r => r.status === 'Đã xuất HĐ' && r.sInvoiceStatus === 'Lỗi' },
  { value: 'tat-ca',     label: 'Tất cả',     match: r => r.status === 'Đã xuất HĐ' },
]

function sInvoiceStatusBadge(r) {
  if (r.sInvoiceStatus === 'Lỗi') return <Badge variant="destructive">Lỗi</Badge>
  if (r.sInvoiceStatus === 'Đang xử lý') return <Badge variant="warning">Đang xử lý</Badge>
  return <Badge variant="success">Thành công</Badge>
}

export default function SInvoice() {
  const [tab, setTab] = useState('thanh-cong')
  const [query, setQuery] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [detailReq, setDetailReq] = useState(null)
  const [errorReq, setErrorReq] = useState(null)
  const { toast } = useToast()
  const { requests, retryExport } = useRequests()

  // Auto-refresh tick: re-sync mỗi 10s khi bật. Demo: chỉ trigger toast.
  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => {
      // In real backend, fetch updated statuses. Demo no-op.
    }, 10000)
    return () => clearInterval(id)
  }, [autoRefresh])

  const rows = useMemo(() => {
    const t = TABS.find(x => x.value === tab)
    const q = query.trim().toLowerCase()
    return requests
      .filter(t.match)
      .filter(r => !q || r.id.toLowerCase().includes(q)
        || (r.sInvoiceNumber ?? '').toLowerCase().includes(q)
        || r.customerName.toLowerCase().includes(q))
  }, [tab, query, requests])

  const counts = useMemo(
    () => Object.fromEntries(TABS.map(t => [t.value, requests.filter(t.match).length])),
    [requests],
  )

  function handleRetry(r) {
    retryExport(r.id)
    toast.success(`Đã thử lại — ${r.id}`)
    setErrorReq(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold page-title">S-Invoice</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Đồng bộ trạng thái phát hành hoá đơn điện tử qua cổng Viettel S-Invoice.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="h-4 w-4"
            />
            Tự động làm mới
          </label>
          <Button variant="outline" onClick={() => toast.success('Đã đồng bộ trạng thái (demo)')}>
            <RefreshCw className="h-4 w-4" /> Đồng bộ
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          {TABS.map(t => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label} ({counts[t.value]})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Tìm số HĐ điện tử, mã đề nghị, CĐT..."
          aria-label="Tìm hoá đơn"
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Số HĐ điện tử</th>
                <th className="px-4 py-3">Mã CQT</th>
                <th className="px-4 py-3">Mã đề nghị</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3 text-right">Tổng tiền</th>
                <th className="px-4 py-3">Ngày phát hành</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{r.sInvoiceNumber ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.sInvoiceTaxCode ?? '—'}</td>
                  <td className="px-4 py-3">{r.id}</td>
                  <td className="px-4 py-3">{r.customerName}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatVND(r.valueAfterVAT, true)}</td>
                  <td className="px-4 py-3">{formatDate(r.exportedAt ?? r.approvedDate)}</td>
                  <td className="px-4 py-3">{sInvoiceStatusBadge(r)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      {r.sInvoiceStatus === 'Lỗi' ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => setErrorReq(r)} className="text-destructive">
                            <AlertCircle className="h-4 w-4" /> Xem lỗi
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRetry(r)}>
                            <RefreshCw className="h-4 w-4" /> Thử lại
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => setDetailReq(r)}>
                            <Eye className="h-4 w-4" /> Chi tiết
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={!r.sInvoiceNumber}
                            onClick={() => toast.success(`Tải PDF ${r.sInvoiceNumber} (demo)`)}
                          >
                            <Download className="h-4 w-4" /> PDF
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    Không có hoá đơn phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail modal */}
      <Dialog open={!!detailReq} onOpenChange={(o) => !o && setDetailReq(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết hoá đơn điện tử</DialogTitle>
            <DialogDescription>
              {detailReq ? `${detailReq.sInvoiceNumber} — ${detailReq.customerName}` : ''}
            </DialogDescription>
          </DialogHeader>
          {detailReq && (
            <div className="space-y-2 text-sm">
              <Row label="Số HĐ điện tử" value={<span className="font-mono">{detailReq.sInvoiceNumber}</span>} />
              <Row label="Mã CQT" value={<span className="font-mono">{detailReq.sInvoiceTaxCode}</span>} />
              <Row label="Khách hàng" value={detailReq.customerName} />
              <Row label="MST" value={detailReq.customerTaxCode} />
              <Row label="Đề nghị" value={detailReq.id} />
              <Row label="Hợp đồng" value={detailReq.contractNumber} />
              <Row label="Tổng tiền" value={<span className="font-semibold">{formatVND(detailReq.valueAfterVAT)}</span>} />
              <Row label="Ngày phát hành" value={formatDate(detailReq.exportedAt ?? detailReq.approvedDate)} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailReq(null)}>Đóng</Button>
            {detailReq && (
              <Button onClick={() => toast.success(`Tải PDF ${detailReq.sInvoiceNumber} (demo)`)}>
                <Download className="h-4 w-4" /> Tải PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error modal */}
      <Dialog open={!!errorReq} onOpenChange={(o) => !o && setErrorReq(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" /> Lỗi phát hành hoá đơn
            </DialogTitle>
            <DialogDescription>
              {errorReq ? `${errorReq.id} — ${errorReq.customerName}` : ''}
            </DialogDescription>
          </DialogHeader>
          {errorReq && (
            <div className="space-y-3 text-sm">
              <div className="rounded border border-red-200 bg-red-50 p-3 text-red-900">
                <div className="font-semibold mb-1">Thông báo từ S-Invoice:</div>
                <div className="font-mono text-xs">{errorReq.sInvoiceError ?? 'Lỗi không xác định'}</div>
              </div>
              <p className="text-muted-foreground">
                Bạn có thể nhấn <span className="font-semibold">Thử lại</span> để gửi lại yêu cầu phát hành.
                Nếu lỗi vẫn tiếp diễn, liên hệ IT để kiểm tra cấu hình cổng kết nối.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setErrorReq(null)}>Đóng</Button>
            {errorReq && (
              <Button onClick={() => handleRetry(errorReq)}>
                <RefreshCw className="h-4 w-4" /> Thử lại
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed border-border pb-1 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}
