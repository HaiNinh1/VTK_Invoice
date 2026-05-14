import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { useContracts } from '@/context/ContractsContext'
import { INVOICE_TYPE_CONFIGS } from '@/data/masterData'
import { formatVND } from '@/components/shared/formatters'

/* -----------------------------------------------------------------------
 * Page: "Hợp đồng" — Form (Create + Edit).
 * Spec: Prompt 14 — full page (not modal), single column max 720px.
 *
 * Routes:
 *   /hop-dong/moi      → create new (id param === 'moi' or undefined)
 *   /hop-dong/:id/sua  → edit existing (id param is the contract id)
 * --------------------------------------------------------------------- */

const DEPARTMENTS = ['KV1', 'KV2', 'KV3', 'KV4', 'KV5', 'DL', 'DDL']
const CONTRACT_STATUSES = ['Đang thực hiện', 'Đã quyết toán', 'Đã thanh lý']
const CURRENCIES = ['VND', 'USD']

/** Service type options come from INVOICE_TYPE_CONFIGS (Prompt 12 link). */
const SERVICE_TYPES = INVOICE_TYPE_CONFIGS
  .filter(c => c.active !== false)
  .map(c => c.serviceType)

function validate(form) {
  const errors = {}
  if (!form.contractNumber.trim()) errors.contractNumber = 'Vui lòng nhập số hợp đồng'
  if (!form.serviceType) errors.serviceType = 'Chọn loại hợp đồng'
  if (!form.signDate) errors.signDate = 'Chọn ngày ký'
  if (!form.customerName.trim()) errors.customerName = 'Nhập tên CĐT'
  const tax = form.customerTaxCode.trim()
  if (!tax) errors.customerTaxCode = 'Nhập mã số thuế'
  else if (!/^\d{10}$|^\d{13}$/.test(tax)) errors.customerTaxCode = 'MST phải gồm 10 hoặc 13 chữ số'
  if (!form.customerAddress.trim()) errors.customerAddress = 'Nhập địa chỉ'
  if (form.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail))
    errors.customerEmail = 'Email không hợp lệ'
  const value = Number(form.totalValue)
  if (!Number.isFinite(value) || value <= 0) errors.totalValue = 'Giá trị HĐ phải lớn hơn 0'
  if (!form.department) errors.department = 'Chọn trung tâm doanh thu'
  return errors
}

export default function HopDongForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { contracts, addContract, updateContract, getContract } = useContracts()

  const isEdit = !!id && id !== 'moi'
  const existing = isEdit ? getContract(id) : null

  const [form, setForm] = useState(() => ({
    contractNumber:         existing?.contractNumber         ?? '',
    serviceType:            existing?.serviceType            ?? '',
    signDate:               existing?.signDate               ?? '',
    status:                 existing?.status                 ?? 'Đang thực hiện',
    customerName:           existing?.customerName           ?? '',
    customerTaxCode:        existing?.customerTaxCode        ?? '',
    customerAddress:        existing?.customerAddress        ?? '',
    customerRepresentative: existing?.customerRepresentative ?? '',
    customerEmail:          existing?.customerEmail          ?? '',
    customerPhone:          existing?.customerPhone          ?? '',
    totalValue:             existing?.totalValue             ?? '',
    currency:               existing?.currency               ?? 'VND',
    department:             existing?.department             ?? '',
    notes:                  existing?.notes                  ?? '',
  }))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Duplicate contractNumber guard (case-insensitive, ignore self in edit).
  const duplicateNumber = useMemo(() => {
    const n = form.contractNumber.trim().toLowerCase()
    if (!n) return false
    return contracts.some(c =>
      c.contractNumber.toLowerCase() === n && c.id !== existing?.id,
    )
  }, [form.contractNumber, contracts, existing?.id])

  // If edit but record not found → graceful fallback.
  if (isEdit && !existing) {
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

  function setField(name, value) {
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(e => { const n = { ...e }; delete n[name]; return n })
  }

  function handleSubmit(e) {
    e?.preventDefault?.()
    const errs = validate(form)
    if (duplicateNumber) errs.contractNumber = 'Số hợp đồng đã tồn tại'
    if (Object.keys(errs).length) {
      setErrors(errs)
      toast.error('Vui lòng kiểm tra lại các trường còn thiếu/sai')
      return
    }
    setSubmitting(true)
    try {
      if (isEdit) {
        updateContract(existing.id, form)
        toast.success(`Đã cập nhật hợp đồng ${existing.id}`)
        navigate(`/hop-dong/${existing.id}`)
      } else {
        const newId = addContract(form)
        toast.success(`Đã tạo hợp đồng ${newId}`)
        navigate(`/hop-dong/${newId}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const previewValue = Number(form.totalValue)

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild aria-label="Quay lại">
          <Link to={isEdit ? `/hop-dong/${existing.id}` : '/hop-dong'}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight page-title">
            {isEdit ? `Sửa hợp đồng ${existing.id}` : 'Thêm hợp đồng mới'}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isEdit
              ? 'Cập nhật thông tin hợp đồng. Hồ sơ đã tải lên không bị ảnh hưởng.'
              : 'Sau khi lưu, bạn sẽ được chuyển tới trang chi tiết để tải lên hồ sơ.'}
          </p>
        </div>
      </div>

      {/* Section: Thông tin hợp đồng */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin hợp đồng</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Số hợp đồng *" error={errors.contractNumber} className="sm:col-span-2">
            <Input
              value={form.contractNumber}
              onChange={e => setField('contractNumber', e.target.value)}
              placeholder="VD: 15/2025/HĐKT-VTK"
              aria-invalid={!!errors.contractNumber}
            />
          </Field>

          <Field label="Loại hợp đồng *" error={errors.serviceType}>
            <Select value={form.serviceType} onValueChange={v => setField('serviceType', v)}>
              <SelectTrigger aria-invalid={!!errors.serviceType}>
                <SelectValue placeholder="Chọn loại..." />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Ngày ký *" error={errors.signDate}>
            <Input
              type="date"
              value={form.signDate}
              onChange={e => setField('signDate', e.target.value)}
              aria-invalid={!!errors.signDate}
            />
          </Field>

          <Field label="Trạng thái">
            <Select value={form.status} onValueChange={v => setField('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTRACT_STATUSES.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      {/* Section: Khách hàng */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin khách hàng (CĐT)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Tên CĐT *" error={errors.customerName} className="sm:col-span-2">
            <Input
              value={form.customerName}
              onChange={e => setField('customerName', e.target.value)}
              placeholder="VD: Công ty TNHH ABC"
              aria-invalid={!!errors.customerName}
            />
          </Field>

          <Field label="Mã số thuế *" error={errors.customerTaxCode}>
            <Input
              value={form.customerTaxCode}
              onChange={e => setField('customerTaxCode', e.target.value.replace(/\D/g, ''))}
              placeholder="10 hoặc 13 chữ số"
              inputMode="numeric"
              maxLength={13}
              aria-invalid={!!errors.customerTaxCode}
            />
          </Field>

          <Field label="Người đại diện">
            <Input
              value={form.customerRepresentative}
              onChange={e => setField('customerRepresentative', e.target.value)}
              placeholder="VD: Nguyễn Văn A"
            />
          </Field>

          <Field label="Địa chỉ *" error={errors.customerAddress} className="sm:col-span-2">
            <textarea
              rows={2}
              value={form.customerAddress}
              onChange={e => setField('customerAddress', e.target.value)}
              placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
              aria-invalid={!!errors.customerAddress}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive"
            />
          </Field>

          <Field label="Email" error={errors.customerEmail}>
            <Input
              type="email"
              value={form.customerEmail}
              onChange={e => setField('customerEmail', e.target.value)}
              placeholder="ketoan@khachhang.vn"
              aria-invalid={!!errors.customerEmail}
            />
          </Field>

          <Field label="Số điện thoại">
            <Input
              type="tel"
              value={form.customerPhone}
              onChange={e => setField('customerPhone', e.target.value)}
              placeholder="VD: 024 1234 5678"
            />
          </Field>
        </CardContent>
      </Card>

      {/* Section: Giá trị */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Giá trị hợp đồng</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Giá trị hợp đồng *" error={errors.totalValue} className="sm:col-span-2">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={form.totalValue}
              onChange={e => setField('totalValue', e.target.value)}
              placeholder="0"
              aria-invalid={!!errors.totalValue}
            />
            {previewValue > 0 && (
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                ≈ {formatVND(previewValue)}
              </p>
            )}
          </Field>

          <Field label="Đơn vị tiền tệ">
            <Select value={form.currency} onValueChange={v => setField('currency', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Trung tâm doanh thu *" error={errors.department} className="sm:col-span-3">
            <Select value={form.department} onValueChange={v => setField('department', v)}>
              <SelectTrigger aria-invalid={!!errors.department}>
                <SelectValue placeholder="Chọn đơn vị..." />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      {/* Section: Ghi chú */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ghi chú</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            rows={3}
            value={form.notes}
            onChange={e => setField('notes', e.target.value)}
            placeholder="Thông tin bổ sung (tuỳ chọn)..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </CardContent>
      </Card>

      {/* Footer actions */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(isEdit ? `/hop-dong/${existing.id}` : '/hop-dong')}
        >
          Huỷ
        </Button>
        <Button type="submit" disabled={submitting}>
          <Save className="h-4 w-4" />
          {isEdit ? 'Cập nhật hợp đồng' : 'Lưu hợp đồng'}
        </Button>
      </div>
    </form>
  )
}

/* ---------------------------- Helpers ---------------------------- */

function Field({ label, error, children, className = '' }) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${className}`}>
      <span className="font-medium">{label}</span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  )
}
