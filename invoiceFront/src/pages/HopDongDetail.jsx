import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileText, Download, Upload, Plus, Building2, Hash, Calendar,
  Banknote, Briefcase, MapPin, FilePlus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatVND, formatDate } from '@/components/shared/formatters'
import { CONTRACTS, INVOICE_REQUESTS, getChecklistForServiceType } from '@/data/masterData'
import { useToast } from '@/components/ui/toast'

/* -----------------------------------------------------------------------
 * Hợp đồng — detail page (read-only demo).
 *
 * Sections:
 *   1. Header: contract id + status badge + back/action buttons
 *   2. Thông tin chung: customer + dates + value + department
 *   3. Tiến độ hồ sơ pháp lý: progress bar + grouped checklist
 *   4. Đề nghị xuất HĐ liên quan: requests filtered by contractId
 * --------------------------------------------------------------------- */

export default function HopDongDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const contract = CONTRACTS.find(c => c.id === id)

  if (!contract) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Không tìm thấy hợp đồng <span className="font-mono">{id}</span>.
          </p>
          <Button asChild variant="link" className="mt-2">
            <Link to="/hop-dong">← Quay lại danh sách</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const requests = INVOICE_REQUESTS.filter(r => r.contractId === contract.id)
  const groups = getChecklistForServiceType(contract.serviceType)
  const totalDocs = contract.totalDocs
  const uploaded = contract.uploadedCount
  const pct = totalDocs ? Math.round((uploaded / totalDocs) * 100) : 0

  const uploadedByDocName = new Map(contract.documents.map(d => [d.name, d]))

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/hop-dong')}
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{contract.id}</h1>
              <Badge variant="muted" className="font-mono text-[11px]">
                {contract.contractNumber}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {contract.customerName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={contract.status} />
          <Button asChild>
            <Link to={`/de-nghi/moi?contract=${contract.id}`}>
              <FilePlus className="h-4 w-4" /> Tạo đề nghị xuất HĐ
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT — 2/3 */}
        <div className="space-y-6 lg:col-span-2">
          {/* General info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin chung</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoRow icon={Building2} label="Chủ đầu tư" value={contract.customerName} />
              <InfoRow icon={Hash}      label="Mã số thuế"  value={contract.customerTaxCode} mono />
              <InfoRow icon={MapPin}    label="Địa chỉ"     value={contract.customerAddress} span2 />
              <InfoRow icon={Briefcase} label="Loại dịch vụ" value={contract.serviceType} />
              <InfoRow icon={Building2} label="Đơn vị thực hiện" value={contract.department} />
              <InfoRow icon={Calendar}  label="Ngày ký"     value={formatDate(contract.signDate)} />
              <InfoRow icon={Banknote}  label="Tổng giá trị HĐ" value={formatVND(contract.totalValue)} />
            </CardContent>
          </Card>

          {/* Legal checklist */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Hồ sơ pháp lý</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.info('Mở hộp thoại tải lên (demo)')}
              >
                <Upload className="h-4 w-4" /> Tải lên
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className={pct === 100 ? 'text-green-700' : 'text-muted-foreground'}>
                    Đã tải lên {uploaded}/{totalDocs} tài liệu
                  </span>
                  <span className="font-medium">{pct}%</span>
                </div>
                <Progress value={pct} />
              </div>

              <Separator />

              {groups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Loại dịch vụ chưa cấu hình danh sách hồ sơ.
                </p>
              ) : (
                <div className="space-y-5">
                  {groups.map(g => (
                    <div key={g.groupName}>
                      <h3 className="mb-2 text-sm font-semibold">{g.groupName}</h3>
                      <ul className="space-y-2">
                        {g.documents.map(d => {
                          const file = uploadedByDocName.get(d.name)
                          return (
                            <li
                              key={d.id}
                              className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <FileText
                                  className={`h-4 w-4 shrink-0 ${file ? 'text-green-600' : 'text-muted-foreground'}`}
                                  aria-hidden
                                />
                                <div className="min-w-0">
                                  <div className="truncate text-sm">
                                    {d.name}
                                    {d.required && (
                                      <span className="ml-1 text-destructive" aria-hidden>*</span>
                                    )}
                                  </div>
                                  {file && (
                                    <div className="truncate text-xs text-muted-foreground">
                                      {file.fileName} · {formatDate(file.uploadDate)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {file ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toast.success(`Tải xuống ${file.fileName} (demo)`)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Badge variant="muted" className="text-[10px]">Chưa có</Badge>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — 1/3 */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Đề nghị liên quan</CardTitle>
              <Badge variant="muted">{requests.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {requests.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có đề nghị nào.
                </p>
              ) : (
                requests
                  .sort((a, b) => b.createdDate.localeCompare(a.createdDate))
                  .map(r => (
                    <Link
                      key={r.id}
                      to={`/de-nghi/${r.id}`}
                      className="block rounded-md border bg-card px-3 py-2.5 transition-colors hover:bg-accent/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold">{r.id}</span>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                        <span className="text-muted-foreground">
                          {formatDate(r.createdDate)}
                        </span>
                        <span className="font-medium">
                          {formatVND(r.valueAfterVAT, true)}
                        </span>
                      </div>
                    </Link>
                  ))
              )}
              <Button asChild variant="outline" className="mt-2 w-full">
                <Link to={`/de-nghi/moi?contract=${contract.id}`}>
                  <Plus className="h-4 w-4" /> Tạo đề nghị mới
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tóm tắt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Tổng giá trị HĐ" value={formatVND(contract.totalValue, true)} />
              <Row
                label="Đã đề nghị"
                value={formatVND(
                  requests.reduce((s, r) => s + r.valueAfterVAT, 0),
                  true,
                )}
              />
              <Row label="Số lần đề nghị" value={requests.length} />
              <Row
                label="Hồ sơ hoàn thiện"
                value={`${uploaded}/${totalDocs}`}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, mono, span2 }) {
  return (
    <div className={span2 ? 'sm:col-span-2' : ''}>
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </div>
      <div className={`mt-0.5 text-sm ${mono ? 'font-mono' : 'font-medium'}`}>
        {value}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
