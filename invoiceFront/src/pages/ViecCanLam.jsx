import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, AlertTriangle, Clock, Download, FileSpreadsheet, TrendingUp,
} from 'lucide-react'
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatVND, formatDate } from '@/components/shared/formatters'
import { useRole } from '@/context/RoleContext'
import { INVOICE_REQUESTS } from '@/data/masterData'
import { cn } from '@/lib/utils'

/* -----------------------------------------------------------------------
 * Page: "Việc cần làm" (Home, Prompt 3).
 *
 * Design philosophy from spec:
 *   - This is NOT a dashboard. NO charts, NO stat cards with big numbers.
 *   - Just a to-do list. What does the user need to act on RIGHT NOW?
 *   - Empty sections are HIDDEN (not shown with "Không có dữ liệu").
 *   - Card backgrounds white, subtle border, 12px rounded, 16px padding.
 *
 * Sections vary by role. Accountant gets an approval queue at top.
 * ----------------------------------------------------------------------- */

export default function ViecCanLam() {
  const { role, user } = useRole()

  if (role === 'accountant') return <AccountantView />
  if (role === 'admin')      return <AccountantView />
}

/* ------------------------------ Helpers -------------------------------- */

function commitmentCountdown(deadlineISO) {
  if (!deadlineISO) return null
  const days = Math.ceil(
    (new Date(deadlineISO).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )
  if (days < 0)  return { label: `Quá hạn ${Math.abs(days)} ngày`, tone: 'destructive' }
  if (days <= 3) return { label: `Còn ${days} ngày`,               tone: 'warning'     }
  return                  { label: `Còn ${days} ngày`,               tone: 'success'     }
}

function Section({ title, count, viewAllHref, children, accent }) {
  return (
    <section aria-labelledby={`sec-${title}`} className="space-y-3">
      <div className="flex items-center justify-between">
        <h2
          id={`sec-${title}`}
          className={cn(
            'text-base md:text-lg font-semibold',
            accent && 'text-primary',
          )}
        >
          {title}
          {typeof count === 'number' && (
            <Badge variant="muted" className="ml-2 align-middle">
              {count}
            </Badge>
          )}
        </h2>
        {viewAllHref && (
          <Button asChild variant="link" className="h-auto p-0 text-sm">
            <Link to={viewAllHref}>
              Xem tất cả <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
      {children}
    </section>
  )
}

function RequestCard({ req }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-semibold tracking-tight">{req.id}</div>
            <div className="mt-1 truncate text-sm text-muted-foreground">
              {req.customerName}
            </div>
          </div>
          <StatusBadge status={req.status} />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-medium">{formatVND(req.valueAfterVAT, true)}</span>
          <span className="text-muted-foreground">{formatDate(req.createdDate)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

/* --------------------------- Employee view ----------------------------- */

function EmployeeView({ user, departmentScope }) {
  // Section 1: my (or my dept's) recent requests
  const myRequests = INVOICE_REQUESTS
    .filter(r =>
      departmentScope
        ? r.department === user.department
        : r.createdById === user.id,
    )
    .sort((a, b) => b.createdDate.localeCompare(a.createdDate))
    .slice(0, 5)

  // Section 2: drafts missing legal docs
  const needsDocs = INVOICE_REQUESTS.filter(
    r =>
      r.createdById === user.id &&
      r.status === 'Nháp' &&
      r.legalChecklist.checked < r.legalChecklist.total,
  )

  // Section 3: open commitments
  const commitments = INVOICE_REQUESTS.filter(
    r => r.createdById === user.id && r.hasCommitment,
  )

  const title = departmentScope
    ? `Việc cần làm — TT Khu vực ${user.department.slice(-1)}`
    : 'Việc cần làm'

  return (
    <div className="space-y-6 md:space-y-7">
      <div>
        <p className="text-sm text-muted-foreground">Xin chào, {user.name.split(' ').pop()}.</p>
        <h1 className="sr-only">{title}</h1>
      </div>

      {myRequests.length > 0 && (
        <Section title="Đề nghị của tôi" viewAllHref="/de-nghi">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myRequests.map(r => <RequestCard key={r.id} req={r} />)}
          </div>
        </Section>
      )}

      {needsDocs.length > 0 && (
        <Section title="Cần bổ sung hồ sơ" count={needsDocs.length}>
          <Card>
            <CardContent className="divide-y p-0">
              {needsDocs.map(r => {
                const missing = r.legalChecklist.total - r.legalChecklist.checked
                return (
                  <div key={r.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
                      <div className="min-w-0">
                        <div className="font-medium">{r.id}</div>
                        <div className="text-sm text-amber-700">
                          Thiếu {missing} hồ sơ
                        </div>
                      </div>
                    </div>
                    <Button asChild variant="link" className="h-auto p-0">
                      <Link to={`/de-nghi/${r.id}`}>
                        Bổ sung <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </Section>
      )}

      {commitments.length > 0 && (
        <Section title="Cam kết đang theo dõi" count={commitments.length}>
          <Card>
            <CardContent className="divide-y p-0">
              {commitments.map(r => {
                const cd = commitmentCountdown(r.commitmentDeadline)
                return (
                  <div key={r.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Clock className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                      <div className="min-w-0">
                        <div className="font-medium">{r.id}</div>
                        <div className="text-sm text-muted-foreground">
                          Hạn: {formatDate(r.commitmentDeadline)}
                        </div>
                      </div>
                    </div>
                    {cd && (
                      <Badge variant={cd.tone === 'destructive' ? 'destructive' : cd.tone === 'warning' ? 'warning' : 'success'}>
                        {cd.label}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </Section>
      )}

      {myRequests.length === 0 && needsDocs.length === 0 && commitments.length === 0 && (
        <EmptyState />
      )}
    </div>
  )
}

/* --------------------------- Accountant view --------------------------- */

function AccountantView() {
  return (
    <Tabs defaultValue="queue" className="space-y-5">
      <TabsList className="w-full justify-start sm:w-auto">
        <TabsTrigger value="queue">
          <Clock className="h-4 w-4" /> Hàng đợi
        </TabsTrigger>
        <TabsTrigger value="report">
          <TrendingUp className="h-4 w-4" /> Báo cáo
        </TabsTrigger>
      </TabsList>
      <TabsContent value="queue" className="mt-0">
        <AccountantQueue />
      </TabsContent>
      <TabsContent value="report" className="mt-0">
        <AccountantReport />
      </TabsContent>
    </Tabs>
  )
}

function AccountantQueue() {
  const pending = INVOICE_REQUESTS
    .filter(r => r.status === 'Chờ duyệt')
    .sort((a, b) => a.createdDate.localeCompare(b.createdDate))

  const recentApproved = INVOICE_REQUESTS
    .filter(r => r.status === 'Đã duyệt' || r.status === 'Đã xuất HĐ')
    .sort((a, b) => (b.approvedDate ?? '').localeCompare(a.approvedDate ?? ''))
    .slice(0, 5)

  return (
    <div className="space-y-7">
      <Section title={`Chờ tôi duyệt`} count={pending.length} accent>
        {pending.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Không có đề nghị nào đang chờ. 🎉
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pending.map(r => {
              const pct = Math.round(
                (r.legalChecklist.checked / r.legalChecklist.total) * 100,
              )
              const isComplete = pct === 100
              return (
                <Card
                  key={r.id}
                  className={cn(
                    'transition-shadow hover:shadow-md',
                    r.hasCommitment && 'border-l-4 border-l-orange-400',
                  )}
                >
                  <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{r.id}</span>
                        <StatusBadge status={r.status} />
                        {r.hasCommitment && (
                          <Badge variant="warning" className="text-[10px]">
                            Có cam kết
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {r.customerName}
                      </div>
                      <div className="mt-1 text-sm">
                        <span className="font-medium">{formatVND(r.valueAfterVAT, true)}</span>
                        <span className="mx-2 text-muted-foreground">·</span>
                        <span className={isComplete ? 'text-green-700' : 'text-amber-700'}>
                          Pháp lý {r.legalChecklist.checked}/{r.legalChecklist.total}
                        </span>
                      </div>
                    </div>
                    <Button asChild>
                      <Link to={`/phe-duyet/${r.id}`}>
                        Xem & Duyệt <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </Section>

      {recentApproved.length > 0 && (
        <Section title="Đã duyệt gần đây" viewAllHref="/phe-duyet">
          <Card>
            <CardContent className="divide-y p-0">
              {recentApproved.map(r => (
                <div key={r.id} className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <div className="font-medium">{r.id}</div>
                    <div className="truncate text-sm text-muted-foreground">
                      {r.customerName}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(r.approvedDate)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </Section>
      )}
    </div>
  )
}

/* --------------------------- Báo cáo tab ------------------------------ */

function AccountantReport() {
  const { toast } = useToast()
  const months = useMemo(() => {
    const set = new Set(INVOICE_REQUESTS.map(r => r.createdDate.slice(0, 7)))
    return Array.from(set).sort().reverse()
  }, [])
  const [month, setMonth] = useState(months[0] ?? 'all')

  const scoped = INVOICE_REQUESTS.filter(
    r => month === 'all' || r.createdDate.startsWith(month),
  )

  const totalValue   = scoped.reduce((s, r) => s + r.valueAfterVAT, 0)
  const issuedValue  = scoped
    .filter(r => r.status === 'Đã xuất HĐ')
    .reduce((s, r) => s + r.valueAfterVAT, 0)
  const pendingCount = scoped.filter(r => r.status === 'Chờ duyệt').length
  const rejectedCount = scoped.filter(r => r.status === 'Từ chối').length

  // by department
  const byDept = scoped.reduce((m, r) => {
    const k = r.department
    if (!m[k]) m[k] = { dept: k, count: 0, value: 0 }
    m[k].count++
    m[k].value += r.valueAfterVAT
    return m
  }, {})
  const deptRows = Object.values(byDept).sort((a, b) => b.value - a.value)

  function handleExport(format) {
    toast.success(`Đang xuất báo cáo ${format.toUpperCase()} · ${month === 'all' ? 'Tất cả' : month} (demo)`)
  }

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Kỳ báo cáo</span>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {months.map(m => (
                  <SelectItem key={m} value={m}>Tháng {m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => handleExport('excel')}>
              <FileSpreadsheet className="h-4 w-4" /> Xuất Excel
            </Button>
            <Button variant="outline" onClick={() => handleExport('pdf')}>
              <Download className="h-4 w-4" /> Xuất PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Tổng đề nghị" value={scoped.length} tone="brand" />
        <KpiTile label="Tổng giá trị" value={formatVND(totalValue, true)} />
        <KpiTile label="Đã xuất HĐ" value={formatVND(issuedValue, true)} tone="success" />
        <KpiTile label="Đang chờ / Từ chối" value={`${pendingCount} / ${rejectedCount}`} tone="warning" />
      </div>

      {/* By department */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theo đơn vị</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {deptRows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Không có dữ liệu.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">Đơn vị</th>
                    <th className="px-4 py-2 text-right font-medium">Số đề nghị</th>
                    <th className="px-4 py-2 text-right font-medium">Tổng giá trị</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {deptRows.map(r => (
                    <tr key={r.dept} className="transition-colors hover:bg-accent/40">
                      <td className="px-4 py-3 font-medium">{r.dept}</td>
                      <td className="px-4 py-3 text-right num text-muted-foreground">{r.count}</td>
                      <td className="px-4 py-3 text-right num font-semibold">{formatVND(r.value, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function KpiTile({ label, value, tone, delta }) {
  const toneClass =
    tone === 'success' ? 'text-emerald-700' :
    tone === 'warning' ? 'text-amber-700' :
    tone === 'brand'   ? 'text-primary'    : 'text-foreground'
  const deltaClass =
    delta && delta.startsWith('+') ? 'text-emerald-700' :
    delta && delta.startsWith('-') ? 'text-red-700' : 'text-muted-foreground'
  return (
    <Card accent>
      <CardContent className="p-5">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
        <div className={cn('mt-2 num text-3xl font-semibold leading-none tracking-tight', toneClass)}>{value}</div>
        {delta && (
          <div className={cn('mt-2 text-xs font-medium', deltaClass)}>{delta} so với kỳ trước</div>
        )}
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Bạn chưa có việc nào cần xử lý. Hãy quay lại sau.
        </p>
      </CardContent>
    </Card>
  )
}
