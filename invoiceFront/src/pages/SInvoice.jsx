import { useMemo, useState } from 'react'
import { Search, Download, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatVND, formatDate } from '@/components/shared/formatters'
import { INVOICE_REQUESTS } from '@/data/masterData'
import { useToast } from '@/components/ui/toast'

/* -----------------------------------------------------------------------
 * Page: "S-Invoice" — Spec: Prompt 8.
 *
 * Read-only ledger of issued invoices (Đã xuất HĐ). Filtered tabs simulate
 * S-Invoice gateway statuses. Real integration would call Viettel S-Invoice
 * API and reconcile statuses; this view is the operator's reconciliation UI.
 * --------------------------------------------------------------------- */

const TABS = [
  { value: 'thanh-cong', label: 'Đã phát hành', match: r => r.status === 'Đã xuất HĐ' },
  { value: 'cho-xuat',   label: 'Chờ xuất',     match: r => r.status === 'Đã duyệt' },
  { value: 'loi',        label: 'Lỗi',          match: () => false },
  { value: 'tat-ca',     label: 'Tất cả',       match: () => true },
]

export default function SInvoice() {
  const [tab, setTab] = useState('thanh-cong')
  const [query, setQuery] = useState('')
  const { toast } = useToast()

  const rows = useMemo(() => {
    const t = TABS.find(x => x.value === tab)
    const q = query.trim().toLowerCase()
    return INVOICE_REQUESTS
      .filter(t.match)
      .filter(r => !q || r.id.toLowerCase().includes(q)
        || (r.sInvoiceNumber ?? '').toLowerCase().includes(q)
        || r.customerName.toLowerCase().includes(q))
  }, [tab, query])

  const counts = useMemo(
    () => Object.fromEntries(TABS.map(t => [t.value, INVOICE_REQUESTS.filter(t.match).length])),
    [],
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold page-title">S-Invoice</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Đồng bộ trạng thái phát hành hoá đơn điện tử qua cổng Viettel S-Invoice.
          </p>
        </div>
        <Button variant="outline" onClick={() => toast.success('Đã đồng bộ trạng thái (demo)')}>
          <RefreshCw className="h-4 w-4" /> Đồng bộ
        </Button>
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
                  <td className="px-4 py-3">{formatDate(r.approvedDate)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status === 'Đã xuất HĐ' ? 'Thành công' : r.status === 'Đã duyệt' ? 'Chờ xuất' : r.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!r.sInvoiceNumber}
                      onClick={() => toast.success(`Tải PDF ${r.sInvoiceNumber} (demo)`)}
                    >
                      <Download className="h-4 w-4" /> PDF
                    </Button>
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
    </div>
  )
}
