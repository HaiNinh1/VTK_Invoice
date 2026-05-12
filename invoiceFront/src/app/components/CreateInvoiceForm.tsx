import { useMemo, useState } from 'react';
import { ArrowLeft, Save, Send, Loader, AlertCircle, Lock } from 'lucide-react';
import {
  useCustomers,
  useInvoiceTypes,
  useServiceTypes,
  useContracts,
  useCreateInvoiceRequest,
  useSubmitInvoiceRequest,
  useSignature,
} from '../../lib/api/queries';
import { ApiError } from '../../lib/api/errors';

interface CreateInvoiceFormProps {
  onBack: () => void;
  onCreated?: (requestId: number | string) => void;
  onSignatureRequired?: () => void;
}

type FieldErrors = Record<string, string[] | string | undefined>;

// Parse Vietnamese formatted number (e.g. "2.450.000.000") -> 2450000000
function parseVnNumber(input: string): number {
  if (!input) return 0;
  const digits = input.replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}

function formatVnNumber(value: number | string): string {
  const n = typeof value === 'number' ? value : parseVnNumber(String(value));
  if (!Number.isFinite(n) || n === 0) return '';
  return n.toLocaleString('vi-VN');
}

export default function CreateInvoiceForm({
  onBack,
  onCreated,
  onSignatureRequired,
}: CreateInvoiceFormProps) {
  // --- Master data ---
  const { data: customersPage, isLoading: loadingCustomers } = useCustomers({ per_page: 200 });
  const { data: invoiceTypesPage, isLoading: loadingInvoiceTypes } = useInvoiceTypes({
    per_page: 100,
    status: 'active',
  });
  const { data: serviceTypesPage, isLoading: loadingServiceTypes } = useServiceTypes({
    per_page: 100,
  });
  const customers = customersPage?.data ?? [];
  const invoiceTypes = invoiceTypesPage?.data ?? [];
  const serviceTypes = serviceTypesPage?.data ?? [];

  // --- Form state ---
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [invoiceTypeId, setInvoiceTypeId] = useState<number | ''>('');
  const [serviceTypeId, setServiceTypeId] = useState<number | ''>('');
  const [contractId, setContractId] = useState<number | ''>('');
  const [installmentId, setInstallmentId] = useState<number | ''>('');
  const [beforeVATText, setBeforeVATText] = useState('');
  const [taxRate, setTaxRate] = useState<number>(10);
  const [notes, setNotes] = useState('');

  // --- Contracts scoped to selected customer ---
  const { data: contractsPage } = useContracts({
    customer_id: customerId === '' ? undefined : Number(customerId),
    per_page: 100,
  });
  const contracts = contractsPage?.data ?? [];
  const selectedContract = useMemo(
    () => contracts.find((c: any) => c.id === Number(contractId)),
    [contracts, contractId]
  );
  const installments = selectedContract?.installments ?? [];

  // --- Mutations ---
  const create = useCreateInvoiceRequest();
  const submit = useSubmitInvoiceRequest();
  const { data: signature } = useSignature();
  const hasSignature = !!signature?.signature_image_url || !!signature?.has_signature;

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  // --- Derived amounts ---
  const beforeVAT = parseVnNumber(beforeVATText);
  const vatAmount = Math.round((beforeVAT * taxRate) / 100);
  const afterVAT = beforeVAT + vatAmount;

  const isBusy = create.isPending || submit.isPending;

  function validate(): boolean {
    const errs: FieldErrors = {};
    if (!customerId) errs.customer_id = 'Vui lòng chọn khách hàng';
    if (!invoiceTypeId) errs.invoice_type_id = 'Vui lòng chọn loại hóa đơn';
    if (!serviceTypeId) errs.service_type_id = 'Vui lòng chọn loại dịch vụ';
    if (!beforeVAT || beforeVAT <= 0) errs.before_vat = 'Vui lòng nhập số tiền trước thuế';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function buildPayload() {
    return {
      customer_id: Number(customerId),
      invoice_type_id: Number(invoiceTypeId),
      service_type_id: Number(serviceTypeId),
      contract_id: contractId === '' ? null : Number(contractId),
      payment_installment_id: installmentId === '' ? null : Number(installmentId),
      before_vat: beforeVAT,
      tax_rate: taxRate,
      after_vat: afterVAT,
      notes: notes || undefined,
    };
  }

  async function handleSaveDraft() {
    setFormError(null);
    setFieldErrors({});
    if (!validate()) return;
    try {
      const created = await create.mutateAsync(buildPayload());
      onCreated?.(created.id);
      onBack();
    } catch (e) {
      handleApiError(e);
    }
  }

  async function handleSubmitForApproval() {
    setFormError(null);
    setFieldErrors({});
    if (!validate()) return;
    try {
      const created = await create.mutateAsync(buildPayload());
      await submit.mutateAsync({ id: created.id });
      onCreated?.(created.id);
      onBack();
    } catch (e) {
      handleApiError(e);
    }
  }

  function handleApiError(e: unknown) {
    if (e instanceof ApiError) {
      if (e.isSignatureRequired()) {
        if (onSignatureRequired) {
          onSignatureRequired();
        } else {
          setFormError('Cần thiết lập chữ ký điện tử trước khi gửi phê duyệt.');
        }
        return;
      }
      if (e.isValidation()) {
        setFieldErrors((e.fields as FieldErrors) ?? {});
        setFormError(e.message || 'Dữ liệu không hợp lệ');
        return;
      }
      setFormError(e.message);
      return;
    }
    setFormError('Có lỗi xảy ra. Vui lòng thử lại.');
  }

  function fieldError(name: string): string | null {
    const v = fieldErrors[name];
    if (!v) return null;
    return Array.isArray(v) ? v[0] ?? null : String(v);
  }

  const inputBase =
    'w-full h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] focus:border-transparent';
  const labelBase = 'block text-sm font-medium text-[#374151] mb-1';
  const errorBase = 'mt-1 text-xs text-[#DC2626] flex items-center gap-1';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="h-9 w-9 flex items-center justify-center rounded-lg border border-[#D1D5DB] hover:bg-[#F3F4F6]"
          aria-label="Quay lại"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">Tạo đề nghị xuất Hóa đơn</h1>
          <p className="text-sm text-[#6B7280]">Điền thông tin để tạo đề nghị mới</p>
        </div>
      </div>

      {/* Form error banner */}
      {formError && (
        <div className="mb-4 p-3 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] rounded-lg text-sm flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-5">
        {/* Customer */}
        <div>
          <label className={labelBase}>
            Khách hàng <span className="text-[#EE0033]">*</span>
          </label>
          <select
            className={`${inputBase} bg-white ${fieldError('customer_id') ? 'border-[#DC2626]' : 'border-[#D1D5DB]'}`}
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value ? Number(e.target.value) : '');
              setContractId('');
              setInstallmentId('');
            }}
            disabled={loadingCustomers}
          >
            <option value="">— Chọn khách hàng —</option>
            {customers.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.tax_code ? ` (MST: ${c.tax_code})` : ''}
              </option>
            ))}
          </select>
          {fieldError('customer_id') && (
            <div className={errorBase}>
              <AlertCircle size={12} /> {fieldError('customer_id')}
            </div>
          )}
        </div>

        {/* Invoice Type + Service Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelBase}>
              Loại hóa đơn <span className="text-[#EE0033]">*</span>
            </label>
            <select
              className={`${inputBase} bg-white ${fieldError('invoice_type_id') ? 'border-[#DC2626]' : 'border-[#D1D5DB]'}`}
              value={invoiceTypeId}
              onChange={(e) => setInvoiceTypeId(e.target.value ? Number(e.target.value) : '')}
              disabled={loadingInvoiceTypes}
            >
              <option value="">— Chọn loại hóa đơn —</option>
              {invoiceTypes.map((it: any) => (
                <option key={it.id} value={it.id}>
                  {it.name}
                </option>
              ))}
            </select>
            {fieldError('invoice_type_id') && (
              <div className={errorBase}>
                <AlertCircle size={12} /> {fieldError('invoice_type_id')}
              </div>
            )}
          </div>

          <div>
            <label className={labelBase}>
              Loại dịch vụ <span className="text-[#EE0033]">*</span>
            </label>
            <select
              className={`${inputBase} bg-white ${fieldError('service_type_id') ? 'border-[#DC2626]' : 'border-[#D1D5DB]'}`}
              value={serviceTypeId}
              onChange={(e) => setServiceTypeId(e.target.value ? Number(e.target.value) : '')}
              disabled={loadingServiceTypes}
            >
              <option value="">— Chọn loại dịch vụ —</option>
              {serviceTypes.map((st: any) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
            {fieldError('service_type_id') && (
              <div className={errorBase}>
                <AlertCircle size={12} /> {fieldError('service_type_id')}
              </div>
            )}
          </div>
        </div>

        {/* Contract + Installment (optional) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelBase}>Hợp đồng (tùy chọn)</label>
            <select
              className={`${inputBase} bg-white border-[#D1D5DB]`}
              value={contractId}
              onChange={(e) => {
                setContractId(e.target.value ? Number(e.target.value) : '');
                setInstallmentId('');
              }}
              disabled={!customerId}
            >
              <option value="">— Không gắn hợp đồng —</option>
              {contracts.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
            {!customerId && (
              <div className="mt-1 text-xs text-[#6B7280]">Chọn khách hàng trước</div>
            )}
          </div>

          <div>
            <label className={labelBase}>Đợt thanh toán (tùy chọn)</label>
            <select
              className={`${inputBase} bg-white border-[#D1D5DB]`}
              value={installmentId}
              onChange={(e) => setInstallmentId(e.target.value ? Number(e.target.value) : '')}
              disabled={!contractId || installments.length === 0}
            >
              <option value="">— Không gắn đợt —</option>
              {installments.map((ins: any) => (
                <option key={ins.id} value={ins.id}>
                  Đợt {ins.installment_number ?? ins.id} — {ins.percentage ?? '?'}%
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <label className={labelBase}>
              Số tiền trước VAT (VNĐ) <span className="text-[#EE0033]">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              className={`${inputBase} ${fieldError('before_vat') ? 'border-[#DC2626]' : 'border-[#D1D5DB]'} text-right`}
              value={beforeVATText}
              onChange={(e) => setBeforeVATText(formatVnNumber(e.target.value))}
              placeholder="0"
            />
            {fieldError('before_vat') && (
              <div className={errorBase}>
                <AlertCircle size={12} /> {fieldError('before_vat')}
              </div>
            )}
          </div>

          <div className="col-span-1">
            <label className={labelBase}>Thuế suất (%)</label>
            <select
              className={`${inputBase} bg-white border-[#D1D5DB]`}
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
            >
              <option value={0}>0%</option>
              <option value={5}>5%</option>
              <option value={8}>8%</option>
              <option value={10}>10%</option>
            </select>
          </div>

          <div className="col-span-1">
            <label className={labelBase}>Tiền VAT (tự tính)</label>
            <div className="h-10 px-3 border border-[#E5E7EB] bg-[#F9FAFB] rounded-lg text-sm flex items-center justify-end text-[#374151]">
              {formatVnNumber(vatAmount) || '0'}
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between p-3 bg-[#FEF3F2] border border-[#FECDD3] rounded-lg">
          <span className="text-sm font-medium text-[#7F1D1D]">Tổng tiền sau VAT</span>
          <span className="text-lg font-semibold text-[#EE0033]">
            {formatVnNumber(afterVAT) || '0'} VNĐ
          </span>
        </div>

        {/* Notes */}
        <div>
          <label className={labelBase}>Ghi chú</label>
          <textarea
            className={`${inputBase} h-24 py-2 border-[#D1D5DB] resize-none`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Nội dung dịch vụ, mô tả thêm..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          onClick={onBack}
          disabled={isBusy}
          className="h-10 px-6 text-sm font-medium text-[#6B7280] hover:text-[#374151] transition-colors disabled:opacity-50"
        >
          Hủy
        </button>
        <button
          onClick={handleSaveDraft}
          disabled={isBusy}
          className="h-10 px-6 bg-white text-[#374151] border border-[#D1D5DB] rounded-lg text-sm font-medium hover:bg-[#F3F4F6] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {create.isPending && !submit.isPending ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
          Lưu nháp
        </button>
        <button
          onClick={handleSubmitForApproval}
          disabled={isBusy || !hasSignature}
          title={!hasSignature ? 'Cần thiết lập chữ ký trước khi gửi phê duyệt' : 'Gửi phê duyệt'}
          className="h-10 px-6 bg-[#EE0033] text-white rounded-lg text-sm font-semibold hover:bg-[#CC002B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submit.isPending ? (
            <Loader size={16} className="animate-spin" />
          ) : !hasSignature ? (
            <Lock size={16} />
          ) : (
            <Send size={16} />
          )}
          Gửi phê duyệt
        </button>
      </div>
    </div>
  );
}
