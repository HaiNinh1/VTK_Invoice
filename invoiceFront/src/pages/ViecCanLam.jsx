import { Link } from 'react-router-dom'
import { ArrowRight, AlertTriangle, Clock } from 'lucide-react'
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
  return <EmployeeView user={user} departmentScope={role === 'manager'} />
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
