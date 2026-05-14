import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Download } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatVND, formatDate } from '@/components/shared/formatters'
import { useContracts } from '@/context/ContractsContext'
import { cn } from '@/lib/utils'

/* -----------------------------------------------------------------------
 * Page: "Hợp đồng" — List view (Prompt 4 §LIST + Prompt 14 add-button).
 *
 * Desktop: simple table (NOT a complex data grid).
 *          Columns: Số HĐ | CĐT | Loại DV | Giá trị | Trạng thái | Hồ sơ
 *          "Hồ sơ" shows "5/11" with green if complete else amber/red.
 * Mobile : card list (per Prompt 11 §2 — tables become cards).
 * ----------------------------------------------------------------------- */

const STATUS_FILTERS = ['Tất cả', 'Đang thực hiện', 'Đã quyết toán', 'Đã thanh lý']

export default function HopDong() {
  const { contracts } = useContracts()
  const [query,  setQuery]  = useState('')
  const [status, setStatus] = useState('Tất cả')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return contracts.filter(c => {
      const matchesQuery =
        !q ||
        c.contractNumber.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q)
      const matchesStatus = status === 'Tất cả' || c.status === status
      return matchesQuery && matchesStatus
    })
  }, [contracts, query, status])

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Tìm số HĐ, tên CĐT..."
              aria-label="Tìm hợp đồng"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-[200px]" aria-label="Lọc theo trạng thái">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportContractsCSV(rows)}>
            <Download className="h-4 w-4" /> Xuất Excel
          </Button>
          <Button asChild>
            <Link to="/hop-dong/moi">
              <Plus className="h-4 w-4" /> Thêm hợp đồng mới
            </Link>
          </Button>
        </div>
      </div>

      {/* Result count */}
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {rows.length} hợp đồng
      </p>

      {/* Desktop table */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Số HĐ</th>
                <th className="px-4 py-3">CĐT</th>
                <th className="px-4 py-3">Loại DV</th>
                <th className="px-4 py-3 text-right">Giá trị</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Hồ sơ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map(c => <ContractRow key={c.id} c={c} />)}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    Không tìm thấy hợp đồng phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {rows.map(c => <ContractCard key={c.id} c={c} />)}
        {rows.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Không tìm thấy hợp đồng phù hợp.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

/* ---------------------------- Sub-components --------------------------- */

function DocProgress({ uploaded, total }) {
  const pct = total ? Math.round((uploaded / total) * 100) : 0
  const tone =
    pct >= 100 ? 'text-green-700' :
    pct >= 50  ? 'text-amber-700' :
                 'text-red-700'
  return (
    <span className={cn('font-medium tabular-nums', tone)}>
      {uploaded}/{total}
      {pct >= 100 && ' ✓'}
    </span>
  )
}

function ContractRow({ c }) {
  return (
    <tr className="hover:bg-muted/30">
      <td className="px-4 py-3">
        <Link
          to={`/hop-dong/${c.id}`}
          className="font-medium text-primary hover:underline focus-visible:underline"
        >
          {c.contractNumber}
        </Link>
        <div className="text-xs text-muted-foreground">
          Ký: {formatDate(c.signDate)}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="font-medium">{c.customerName}</div>
        <div className="text-xs text-muted-foreground">MST: {c.customerTaxCode}</div>
      </td>
      <td className="px-4 py-3">{c.serviceType}</td>
      <td className="px-4 py-3 text-right tabular-nums">
        {formatVND(c.totalValue, true)}
      </td>
      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
      <td className="px-4 py-3">
        <DocProgress uploaded={c.uploadedCount} total={c.totalDocs} />
      </td>
    </tr>
  )
}

function ContractCard({ c }) {
  return (
    <Link to={`/hop-dong/${c.id}`} className="block">
      <Card className="transition-shadow active:shadow-md">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-semibold text-primary">{c.contractNumber}</div>
              <div className="truncate text-sm">{c.customerName}</div>
            </div>
            <StatusBadge status={c.status} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{c.serviceType}</span>
            <span className="font-medium">{formatVND(c.totalValue, true)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Ký: {formatDate(c.signDate)}</span>
            <DocProgress uploaded={c.uploadedCount} total={c.totalDocs} />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}


/* ----- Xuất Excel (CSV UTF-8 BOM để Excel mở đúng tiếng Việt) ----- */
function exportContractsCSV(rows) {
  const headers = ['Số HĐ', 'CDT', 'MST', 'Loại DV', 'Ngày ký', 'Giá trị', 'Trạng thái', 'Hồ sơ']
  const esc = v => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.join(',')]
  for (const c of rows) {
    lines.push([
      esc(c.contractNumber),
      esc(c.customerName),
      esc(c.customerTaxCode),
      esc(c.serviceType),
      esc(c.signDate),
      esc(c.totalValue),
      esc(c.status),
      esc(`${c.uploadedCount}/${c.totalDocs}`),
    ].join(','))
  }
  const csv = '\uFEFF' + lines.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `hop-dong-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}