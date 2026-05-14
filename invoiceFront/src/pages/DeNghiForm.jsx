import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, Send, CheckCircle2, Circle, Undo2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatVND } from '@/components/shared/formatters'
import { useRequests } from '@/context/RequestsContext'
import { useInvoiceTypes } from '@/context/InvoiceTypesContext'
import { useContracts } from '@/context/ContractsContext'
import { useRole } from '@/context/RoleContext'
import { useToast } from '@/components/ui/toast'
import { useNotifications } from '@/context/NotificationsContext'

/* -----------------------------------------------------------------------
 * Page: "Đề nghị xuất HĐ" — Form (Create + Detail/Edit)
 * Spec: Prompt 6 — 3-tab form, contract-driven document inheritance.
 *
 * Routes:
 *   /de-nghi/moi    → new draft, must pick a contract first
 *   /de-nghi/:id    → load existing request (read-only for non-draft)
 * --------------------------------------------------------------------- */

const PAYMENT_TERMS  = ['Tạm ứng', 'Đợt 1', 'Đợt 2', 'Đợt 3', 'Thanh toán cuối', '1 lần']
const INVOICE_KINDS  = ['Tạo mới', 'Điều chỉnh', 'Thay thế']
const PAYMENT_METHODS = ['Chuyển khoản', 'Tiền mặt', 'Bù trừ']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function DeNghiForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const { pushNotification } = useNotifications()
  const { contracts } = useContracts()
  const { user } = useRole()
  const { requests, addRequest, updateRequest, submitRequest, recallRequest } = useRequests()
  const { types } = useInvoiceTypes()
  const existing = id && id !== 'moi'
    ? requests.find(r => r.id === id)
    : null

  // Form state — dùng store thật thông qua addRequest/updateRequest
  const [contractId, setContractId] = useState(
    existing?.contractId ?? searchParams.get('contract') ?? '',
  )
  const [valueBeforeVAT, setValueBeforeVAT] = useState(existing?.valueBeforeVAT ?? 0)
  const [vatRate, setVatRate] = useState(existing?.vatRate ?? 10)
  const [paymentTerm, setPaymentTerm] = useState(existing?.paymentTerm ?? PAYMENT_TERMS[1])
  const [paymentMethod, setPaymentMethod] = useState(existing?.paymentMethod ?? PAYMENT_METHODS[0])
  const [invoiceKind, setInvoiceKind] = useState(existing?.invoiceType ?? INVOICE_KINDS[0])
  const [originalInvoiceNumber, setOriginalInvoiceNumber] = useState(existing?.originalInvoiceNumber ?? '')
  const [adjustmentReason, setAdjustmentReason] = useState(existing?.adjustmentReason ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [buyerEmail, setBuyerEmail] = useState(existing?.buyerEmail ?? '')
  const [emailError, setEmailError] = useState('')
  const [checked, setChecked] = useState(() => new Set())
  const [commitment, setCommitment] = useState(existing?.commitmentText ?? '')
  const [commitmentDeadline, setCommitmentDeadline] = useState(existing?.commitmentDeadline ?? '')
  const [tab, setTab] = useState('thong-tin')
  const [confirmRecall, setConfirmRecall] = useState(false)

  // Kết nối preselect query từ ?contract=
  useEffect(() => {
    if (!existing && !contractId && searchParams.get('contract')) {
      setContractId(searchParams.get('contract'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const contract = useMemo(
    () => contracts.find(c => c.id === contractId),
    [contracts, contractId],
  )
  const checklist = useMemo(() => {
    if (!contract) return []
    // Ưu tiên dynamic config từ InvoiceTypesContext, fallback static seed
    const cfg = types.find(t => t.serviceType === contract.serviceType)
    if (cfg?.documentGroups?.length) {
      return cfg.documentGroups.map(g => ({
        groupName: g.name ?? g.groupName,
        documents: g.documents.map(d => ({ id: d.id, name: d.name, required: d.required !== false })),
      }))
    }
    return []
  }, [contract, types])
  // Inherit checklist từ contract.documents — các tài liệu đã có file ở contract mặc định là checked + locked.
  // Match theo name (case-insensitive).
  const inheritedDocIds = useMemo(() => {
    if (!contract || !checklist.length) return new Set()
    const have = new Set((contract.documents ?? []).map(d => (d.name ?? '').toLowerCase().trim()))
    const ids = new Set()
    checklist.forEach(g => g.documents.forEach(d => {
      if (have.has((d.name ?? '').toLowerCase().trim())) ids.add(d.id)
    }))
    return ids
  }, [contract, checklist])

  // Khi contract đổi → reset checked = inherited (nếu không phải existing)
  useEffect(() => {
    if (existing) return
    setChecked(new Set(inheritedDocIds))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId])
  const totalDocs = useMemo(
    () => checklist.reduce((s, g) => s + g.documents.length, 0),
    [checklist],
  )
  const vatAmount    = Math.round((Number(valueBeforeVAT) || 0) * vatRate / 100)
  const valueAfterVAT = (Number(valueBeforeVAT) || 0) + vatAmount
  const effectiveStatus = existing?.status
  const readOnly = !!existing && effectiveStatus !== 'Nháp' && effectiveStatus !== 'Trả lại bổ sung'
  const canRecall = !!existing && effectiveStatus === 'Chờ duyệt' && existing.createdById === user.id
  const needsAdjustmentFields = invoiceKind === 'Điều chỉnh' || invoiceKind === 'Thay thế'
  const missingDocs = checklist.reduce((s, g) => s + g.documents.length, 0) - checked.size
  const hasCommitment = missingDocs > 0
  const submitDisabled = !contract
    || (hasCommitment && (!commitment.trim() || !commitmentDeadline))
    || (buyerEmail && !EMAIL_RE.test(buyerEmail))
    || (needsAdjustmentFields && (!originalInvoiceNumber.trim() || !adjustmentReason.trim()))

  function toggleDoc(docId) {
    if (readOnly) return
    if (inheritedDocIds.has(docId)) return // locked: inherited từ contract
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(docId)) next.delete(docId)
      else next.add(docId)
      return next
    })
  }

  function validateEmail(v) {
    if (!v) { setEmailError(''); return true }
    if (!EMAIL_RE.test(v)) { setEmailError('Email không hợp lệ'); return false }
    setEmailError('')
    return true
  }

  function buildPayload() {
    return {
      contractId,
      contractNumber: contract?.contractNumber ?? '',
      customerName: contract?.customerName ?? '',
      customerTaxCode: contract?.customerTaxCode ?? '',
      customerAddress: contract?.customerAddress ?? '',
      serviceType: contract?.serviceType ?? '',
      department: contract?.department ?? '',
      valueBeforeVAT: Number(valueBeforeVAT) || 0,
      vatRate,
      paymentTerm,
      paymentMethod,
      invoiceType: invoiceKind,
      originalInvoiceNumber: needsAdjustmentFields ? originalInvoiceNumber.trim() : null,
      adjustmentReason: needsAdjustmentFields ? adjustmentReason.trim() : null,
      buyerEmail,
      notes,
      hasCommitment,
      commitmentText: hasCommitment ? commitment.trim() : null,
      commitmentDeadline: hasCommitment ? commitmentDeadline : null,
      legalChecklist: { total: totalDocs, checked: checked.size },
      createdBy: user?.name ?? '',
      createdById: user?.id ?? '',
    }
  }

  function handleSaveDraft() {
    if (buyerEmail && !validateEmail(buyerEmail)) return
    const payload = buildPayload()
    if (existing) {
      updateRequest(existing.id, payload)
      toast.success(`Đã lưu nháp ${existing.id}`)
    } else {
      const newId = addRequest({ ...payload, status: 'Nháp' })
      toast.success(`Đã tạo nháp ${newId}`)
      navigate(`/de-nghi/${newId}`)
    }
  }

  function handleSubmit() {
    if (!contract) { toast.warning('Vui lòng chọn hợp đồng'); return }
    if (buyerEmail && !validateEmail(buyerEmail)) return
    if (needsAdjustmentFields && (!originalInvoiceNumber.trim() || !adjustmentReason.trim())) {
      toast.warning('Vui lòng nhập Số HĐ gốc và Lý do cho loại Điều chỉnh/Thay thế')
      return
    }
    if (hasCommitment && (!commitment.trim() || !commitmentDeadline)) {
      toast.warning('Hồ sơ còn thiếu — vui lòng ghi cam kết và hạn bổ sung')
      return
    }
    const payload = buildPayload()
    let targetId
    if (existing) {
      updateRequest(existing.id, payload)
      submitRequest(existing.id)
      targetId = existing.id
    } else {
      targetId = addRequest({ ...payload, status: 'Chờ duyệt' })
    }
    toast.success(`Đã gửi duyệt ${targetId}`)
    navigate(`/de-nghi/${targetId}`)
  }

  function handleRecall() {
    if (!existing) return
    const res = recallRequest(existing.id, user?.id)
    if (!res.ok) {
      toast.error(res.reason ?? 'Không thể thu hồi')
      return
    }
    pushNotification({
      kind: 'system',
      title: `ĐN đã thu hồi: ${existing.id}`,
      description: `${existing.customerName} — ${user?.name ?? 'Nhân viên'} đã thu hồi`,
      to: `/de-nghi/${existing.id}`,
    })
    toast.success('Đã thu hồi đề nghị — chuyển về trạng thái Nháp')
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild aria-label="Quay lại">
            <Link to="/de-nghi"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold page-title">
              {existing ? existing.id : 'Tạo đề nghị xuất hoá đơn'}
            </h1>
            {existing && (
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <StatusBadge status={effectiveStatus} />
                <span>· Tạo bởi {existing.createdBy}</span>
              </div>
            )}
          </div>
        </div>
        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            {canRecall && (
              <Button
                variant="outline"
                onClick={() => setConfirmRecall(true)}
                className="text-amber-700 hover:bg-amber-50"
              >
                <Undo2 className="h-4 w-4" /> Thu hồi
              </Button>
            )}
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save className="h-4 w-4" /> Lưu nháp
            </Button>
            <Button onClick={handleSubmit} disabled={submitDisabled}>
              <Send className="h-4 w-4" /> Gửi duyệt
            </Button>
          </div>
        )}
      </div>

      {canRecall && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <Undo2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div className="flex-1">
              Đề nghị đang ở trạng thái <strong>Chờ duyệt</strong>. Bạn có thể thu hồi để chỉnh sửa lại trước khi kế toán xử lý.
            </div>
          </div>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="thong-tin">1. Thông tin chung</TabsTrigger>
          <TabsTrigger value="hang-hoa" disabled={!contract}>2. Hàng hoá / Dịch vụ</TabsTrigger>
          <TabsTrigger value="ho-so" disabled={!contract}>
            3. Hồ sơ pháp lý {totalDocs ? `(${checked.size}/${totalDocs})` : ''}
          </TabsTrigger>
        </TabsList>

        {/* ----- Tab 1: General info ----- */}
        <TabsContent value="thong-tin">
          <Card>
            <CardContent className="grid gap-4 p-6 md:grid-cols-2">
              <Field label="Hợp đồng *">
                <Select value={contractId} onValueChange={setContractId} disabled={readOnly}>
                  <SelectTrigger><SelectValue placeholder="Chọn hợp đồng..." /></SelectTrigger>
                  <SelectContent>
                    {contracts.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.contractNumber} — {c.customerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Loại đề nghị">
                <Select value={invoiceKind} onValueChange={setInvoiceKind} disabled={readOnly}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INVOICE_KINDS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>

              {/* Inherited from contract */}
              {contract && (
                <>
                  <ReadOnlyField label="Chủ đầu tư">{contract.customerName}</ReadOnlyField>
                  <ReadOnlyField label="Mã số thuế">{contract.customerTaxCode}</ReadOnlyField>
                  <ReadOnlyField label="Địa chỉ" wide>{contract.customerAddress}</ReadOnlyField>
                  <ReadOnlyField label="Loại dịch vụ">{contract.serviceType}</ReadOnlyField>
                  <ReadOnlyField label="Đơn vị thực hiện">{contract.department}</ReadOnlyField>
                </>
              )}

              <Field label="Email người mua">
                <Input
                  type="email"
                  value={buyerEmail}
                  onChange={e => { setBuyerEmail(e.target.value); validateEmail(e.target.value) }}
                  onBlur={e => validateEmail(e.target.value)}
                  placeholder="ketoan@khachhang.vn"
                  disabled={readOnly}
                  aria-invalid={!!emailError}
                />
                {emailError && <span className="text-xs text-red-600">{emailError}</span>}
              </Field>

              <Field label="Đợt thanh toán">
                <Select value={paymentTerm} onValueChange={setPaymentTerm} disabled={readOnly}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Hình thức thanh toán">
                <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={readOnly}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>

              {needsAdjustmentFields && (
                <>
                  <Field label="Số HĐ gốc *">
                    <Input
                      value={originalInvoiceNumber}
                      onChange={e => setOriginalInvoiceNumber(e.target.value)}
                      placeholder="VD: K26TYY0000123"
                      disabled={readOnly}
                    />
                  </Field>
                  <Field label="Lý do *">
                    <Input
                      value={adjustmentReason}
                      onChange={e => setAdjustmentReason(e.target.value)}
                      placeholder="Lý do điều chỉnh/thay thế"
                      disabled={readOnly}
                    />
                  </Field>
                </>
              )}

              <Field label="Ghi chú">
                <Input
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ghi chú thêm (tùy chọn)"
                  disabled={readOnly}
                />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----- Tab 2: Goods/services ----- */}
        <TabsContent value="hang-hoa">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Giá trị trước VAT (đ) *">
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={valueBeforeVAT}
                    onChange={e => setValueBeforeVAT(Number(e.target.value))}
                    disabled={readOnly}
                  />
                </Field>
                <Field label="Thuế suất VAT (%)">
                  <Select value={String(vatRate)} onValueChange={v => setVatRate(Number(v))} disabled={readOnly}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['0', '5', '8', '10'].map(v => (
                        <SelectItem key={v} value={v}>{v}%</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <ReadOnlyField label="Tiền VAT" tabular>{formatVND(vatAmount)}</ReadOnlyField>
              </div>

              <Separator />

              <div className="rounded-md bg-muted/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tổng tiền sau VAT</span>
                  <span className="text-lg font-semibold tabular-nums text-primary">
                    {formatVND(valueAfterVAT)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----- Tab 3: Legal documents checklist ----- */}
        <TabsContent value="ho-so">
          <Card>
            <CardContent className="space-y-5 p-6">
              {!contract && (
                <p className="text-sm text-muted-foreground">
                  Chọn hợp đồng ở tab 1 để hiển thị danh mục hồ sơ.
                </p>
              )}
              {contract && checklist.map(group => (
                <div key={group.groupName} className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    {group.groupName}
                  </h3>
                  <ul className="space-y-1">
                    {group.documents.map(doc => {
                      const on = checked.has(doc.id)
                      const inherited = inheritedDocIds.has(doc.id)
                      return (
                        <li key={doc.id}>
                          <button
                            type="button"
                            onClick={() => toggleDoc(doc.id)}
                            disabled={readOnly || inherited}
                            className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-90"
                            title={inherited ? 'Kế thừa từ hồ sơ hợp đồng — không thể bỏ chọn' : undefined}
                          >
                            {on
                              ? <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden />
                              : <Circle className="h-5 w-5 text-muted-foreground" aria-hidden />}
                            <span className="flex-1">{doc.name}</span>
                            {inherited && (
                              <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                Kế thừa từ HĐ
                              </span>
                            )}
                            {doc.required && (
                              <span className="text-xs text-red-600">Bắt buộc</span>
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}

              {contract && hasCommitment && (
                <div className="rounded-md border border-dashed border-orange-400 bg-orange-50 p-4 space-y-3">
                  <p className="text-sm font-medium text-orange-900">
                    Còn thiếu {missingDocs} hồ sơ. Vui lòng ghi cam kết bổ sung:
                  </p>
                  <textarea
                    rows={3}
                    value={commitment}
                    onChange={e => setCommitment(e.target.value)}
                    disabled={readOnly}
                    placeholder="VD: Bổ sung BB nghiệm thu trước 30/04/2026..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Field label="Hạn bổ sung *">
                    <Input
                      type="date"
                      value={commitmentDeadline}
                      onChange={e => setCommitmentDeadline(e.target.value)}
                      disabled={readOnly}
                    />
                  </Field>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmModal
        open={confirmRecall}
        onOpenChange={setConfirmRecall}
        title="Thu hồi đề nghị?"
        description={existing
          ? `Đề nghị ${existing.id} sẽ được chuyển về trạng thái Nháp để bạn chỉnh sửa lại.`
          : ''}
        confirmLabel="Thu hồi"
        confirmVariant="destructive"
        onConfirm={handleRecall}
      />
    </div>
  )
}

/* ----- Small layout helpers (kept inline; not reused elsewhere yet) ----- */
function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  )
}
function ReadOnlyField({ label, children, wide, tabular }) {
  return (
    <div className={`flex flex-col gap-1.5 text-sm ${wide ? 'md:col-span-2' : ''}`}>
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className={`rounded-md bg-muted/40 px-3 py-2 ${tabular ? 'tabular-nums' : ''}`}>
        {children}
      </span>
    </div>
  )
}
