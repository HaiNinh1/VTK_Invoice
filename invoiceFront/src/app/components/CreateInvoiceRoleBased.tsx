import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronDown,
  ChevronUp,
  Upload,
  AlertTriangle,
  Check,
  X,
  Clock,
  Lock,
  ArrowLeft,
  ExternalLink,
  Copy,
  Send,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { QuickLinksPills } from './NavigationHelpers';
import {
  createInvoiceRequestSchema,
  type CreateInvoiceRequestInput,
} from '../../lib/validation';
import {
  useCustomers,
  useContracts,
  useContractInstallments,
  useInvoiceTypes,
  useServiceTypes,
  useLegalDocumentsCatalog,
  useCreateInvoiceRequest,
} from '../../lib/api/queries';
import { invoiceRequestsApi } from '../../lib/api/endpoints/invoiceRequests';
import { useAuth } from '../../lib/auth/AuthProvider';
import { getTodayString } from '../utils/formHelpers';

type AppUserRole = 'employee' | 'manager' | 'accountant' | 'director' | 'admin';

interface CreateInvoiceRoleBasedProps {
  onBack: () => void;
  requestId?: string;
  status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'returned' | 'issued';
  isOwner?: boolean;
  ownerInfo?: {
    name: string;
    department: string;
    date: string;
  };
  rejectionReason?: string;
  returnReason?: string;
  onNavigateToView?: (view: string) => void;
  userRole?: AppUserRole;
  /** Optional callback after successful create + upload. */
  onSuccess?: (newInvoiceId: number) => void;
}

interface PendingAttachment {
  legalDocumentId: number;
  legalDocumentName: string;
  file: File;
  notes?: string;
}

// ------- helpers -------

function toNumber(v: number | string | null | undefined): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatVND(n: number): string {
  return n.toLocaleString('vi-VN');
}

function roleBadge(role: AppUserRole) {
  const map: Record<AppUserRole, { bg: string; text: string; label: string }> = {
    admin: { bg: '#F3E8FF', text: '#7C3AED', label: 'Quản trị viên' },
    director: { bg: '#FFF1F3', text: '#EE0033', label: 'Giám đốc' },
    accountant: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Kế toán' },
    manager: { bg: '#FED7AA', text: '#C2410C', label: 'Quản lý' },
    employee: { bg: '#F3F4F6', text: '#4B5563', label: 'Chuyên viên' },
  };
  const s = map[role];
  return (
    <span
      className="inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-medium"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

// ------- component -------

export default function CreateInvoiceRoleBased({
  onBack,
  requestId,
  status = 'draft',
  isOwner = true,
  ownerInfo,
  rejectionReason,
  returnReason,
  onNavigateToView,
  userRole,
  onSuccess,
}: CreateInvoiceRoleBasedProps) {
  const { user, primaryRole } = useAuth();
  const role: AppUserRole = userRole ?? primaryRole;

  const isCreateMode = !requestId;
  const canEdit = isCreateMode && isOwner && (status === 'draft' || status === 'returned');
  const isReadOnly = !canEdit;

  const [activeTab, setActiveTab] = useState<'info' | 'checklist' | 'preview'>('info');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    section1: true,
    section2: true,
    section3: true,
    section4: true,
  });
  const toggleSection = (s: string) =>
    setExpandedSections((p) => ({ ...p, [s]: !p[s] }));

  // ---------- form ----------
  const form = useForm<CreateInvoiceRequestInput>({
    resolver: zodResolver(createInvoiceRequestSchema),
    defaultValues: {
      customer_id: undefined as unknown as number,
      invoice_type_id: undefined as unknown as number,
      service_type_id: undefined as unknown as number,
      contract_id: null,
      payment_installment_id: null,
      revenue_center_id: null,
      amount_before_vat: 0,
      tax_rate: 10,
      vat_amount: 0,
      amount_after_vat: 0,
      notes: '',
    },
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const customerId = watch('customer_id');
  const contractId = watch('contract_id');
  const amountBefore = watch('amount_before_vat');
  const taxRate = watch('tax_rate') ?? 0;

  // Auto-calc VAT + total
  useEffect(() => {
    const before = toNumber(amountBefore);
    const rate = toNumber(taxRate);
    const vat = Math.round((before * rate) / 100);
    setValue('vat_amount', vat, { shouldValidate: false });
    setValue('amount_after_vat', before + vat, { shouldValidate: false });
  }, [amountBefore, taxRate, setValue]);

  // ---------- master data hooks ----------
  const [customerSearch, setCustomerSearch] = useState('');
  const customersQ = useCustomers({ search: customerSearch || undefined, per_page: 50 });
  const contractsQ = useContracts({
    customer_id: typeof customerId === 'number' && customerId > 0 ? customerId : undefined,
    status: 'active',
    per_page: 50,
  });
  const installmentsQ = useContractInstallments(
    typeof contractId === 'number' && contractId > 0 ? contractId : null
  );
  const invoiceTypesQ = useInvoiceTypes({ status: 'active', per_page: 100 });
  const serviceTypesQ = useServiceTypes({ per_page: 100 });
  const legalCatalogQ = useLegalDocumentsCatalog();

  const customers = customersQ.data?.data ?? [];
  const contracts = contractsQ.data?.data ?? [];
  const installments = (installmentsQ.data ?? []).filter((i) => i.status === 'pending');
  const invoiceTypes = invoiceTypesQ.data?.data ?? [];
  const serviceTypes = serviceTypesQ.data?.data ?? [];
  const legalCatalog = legalCatalogQ.data?.data ?? [];

  // Reset dependent fields when customer changes
  useEffect(() => {
    setValue('contract_id', null);
    setValue('payment_installment_id', null);
  }, [customerId, setValue]);
  useEffect(() => {
    setValue('payment_installment_id', null);
  }, [contractId, setValue]);

  // ---------- legal checklist + attachments ----------
  const [checkedDocs, setCheckedDocs] = useState<Record<number, boolean>>({});
  const [attachments, setAttachments] = useState<Record<number, PendingAttachment>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeUploadDocId, setActiveUploadDocId] = useState<number | null>(null);

  const requiredDocs = useMemo(
    () =>
      legalCatalog.filter(
        (d) => d.enabled !== false && (d.default_required ?? true)
      ),
    [legalCatalog]
  );
  const totalChecklistItems = requiredDocs.length;
  const checkedCount = requiredDocs.filter((d) => checkedDocs[d.id]).length;
  const completionPercent = totalChecklistItems
    ? Math.round((checkedCount / totalChecklistItems) * 100)
    : 0;
  const isChecklistComplete = totalChecklistItems > 0 && checkedCount === totalChecklistItems;

  const handleFilePick = (legalDocId: number, legalDocName: string) => {
    setActiveUploadDocId(legalDocId);
    setTimeout(() => fileInputRef.current?.click(), 0);
    // store name for later
    setAttachments((prev) => ({
      ...prev,
      [legalDocId]: prev[legalDocId] ?? {
        legalDocumentId: legalDocId,
        legalDocumentName: legalDocName,
        file: undefined as unknown as File,
      },
    }));
  };

  const handleFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || activeUploadDocId == null) return;
    const docId = activeUploadDocId;
    const doc = legalCatalog.find((d) => d.id === docId);
    setAttachments((prev) => ({
      ...prev,
      [docId]: {
        legalDocumentId: docId,
        legalDocumentName: doc?.name ?? `Tài liệu #${docId}`,
        file,
      },
    }));
    setCheckedDocs((prev) => ({ ...prev, [docId]: true }));
    setActiveUploadDocId(null);
  };

  const removeAttachment = (docId: number) => {
    setAttachments((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
    setCheckedDocs((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
  };

  // ---------- commitment ----------
  const [hasCommitment, setHasCommitment] = useState(false);
  const [commitmentDeadline, setCommitmentDeadline] = useState('');
  const [commitmentReason, setCommitmentReason] = useState('');

  const canSubmitForApproval = isChecklistComplete || hasCommitment;

  // ---------- submit ----------
  const createMut = useCreateInvoiceRequest();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const onValid = async (values: CreateInvoiceRequestInput) => {
    setSubmitError(null);
    setUploadProgress(null);
    try {
      const created = await createMut.mutateAsync(values);
      const newId = (created as { id?: number })?.id;

      // Sequentially upload legal documents
      const filesToUpload = (Object.values(attachments) as PendingAttachment[]).filter(
        (a): a is PendingAttachment => !!a?.file
      );
      const uploadFailures: string[] = [];
      if (newId && filesToUpload.length > 0) {
        for (let i = 0; i < filesToUpload.length; i++) {
          const a = filesToUpload[i];
          setUploadProgress(`Đang tải tệp ${i + 1}/${filesToUpload.length}: ${a.legalDocumentName}`);
          try {
            await invoiceRequestsApi.legalDocuments.upload(
              newId,
              a.file,
              a.legalDocumentId
            );
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
            uploadFailures.push(`${a.legalDocumentName}: ${msg}`);
          }
        }
      }
      setUploadProgress(null);

      if (uploadFailures.length > 0) {
        alert(
          'Đề nghị đã được tạo nhưng có lỗi khi tải hồ sơ:\n' +
            uploadFailures.join('\n')
        );
      } else {
        alert('Tạo đề nghị xuất hoá đơn thành công.');
      }

      if (newId != null && onSuccess) onSuccess(newId);
      else onBack();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Tạo đề nghị thất bại';
      setSubmitError(msg);
    }
  };

  const onInvalid = () => {
    // Open relevant tab so user sees errors
    setActiveTab('info');
  };

  const pageTitle = isCreateMode
    ? 'Tạo đề nghị xuất Hoá đơn'
    : `Chi tiết đề nghị ${requestId}`;

  const ownerName =
    ownerInfo?.name ?? user?.name ?? 'Người dùng';
  const ownerDept =
    ownerInfo?.department ?? user?.department?.name ?? '—';

  // ---------- render helpers ----------
  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="mt-1 text-xs text-[#DC2626]">{msg}</p> : null;

  const SectionShell = ({
    id,
    title,
    children,
  }: {
    id: string;
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => toggleSection(id)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors"
      >
        <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
        {expandedSections[id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {expandedSections[id] && <div className="px-6 pb-6 space-y-4">{children}</div>}
    </div>
  );

  return (
    <div className="space-y-6 pb-24">
      {/* hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
        onChange={handleFileChosen}
      />

      {/* QUICK LINKS (only meaningful in detail view) */}
      {!isCreateMode && requestId && (
        <div className="mb-4">
          <QuickLinksPills
            recordId={requestId}
            links={[
              {
                id: 'legal',
                label: 'Pháp lý',
                count: `${checkedCount}/${totalChecklistItems || 0}`,
                status: status === 'returned' ? 'warning' : 'complete',
                onClick: () => onNavigateToView?.('legal'),
              },
              {
                id: 'sinvoice',
                label: 'S-Invoice',
                status: status === 'issued' ? 'complete' : 'pending',
                onClick: () => onNavigateToView?.('sinvoice'),
              },
              {
                id: 'approval',
                label: 'Phê duyệt',
                status:
                  status === 'approved' || status === 'issued'
                    ? 'complete'
                    : status === 'rejected'
                    ? 'error'
                    : 'pending',
                onClick: () => onNavigateToView?.('approval'),
              },
            ]}
          />
        </div>
      )}

      {/* HEADER */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={onBack}
            className="p-1 hover:bg-[#F3F4F6] rounded transition-colors"
          >
            <ArrowLeft size={20} className="text-[#6B7280]" />
          </button>
          <h1 className="text-base md:text-2xl font-semibold text-[#111827]">{pageTitle}</h1>
          <div className="ml-2">{roleBadge(role)}</div>
        </div>
        <p className="text-xs md:text-sm text-[#6B7280] ml-9">
          {isCreateMode
            ? 'Điền đầy đủ thông tin để tạo đề nghị xuất hoá đơn'
            : 'Xem thông tin chi tiết đề nghị'}
        </p>
      </div>

      {/* STATUS BANNERS (view mode) */}
      {!isCreateMode && status === 'rejected' && (
        <div className="bg-[#FEE2E2] border border-[#DC2626] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <X size={20} className="text-[#DC2626] flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-[#991B1B] mb-1">Đề nghị đã bị từ chối</div>
              {rejectionReason && (
                <div className="text-sm text-[#7F1D1D]">Lý do: {rejectionReason}</div>
              )}
            </div>
          </div>
        </div>
      )}
      {!isCreateMode && status === 'returned' && (
        <div className="bg-[#FEF3C7] border border-[#D97706] rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-[#D97706] flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-[#92400E] mb-1">Đề nghị đã được trả lại</div>
            {returnReason && <div className="text-sm text-[#78350F]">Lý do: {returnReason}</div>}
          </div>
        </div>
      )}
      {!isCreateMode && (status === 'approved' || status === 'issued') && (
        <div className="bg-[#D1FAE5] border border-[#16A34A] rounded-lg p-4 flex items-center gap-3">
          <Check size={20} className="text-[#16A34A] flex-shrink-0" />
          <div className="text-sm font-medium text-[#065F46]">Đề nghị đã được phê duyệt.</div>
          {status === 'issued' && <ExternalLink size={14} className="text-[#16A34A]" />}
        </div>
      )}
      {!isCreateMode && status === 'pending' && (
        <div className="bg-[#FFFBEB] border border-[#F59E0B] rounded-lg p-4 flex items-center gap-3">
          <Clock size={20} className="text-[#F59E0B] flex-shrink-0" />
          <div className="text-sm font-medium text-[#92400E]">
            Đề nghị đang chờ phê duyệt.
          </div>
        </div>
      )}

      {/* Role-specific helper */}
      {isCreateMode && (
        <div className="bg-[#F0F9FF] border border-[#93C5FD] rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={16} className="text-[#1D4ED8] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#1E40AF]">
            {role === 'employee' && (
              <>Bạn đang tạo đề nghị với vai trò <strong>Chuyên viên</strong>. Sau khi gửi, đề nghị sẽ được Quản lý / Kế toán duyệt.</>
            )}
            {role === 'manager' && (
              <>Vai trò <strong>Quản lý</strong>: bạn có thể tạo đề nghị cho Trung tâm doanh thu mình phụ trách.</>
            )}
            {(role === 'accountant' || role === 'director' || role === 'admin') && (
              <>Vai trò <strong>{role === 'admin' ? 'Quản trị viên' : role === 'director' ? 'Giám đốc' : 'Kế toán'}</strong>: bạn có quyền tạo đề nghị cho mọi đơn vị, đề nghị có thể được tự duyệt tuỳ chính sách.</>
            )}
          </div>
        </div>
      )}

      {/* Submit error banner */}
      {submitError && (
        <div className="bg-[#FEE2E2] border border-[#DC2626] rounded-lg p-4 flex items-start gap-3">
          <X size={18} className="text-[#DC2626] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#991B1B]">{submitError}</div>
        </div>
      )}

      {/* TABS */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="flex gap-8 px-6">
          {(['info', 'checklist', 'preview'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t
                  ? 'border-[#EE0033] text-[#EE0033]'
                  : 'border-transparent text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              {t === 'info' && '1. Thông tin đề nghị'}
              {t === 'checklist' && '2. Hồ sơ pháp lý'}
              {t === 'preview' && '3. Xem trước'}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onValid, onInvalid)} noValidate>
        {/* TAB INFO */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Section 1: Khách hàng */}
            <SectionShell id="section1" title="1. Khách hàng">
              {customersQ.isLoading && (
                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <Loader2 size={16} className="animate-spin" /> Đang tải khách hàng…
                </div>
              )}
              {customersQ.isError && (
                <div className="text-sm text-red-700">Không tải được danh sách khách hàng.</div>
              )}
              {!customersQ.isLoading && !customersQ.isError && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1.5">
                      Tìm khách hàng
                    </label>
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Tên hoặc mã số thuế…"
                      disabled={isReadOnly}
                      className="w-full h-10 px-3 text-sm rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#EE0033] focus:border-[#EE0033]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1.5">
                      Khách hàng <span className="text-[#DC2626]">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="customer_id"
                      render={({ field }) => (
                        <select
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(Number(e.target.value) || undefined)}
                          disabled={isReadOnly}
                          className="w-full h-10 px-3 text-sm rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#EE0033] focus:border-[#EE0033]"
                        >
                          <option value="">— Chọn khách hàng —</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.tax_code ? `(MST: ${c.tax_code})` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    <FieldError msg={errors.customer_id?.message} />
                    {customers.length === 0 && (
                      <p className="mt-1 text-xs text-[#6B7280]">Không có khách hàng phù hợp.</p>
                    )}
                  </div>
                </div>
              )}
            </SectionShell>

            {/* Section 2: Hợp đồng & Đợt thanh toán */}
            <SectionShell id="section2" title="2. Hợp đồng & Đợt thanh toán (tuỳ chọn)">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Hợp đồng
                  </label>
                  {contractsQ.isLoading && (
                    <div className="text-sm text-[#6B7280] flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Đang tải…
                    </div>
                  )}
                  {contractsQ.isError && (
                    <div className="text-sm text-red-700">Không tải được hợp đồng.</div>
                  )}
                  {!contractsQ.isLoading && !contractsQ.isError && (
                    <Controller
                      control={control}
                      name="contract_id"
                      render={({ field }) => (
                        <select
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : null)
                          }
                          disabled={isReadOnly || !customerId}
                          className="w-full h-10 px-3 text-sm rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#EE0033] focus:border-[#EE0033] disabled:bg-[#F3F4F6]"
                        >
                          <option value="">— Không gắn hợp đồng —</option>
                          {contracts.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.code} — {c.name}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  )}
                  {!customerId && (
                    <p className="mt-1 text-xs text-[#6B7280]">Chọn khách hàng trước.</p>
                  )}
                  {customerId && !contractsQ.isLoading && contracts.length === 0 && (
                    <p className="mt-1 text-xs text-[#6B7280]">
                      Khách hàng chưa có hợp đồng đang hoạt động.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Đợt thanh toán
                  </label>
                  {installmentsQ.isLoading && (
                    <div className="text-sm text-[#6B7280] flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Đang tải…
                    </div>
                  )}
                  {installmentsQ.isError && (
                    <div className="text-sm text-red-700">Không tải được đợt thanh toán.</div>
                  )}
                  {!installmentsQ.isLoading && !installmentsQ.isError && (
                    <Controller
                      control={control}
                      name="payment_installment_id"
                      render={({ field }) => (
                        <select
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : null)
                          }
                          disabled={isReadOnly || !contractId}
                          className="w-full h-10 px-3 text-sm rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#EE0033] focus:border-[#EE0033] disabled:bg-[#F3F4F6]"
                        >
                          <option value="">— Không chọn đợt —</option>
                          {installments.map((i) => (
                            <option key={i.id} value={i.id}>
                              Đợt {i.sequence}
                              {i.name ? ` — ${i.name}` : ''} — {formatVND(toNumber(i.amount))}đ
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  )}
                  {contractId && !installmentsQ.isLoading && installments.length === 0 && (
                    <p className="mt-1 text-xs text-[#6B7280]">
                      Hợp đồng không có đợt chờ xuất HĐ.
                    </p>
                  )}
                </div>
              </div>
            </SectionShell>

            {/* Section 3: Loại HĐ & Dịch vụ */}
            <SectionShell id="section3" title="3. Loại hoá đơn & Dịch vụ">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Loại hoá đơn <span className="text-[#DC2626]">*</span>
                  </label>
                  {invoiceTypesQ.isLoading && (
                    <div className="text-sm text-[#6B7280] flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Đang tải…
                    </div>
                  )}
                  {invoiceTypesQ.isError && (
                    <div className="text-sm text-red-700">Không tải được loại hoá đơn.</div>
                  )}
                  {!invoiceTypesQ.isLoading && !invoiceTypesQ.isError && (
                    <Controller
                      control={control}
                      name="invoice_type_id"
                      render={({ field }) => (
                        <select
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value) || undefined)
                          }
                          disabled={isReadOnly}
                          className="w-full h-10 px-3 text-sm rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#EE0033] focus:border-[#EE0033]"
                        >
                          <option value="">— Chọn loại hoá đơn —</option>
                          {invoiceTypes.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.code} — {t.name}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  )}
                  <FieldError msg={errors.invoice_type_id?.message} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Loại dịch vụ <span className="text-[#DC2626]">*</span>
                  </label>
                  {serviceTypesQ.isLoading && (
                    <div className="text-sm text-[#6B7280] flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Đang tải…
                    </div>
                  )}
                  {serviceTypesQ.isError && (
                    <div className="text-sm text-red-700">Không tải được loại dịch vụ.</div>
                  )}
                  {!serviceTypesQ.isLoading && !serviceTypesQ.isError && (
                    <Controller
                      control={control}
                      name="service_type_id"
                      render={({ field }) => (
                        <select
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value) || undefined)
                          }
                          disabled={isReadOnly}
                          className="w-full h-10 px-3 text-sm rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#EE0033] focus:border-[#EE0033]"
                        >
                          <option value="">— Chọn loại dịch vụ —</option>
                          {serviceTypes.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.code} — {s.name}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  )}
                  <FieldError msg={errors.service_type_id?.message} />
                </div>
              </div>
            </SectionShell>

            {/* Section 4: Giá trị */}
            <SectionShell id="section4" title="4. Giá trị">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Giá trị trước VAT (VNĐ) <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    disabled={isReadOnly}
                    {...register('amount_before_vat', { valueAsNumber: true })}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#EE0033] focus:border-[#EE0033]"
                  />
                  <FieldError msg={errors.amount_before_vat?.message} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Thuế suất (%) 
                  </label>
                  <Controller
                    control={control}
                    name="tax_rate"
                    render={({ field }) => (
                      <select
                        value={field.value ?? 10}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={isReadOnly}
                        className="w-full h-10 px-3 text-sm rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#EE0033] focus:border-[#EE0033]"
                      >
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={8}>8%</option>
                        <option value={10}>10%</option>
                      </select>
                    )}
                  />
                  <FieldError msg={errors.tax_rate?.message} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Giá trị sau VAT (VNĐ)
                  </label>
                  <input
                    type="number"
                    readOnly
                    {...register('amount_after_vat', { valueAsNumber: true })}
                    className="w-full h-10 px-3 text-sm rounded-lg bg-[#F3F4F6] border-0 text-[#111827]"
                  />
                </div>
              </div>
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Tiền thuế VAT:</span>
                  <span
                    className="font-semibold text-[#111827]"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatVND(toNumber(watch('vat_amount')))} đ
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-[#6B7280]">Tổng thanh toán:</span>
                  <span
                    className="font-semibold text-[#EE0033]"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatVND(toNumber(watch('amount_after_vat')))} đ
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Ghi chú
                </label>
                <textarea
                  rows={3}
                  disabled={isReadOnly}
                  {...register('notes')}
                  placeholder="Ghi chú thêm về đề nghị (tuỳ chọn)…"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#EE0033] focus:border-[#EE0033] resize-none"
                />
                <FieldError msg={errors.notes?.message} />
              </div>
            </SectionShell>
          </div>
        )}

        {/* TAB CHECKLIST */}
        {activeTab === 'checklist' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-[#111827]">
                  Tiến độ hồ sơ pháp lý
                </h3>
                <div
                  className="text-sm font-medium"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {checkedCount}/{totalChecklistItems} ({completionPercent}%)
                </div>
              </div>
              <div className="h-3 bg-[#E5E7EB] rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-[#16A34A] transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              {isChecklistComplete ? (
                <div className="flex items-center gap-2 text-sm text-[#16A34A] font-medium">
                  <Check size={16} /> Đủ hồ sơ pháp lý
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-[#DC2626] font-medium">
                  <AlertTriangle size={16} /> Chưa đủ hồ sơ — cần bổ sung hoặc tạo cam kết
                </div>
              )}
            </div>

            {legalCatalogQ.isLoading && (
              <div className="bg-white border border-[#E5E7EB] rounded-xl py-12 flex items-center justify-center gap-2 text-[#6B7280]">
                <Loader2 size={20} className="animate-spin" /> Đang tải danh mục pháp lý…
              </div>
            )}
            {legalCatalogQ.isError && (
              <div className="bg-white border border-red-200 rounded-xl py-8 text-center text-sm text-red-700">
                Không tải được danh mục pháp lý.
              </div>
            )}
            {!legalCatalogQ.isLoading && !legalCatalogQ.isError && requiredDocs.length === 0 && (
              <div className="bg-white border border-[#E5E7EB] rounded-xl py-12 text-center text-sm text-[#6B7280]">
                Chưa có danh mục hồ sơ pháp lý nào được cấu hình.
              </div>
            )}
            {!legalCatalogQ.isLoading && !legalCatalogQ.isError && requiredDocs.length > 0 && (
              <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                <div className="p-6 space-y-3">
                  {requiredDocs.map((doc) => {
                    const attached = attachments[doc.id];
                    const checked = !!checkedDocs[doc.id];
                    return (
                      <div
                        key={doc.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!canEdit}
                          onChange={() =>
                            setCheckedDocs((p) => ({ ...p, [doc.id]: !p[doc.id] }))
                          }
                          className={`mt-1 w-5 h-5 rounded border-[#D1D5DB] text-[#EE0033] focus:ring-[#EE0033] ${
                            !canEdit ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-[#111827]">
                              {doc.name}
                              {doc.group && (
                                <span className="ml-2 text-xs text-[#6B7280]">[{doc.group}]</span>
                              )}
                            </span>
                            {checked ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-[#D1FAE5] text-[#065F46] font-medium">
                                ✓ Đã có
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-full bg-[#F3F4F6] text-[#6B7280] font-medium">
                                Chưa có
                              </span>
                            )}
                          </div>
                          {attached?.file && (
                            <div className="flex items-center gap-2 text-xs text-[#374151] mt-1">
                              <span className="truncate">{attached.file.name}</span>
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => removeAttachment(doc.id)}
                                  className="text-[#DC2626] hover:underline flex items-center gap-1"
                                >
                                  <Trash2 size={12} /> Xoá
                                </button>
                              )}
                            </div>
                          )}
                          {canEdit && !attached?.file && (
                            <button
                              type="button"
                              onClick={() => handleFilePick(doc.id, doc.name)}
                              className="text-xs text-[#EE0033] hover:underline flex items-center gap-1 mt-1"
                            >
                              <Upload size={12} /> Tải lên file
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Commitment */}
            {canEdit && !isChecklistComplete && totalChecklistItems > 0 && (
              <div className="bg-[#FEF2F2] border-l-4 border-[#DC2626] rounded-lg p-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle size={24} className="text-[#DC2626] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-[#DC2626] mb-2">
                      Hồ sơ pháp lý chưa đầy đủ
                    </h3>
                    <p className="text-sm text-[#7F1D1D] leading-relaxed">
                      Bạn có thể tạo <strong>Cam kết bổ sung</strong> để gửi đề nghị ngay. Đề
                      nghị sẽ được chuyển duyệt đặc biệt.
                    </p>
                  </div>
                </div>
                {!hasCommitment ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#7F1D1D] mb-1.5">
                        Cam kết bổ sung trước ngày <span className="text-[#DC2626]">*</span>
                      </label>
                      <input
                        type="date"
                        min={getTodayString()}
                        value={commitmentDeadline}
                        onChange={(e) => setCommitmentDeadline(e.target.value)}
                        className="w-full h-10 px-3 text-sm rounded-lg border-2 border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#7F1D1D] mb-1.5">
                        Lý do cam kết <span className="text-[#DC2626]">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={commitmentReason}
                        onChange={(e) => setCommitmentReason(e.target.value)}
                        placeholder="Nêu rõ lý do và nội dung cam kết bổ sung…"
                        className="w-full px-3 py-2 text-sm rounded-lg border-2 border-[#DC2626] focus:ring-2 focus:ring-[#DC2626] resize-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!commitmentDeadline || commitmentReason.trim().length < 3) {
                          alert('Vui lòng điền thời hạn và lý do cam kết (tối thiểu 3 ký tự).');
                          return;
                        }
                        setHasCommitment(true);
                      }}
                      className="h-10 px-6 bg-[#D97706] text-white rounded-lg text-sm font-semibold hover:bg-[#B45309] flex items-center gap-2"
                    >
                      <Send size={16} /> Tạo cam kết
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Check size={20} className="text-[#F59E0B]" />
                      <div className="text-sm font-semibold text-[#92400E]">
                        Đã tạo cam kết — bổ sung trước {commitmentDeadline}
                      </div>
                    </div>
                    <div className="text-xs text-[#92400E] bg-[#FFFBEB] border border-[#FDE68A] rounded p-3">
                      {commitmentReason}
                    </div>
                    <button
                      type="button"
                      onClick={() => setHasCommitment(false)}
                      className="mt-3 text-xs text-[#D97706] hover:underline"
                    >
                      Huỷ cam kết và chỉnh sửa
                    </button>
                  </div>
                )}
                <div className="text-xs text-[#7F1D1D] mt-3 italic">
                  Lưu ý: Cam kết hiện được lưu cục bộ và sẽ tạo thành Cam kết chính thức ở bước
                  sau (Phase D). Backend cam kết yêu cầu loại hồ sơ cụ thể.
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB PREVIEW */}
        {activeTab === 'preview' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-8">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-[#111827] mb-1">
                  HOÁ ĐƠN GIÁ TRỊ GIA TĂNG
                </h2>
                <p className="text-xs text-[#6B7280]">(Bản xem trước)</p>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-[#6B7280]">Khách hàng:</span>{' '}
                  <span className="font-medium text-[#111827]">
                    {customers.find((c) => c.id === customerId)?.name ?? '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280]">Loại hoá đơn:</span>{' '}
                  <span className="font-medium text-[#111827]">
                    {invoiceTypes.find((t) => t.id === watch('invoice_type_id'))?.name ?? '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280]">Loại dịch vụ:</span>{' '}
                  <span className="font-medium text-[#111827]">
                    {serviceTypes.find((s) => s.id === watch('service_type_id'))?.name ?? '—'}
                  </span>
                </div>
                <table className="w-full border border-[#E5E7EB] mt-4">
                  <tbody>
                    <tr>
                      <td className="border border-[#E5E7EB] px-4 py-2">Giá trị trước VAT</td>
                      <td className="border border-[#E5E7EB] px-4 py-2 text-right">
                        {formatVND(toNumber(amountBefore))} đ
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-[#E5E7EB] px-4 py-2">
                        Thuế GTGT ({toNumber(taxRate)}%)
                      </td>
                      <td className="border border-[#E5E7EB] px-4 py-2 text-right">
                        {formatVND(toNumber(watch('vat_amount')))} đ
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-[#E5E7EB] px-4 py-2 font-bold">Tổng cộng</td>
                      <td className="border border-[#E5E7EB] px-4 py-2 text-right font-bold text-[#EE0033]">
                        {formatVND(toNumber(watch('amount_after_vat')))} đ
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM ACTION BAR */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] px-6 py-4 z-20">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="h-10 px-6 text-sm font-medium text-[#6B7280] hover:text-[#374151]"
            >
              {canEdit ? 'Huỷ' : 'Quay lại'}
            </button>

            {uploadProgress && (
              <div className="text-xs text-[#6B7280] flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> {uploadProgress}
              </div>
            )}

            {canEdit && (
              <div className="flex gap-3 items-center">
                <span className="text-xs text-[#6B7280] flex items-center gap-2">
                  <span>Tạo bởi:</span>
                  <span className="font-medium text-[#111827]">{ownerName}</span>
                  <span>•</span>
                  <span>{ownerDept}</span>
                </span>
                {!canSubmitForApproval ? (
                  <button
                    type="button"
                    disabled
                    className="h-10 px-6 bg-[#9CA3AF] text-white rounded-lg text-sm font-semibold cursor-not-allowed flex items-center gap-2"
                    title="Cần đủ hồ sơ hoặc tạo cam kết"
                  >
                    <Lock size={16} /> Gửi phê duyệt
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || createMut.isPending}
                    className={`h-10 px-6 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isChecklistComplete
                        ? 'bg-[#EE0033] hover:bg-[#CC002B]'
                        : 'bg-[#D97706] hover:bg-[#B45309]'
                    }`}
                  >
                    {(isSubmitting || createMut.isPending) && (
                      <Loader2 size={16} className="animate-spin" />
                    )}
                    <Send size={16} />
                    {isChecklistComplete ? 'Tạo đề nghị' : 'Tạo đề nghị (có cam kết)'}
                  </button>
                )}
              </div>
            )}

            {!canEdit && !isCreateMode && status === 'rejected' && (
              <button
                type="button"
                className="h-10 px-6 bg-[#EE0033] text-white rounded-lg text-sm font-medium hover:bg-[#CC002B] flex items-center gap-2"
              >
                <Copy size={16} /> Tạo đề nghị mới từ bản này
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
