import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatVND, formatDate } from '@/components/shared/formatters'
import { INVOICE_REQUESTS } from '@/data/masterData'

/* -----------------------------------------------------------------------
 * Page: "Đề nghị xuất HĐ" — List
 * Spec: Prompt 5 (list) + Prompt 6 (CTA → form) + Prompt 13 (status tabs).
 *
 * Tabs filter by status group:
 *   Đang xử lý  = Nháp + Chờ duyệt + Trả lại bổ sung
 *   Đã duyệt    = Đã duyệt + Đã xuất HĐ
 *   Từ chối     = Từ chối
 *   Tất cả      = no filter
 * --------------------------------------------------------------------- */

const TAB_GROUPS = {
  'dang-xu-ly': ['Nháp', 'Chờ duyệt', 'Trả lại bổ sung'],
  'da-duyet':   ['Đã duyệt', 'Đã xuất HĐ'],
  'tu-choi':    ['Từ chối'],
  'tat-ca':     null,
}

const DEPT_OPTIONS = ['Tất cả', 'KV1', 'KV2', 'KV3', 'KV4', 'KV5', 'DL', 'DDL']

export default function DeNghi() {
  const [tab,   setTab]   = useState('dang-xu-ly')
  const [query, setQuery] = useState('')
  const [dept,  setDept]  = useState('Tất cả')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const allowed = TAB_GROUPS[tab]
    return INVOICE_REQUESTS.filter(r => {
      if (allowed && !allowed.includes(r.status)) return false
      if (dept !== 'Tất cả' && r.department !== dept) return false
      if (q && !(
        r.id.toLowerCase().includes(q) ||
        r.contractNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q)
      )) return false
      return true
    })
  }, [tab, query, dept])

  const counts = useMemo(() => ({
    'dang-xu-ly': INVOICE_REQUESTS.filter(r => TAB_GROUPS['dang-xu-ly'].includes(r.status)).length,
    'da-duyet':   INVOICE_REQUESTS.filter(r => TAB_GROUPS['da-duyet'].includes(r.status)).length,
    'tu-choi':    INVOICE_REQUESTS.filter(r => TAB_GROUPS['tu-choi'].includes(r.status)).length,
    'tat-ca':     INVOICE_REQUESTS.length,
  }), [])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold page-title">Đề nghị xuất hoá đơn</h1>
        <Button asChild>
          <Link to="/de-nghi/moi">
            <Plus className="h-4 w-4" /> Tạo đề nghị
          </Link>
        </Button>
      </div>

      {/* Status tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="dang-xu-ly">Đang xử lý ({counts['dang-xu-ly']})</TabsTrigger>
          <TabsTrigger value="da-duyet">Đã duyệt ({counts['da-duyet']})</TabsTrigger>
          <TabsTrigger value="tu-choi">Từ chối ({counts['tu-choi']})</TabsTrigger>
          <TabsTrigger value="tat-ca">Tất cả ({counts['tat-ca']})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
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
            {DEPT_OPTIONS.map(d => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {rows.length} đề nghị
      </p>

      {/* Desktop table */}
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
                <th className="px-4 py-3">Người tạo</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map(r => <RequestRow key={r.id} r={r} />)}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Không có đề nghị phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {rows.map(r => <RequestCard key={r.id} r={r} />)}
        {rows.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Không có đề nghị phù hợp.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function RequestRow({ r }) {
  return (
    <tr className="hover:bg-muted/30">
      <td className="px-4 py-3">
        <Link
          to={`/de-nghi/${r.id}`}
          className="font-medium text-primary hover:underline focus-visible:underline"
        >
          {r.id}
        </Link>
        <div className="text-xs text-muted-foreground">{formatDate(r.createdDate)}</div>
      </td>
      <td className="px-4 py-3">
        <div className="font-medium">{r.contractNumber}</div>
        <div className="text-xs text-muted-foreground">{r.serviceType}</div>
      </td>
      <td className="px-4 py-3">{r.customerName}</td>
      <td className="px-4 py-3 text-right tabular-nums">{formatVND(r.valueAfterVAT, true)}</td>
      <td className="px-4 py-3">{r.department}</td>
      <td className="px-4 py-3">{r.createdBy}</td>
      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
    </tr>
  )
}

function RequestCard({ r }) {
  return (
    <Link to={`/de-nghi/${r.id}`} className="block">
      <Card className="transition-shadow active:shadow-md">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-semibold text-primary">{r.id}</div>
              <div className="truncate text-sm">{r.customerName}</div>
            </div>
            <StatusBadge status={r.status} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{r.contractNumber}</span>
            <span className="font-medium tabular-nums">{formatVND(r.valueAfterVAT, true)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{r.createdBy} · {r.department}</span>
            <span>{formatDate(r.createdDate)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
