import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Send, CheckCircle2, Circle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatVND } from '@/components/shared/formatters'
import {
  CONTRACTS,
  INVOICE_REQUESTS,
  getChecklistForServiceType,
} from '@/data/masterData'
import { useToast } from '@/components/ui/toast'

/* -----------------------------------------------------------------------
 * Page: "Đề nghị xuất HĐ" — Form (Create + Detail/Edit)
 * Spec: Prompt 6 — 3-tab form, contract-driven document inheritance.
 *
 * Routes:
 *   /de-nghi/moi    → new draft, must pick a contract first
 *   /de-nghi/:id    → load existing request (read-only for non-draft)
 * --------------------------------------------------------------------- */

const PAYMENT_TERMS  = ['Đợt 1', 'Đợt 2', 'Thanh toán cuối']
const INVOICE_KINDS  = ['Tạo mới', 'Điều chỉnh', 'Thay thế']

export default function DeNghiForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const existing = id && id !== 'moi'
    ? INVOICE_REQUESTS.find(r => r.id === id)
    : null

  // Form state (mock — local only)
  const [contractId, setContractId] = useState(existing?.contractId ?? '')
  const [valueBeforeVAT, setValueBeforeVAT] = useState(existing?.valueBeforeVAT ?? 0)
  const [vatRate, setVatRate] = useState(existing?.vatRate ?? 10)
  const [paymentTerm, setPaymentTerm] = useState(existing?.paymentTerm ?? PAYMENT_TERMS[0])
  const [invoiceKind, setInvoiceKind] = useState(existing?.invoiceType ?? INVOICE_KINDS[0])
  const [buyerEmail, setBuyerEmail] = useState(existing?.buyerEmail ?? '')
  const [checked, setChecked] = useState(() => new Set())
  const [commitment, setCommitment] = useState('')
  const [tab, setTab] = useState('thong-tin')

  const contract = useMemo(
    () => CONTRACTS.find(c => c.id === contractId),
    [contractId],
  )
  const checklist = useMemo(
    () => contract ? getChecklistForServiceType(contract.serviceType) : [],
    [contract],
  )
  const totalDocs = useMemo(
    () => checklist.reduce((s, g) => s + g.documents.length, 0),
    [checklist],
  )
  const vatAmount    = Math.round((Number(valueBeforeVAT) || 0) * vatRate / 100)
  const valueAfterVAT = (Number(valueBeforeVAT) || 0) + vatAmount
  const readOnly = !!existing && existing.status !== 'Nháp' && existing.status !== 'Trả lại bổ sung'

  function toggleDoc(docId) {
    if (readOnly) return
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(docId)) next.delete(docId)
      else next.add(docId)
      return next
    })
  }

  function handleSubmit() {
    // Mock submit — in real app this would call API.
    toast.success(`Đã gửi đề nghị ${existing?.id ?? '(mới)'} để duyệt (demo)`)
    navigate('/de-nghi')
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
            <h1 className="text-xl font-semibold">
              {existing ? existing.id : 'Tạo đề nghị xuất hoá đơn'}
            </h1>
            {existing && (
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <StatusBadge status={existing.status} />
                <span>· Tạo bởi {existing.createdBy}</span>
              </div>
            )}
          </div>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast.success('Đã lưu nháp (demo)')}>
              <Save className="h-4 w-4" /> Lưu nháp
            </Button>
            <Button onClick={handleSubmit} disabled={!contract}>
              <Send className="h-4 w-4" /> Gửi duyệt
            </Button>
          </div>
        )}
      </div>

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
                    {CONTRACTS.map(c => (
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
                  onChange={e => setBuyerEmail(e.target.value)}
                  placeholder="ketoan@khachhang.vn"
                  disabled={readOnly}
                />
              </Field>

              <Field label="Đợt thanh toán">
                <Select value={paymentTerm} onValueChange={setPaymentTerm} disabled={readOnly}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
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
                      return (
                        <li key={doc.id}>
                          <button
                            type="button"
                            onClick={() => toggleDoc(doc.id)}
                            disabled={readOnly}
                            className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none disabled:cursor-not-allowed"
                          >
                            {on
                              ? <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden />
                              : <Circle className="h-5 w-5 text-muted-foreground" aria-hidden />}
                            <span className="flex-1">{doc.name}</span>
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

              {contract && checked.size < totalDocs && (
                <div className="rounded-md border border-dashed border-orange-400 bg-orange-50 p-4">
                  <p className="mb-2 text-sm font-medium text-orange-900">
                    Còn thiếu {totalDocs - checked.size} hồ sơ. Vui lòng ghi cam kết bổ sung:
                  </p>
                  <textarea
                    rows={3}
                    value={commitment}
                    onChange={e => setCommitment(e.target.value)}
                    disabled={readOnly}
                    placeholder="VD: Bổ sung BB nghiệm thu trước 30/04/2026..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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
