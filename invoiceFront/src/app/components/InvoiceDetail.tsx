import { useState, useRef } from 'react';
import {
  ArrowLeft,
  Loader2,
  FileText,
  Upload,
  Clock,
  AlertTriangle,
  Send,
  RotateCcw,
  Check,
  X,
  Bell,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from './ui/dialog';
import {
  useInvoiceRequest,
  useInvoiceRequestTimeline,
  useInvoiceRequestLegalDocuments,
  useCommitmentsForInvoiceRequest,
  useLegalDocumentsCatalog,
  useApproveInvoiceRequest,
  useReturnInvoiceRequest,
  useSubmitInvoiceRequest,
  useResubmitInvoiceRequest,
  useCreateCommitment,
  useExtendCommitment,
  useDecideCommitment,
  useRemindCommitment,
  useUploadInvoiceRequestLegalDocument,
  useSignature,
} from '../../lib/api/queries';
import { ApiError } from '../../lib/api/errors';
import { useAuth } from '../../lib/auth/AuthProvider';
import type { Commitment } from '../../lib/api/endpoints/commitments';
import type { LegalDocumentCatalog } from '../../lib/api/endpoints/masters';

interface InvoiceDetailProps {
  invoiceId: string | number;
  userRole: string;
  onBack: () => void;
}

// --- helpers ---
function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v.replace(/[^\d.-]/g, '')) || 0;
  return 0;
}

function formatVnd(n: number): string {
  return n.toLocaleString('vi-VN') + ' đ';
}

function formatDateTime(s: string): string {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString('vi-VN');
}

function formatBytes(n: number): string {
  if (!n) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function getStringProp(r: Record<string, unknown>, key: string): string {
  const v = r[key];
  return typeof v === 'string' ? v : '';
}

function getRelation(r: Record<string, unknown>, key: string): { id?: number; name?: string; tax_code?: string; code?: string } | null {
  const v = r[key];
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    return {
      id: typeof o.id === 'number' ? o.id : undefined,
      name: typeof o.name === 'string' ? o.name : undefined,
      tax_code: typeof o.tax_code === 'string' ? o.tax_code : undefined,
      code: typeof o.code === 'string' ? o.code : undefined,
    };
  }
  return null;
}

interface NormalizedRequest {
  id: number;
  code: string;
  invoiceNo: string;
  status: string;
  beforeVat: number;
  afterVat: number;
  vatAmount: number;
  taxRate: number;
  serviceType: string;
  customer: { name: string; tax_code: string } | null;
  invoiceType: { name: string } | null;
  revenueCenter: { name: string } | null;
  creator: { id?: number; name: string } | null;
  currentHandler: { name: string } | null;
  createdAt: string;
  legalComplete: boolean;
  notes: string;
  returnReason: string;
  rejectionReason: string;
  createdById: number | null;
}

function normalizeRequest(raw: unknown): NormalizedRequest | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const stRaw = r.service_type;
  let serviceType = '';
  if (typeof stRaw === 'string') {
    serviceType = stRaw;
  } else if (stRaw && typeof stRaw === 'object') {
    const o = stRaw as Record<string, unknown>;
    serviceType = typeof o.name === 'string' ? o.name : '';
  }
  return {
    id: typeof r.id === 'number' ? r.id : Number(r.id) || 0,
    code: String(r.request_code ?? r.code ?? ''),
    invoiceNo: typeof r.invoice_no === 'string' ? r.invoice_no : '',
    status: String(r.status ?? ''),
    beforeVat: toNum(r.before_vat ?? r.amount_before_vat),
    afterVat: toNum(r.after_vat ?? r.amount_after_vat),
    vatAmount: toNum(r.vat_amount),
    taxRate: toNum(r.tax_rate),
    serviceType,
    customer: getRelation(r, 'customer') as { name: string; tax_code: string } | null,
    invoiceType: getRelation(r, 'invoice_type') as { name: string } | null,
    revenueCenter: getRelation(r, 'revenue_center') as { name: string } | null,
    creator: getRelation(r, 'creator') as { id?: number; name: string } | null,
    currentHandler: getRelation(r, 'current_handler') as { name: string } | null,
    createdAt: getStringProp(r, 'created_at'),
    legalComplete: r.legal_complete === true,
    notes: getStringProp(r, 'notes'),
    returnReason: getStringProp(r, 'return_reason'),
    rejectionReason: getStringProp(r, 'rejection_reason'),
    createdById: typeof r.created_by_id === 'number' ? r.created_by_id : null,
  };
}

interface TimelineEntry {
  id: string;
  actor: string;
  action: string;
  note: string;
  createdAt: string;
}

function normalizeTimeline(e: Record<string, unknown>): TimelineEntry {
  let actor = '—';
  if (typeof e.actor === 'string') {
    actor = e.actor;
  } else if (e.actor && typeof e.actor === 'object') {
    const o = e.actor as Record<string, unknown>;
    if (typeof o.name === 'string') actor = o.name;
  } else if (typeof e.actor_name === 'string') {
    actor = e.actor_name;
  }
  return {
    id: String(e.id ?? ''),
    actor,
    action: String(e.action ?? e.event ?? ''),
    note: typeof e.note === 'string' ? e.note : typeof e.message === 'string' ? e.message : '',
    createdAt: typeof e.created_at === 'string' ? e.created_at : '',
  };
}

interface LegalDocEntry {
  id: string;
  documentType: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

function normalizeLegalDoc(e: Record<string, unknown>): LegalDocEntry {
  let docType = '';
  const dt = e.document_type;
  if (typeof dt === 'string') {
    docType = dt;
  } else if (dt && typeof dt === 'object') {
    const o = dt as Record<string, unknown>;
    if (typeof o.name === 'string') docType = o.name;
  }
  return {
    id: String(e.id ?? ''),
    documentType: docType,
    originalFilename:
      typeof e.original_filename === 'string'
        ? e.original_filename
        : typeof e.filename === 'string'
          ? e.filename
          : '—',
    fileSize: toNum(e.file_size),
    mimeType: typeof e.mime_type === 'string' ? e.mime_type : '',
    createdAt: typeof e.created_at === 'string' ? e.created_at : '',
  };
}

function errMsg(e: unknown, fallback: string): string {
  if (e instanceof ApiError) {
    if (e.isSignatureRequired()) return 'Cần thiết lập chữ ký điện tử trước khi duyệt.';
    return e.message;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}

function InlineError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-sm rounded-md px-3 py-2">
      {message}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let cls = 'bg-[#F3F4F6] text-[#374151]';
  let label = status || '—';
  if (status === 'draft') {
    cls = 'bg-[#F3F4F6] text-[#374151]';
    label = 'Nháp';
  } else if (status.startsWith('pending') || status === 'resubmitted') {
    cls = 'bg-[#DBEAFE] text-[#1E40AF]';
    label = status === 'resubmitted' ? 'Đã gửi lại' : 'Chờ duyệt';
  } else if (status === 'approved' || status === 'issued') {
    cls = 'bg-[#D1FAE5] text-[#065F46]';
    label = status === 'issued' ? 'Đã xuất HĐ' : 'Đã duyệt';
  } else if (status === 'rejected') {
    cls = 'bg-[#FEE2E2] text-[#991B1B]';
    label = 'Từ chối';
  } else if (status === 'returned') {
    cls = 'bg-[#FEF3C7] text-[#92400E]';
    label = 'Trả lại';
  } else if (status === 'cancelled') {
    cls = 'bg-[#F3F4F6] text-[#374151]';
    label = 'Đã hủy';
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function CommitmentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    pending: { cls: 'bg-[#DBEAFE] text-[#1E40AF]', label: 'Chờ xử lý' },
    approved: { cls: 'bg-[#D1FAE5] text-[#065F46]', label: 'Đã duyệt' },
    rejected: { cls: 'bg-[#FEE2E2] text-[#991B1B]', label: 'Từ chối' },
    extended: { cls: 'bg-[#FEF3C7] text-[#92400E]', label: 'Gia hạn' },
    completed: { cls: 'bg-[#D1FAE5] text-[#065F46]', label: 'Hoàn thành' },
    expired: { cls: 'bg-[#FEE2E2] text-[#991B1B]', label: 'Quá hạn' },
  };
  const entry = map[status] ?? { cls: 'bg-[#F3F4F6] text-[#374151]', label: status || '—' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${entry.cls}`}>
      {entry.label}
    </span>
  );
}

function isApproverRole(role: string): boolean {
  return role === 'manager' || role === 'accountant' || role === 'director' || role === 'admin';
}

function stageMatchesRole(status: string, role: string): boolean {
  if (status === 'pending-vpgd') return role === 'manager';
  if (status === 'pending-accountant') return role === 'accountant';
  if (status === 'pending-director') return role === 'director' || role === 'admin';
  return false;
}

function hasSignature(sig: unknown): boolean {
  if (!sig || typeof sig !== 'object') return false;
  const o = sig as Record<string, unknown>;
  return !!o.signature_image_url || o.has_signature === true;
}

export default function InvoiceDetail({ invoiceId, userRole, onBack }: InvoiceDetailProps) {
  const auth = useAuth();
  const { data: rawRequest, isLoading: loadingReq, error: reqError } = useInvoiceRequest(invoiceId);
  const { data: rawTimeline, isLoading: loadingTimeline } = useInvoiceRequestTimeline(invoiceId);
  const { data: rawLegalDocs, isLoading: loadingDocs } = useInvoiceRequestLegalDocuments(invoiceId);
  const { data: commitmentsData } = useCommitmentsForInvoiceRequest(invoiceId);
  const { data: catalogData } = useLegalDocumentsCatalog({ enabled: true });
  const { data: sigData } = useSignature();

  const submitMut = useSubmitInvoiceRequest();
  const resubmitMut = useResubmitInvoiceRequest();
  const approveMut = useApproveInvoiceRequest();
  const returnMut = useReturnInvoiceRequest();
  const createCommitmentMut = useCreateCommitment(invoiceId);
  const extendCommitmentMut = useExtendCommitment();
  const decideCommitmentMut = useDecideCommitment();
  const remindCommitmentMut = useRemindCommitment();
  const uploadDocMut = useUploadInvoiceRequestLegalDocument(invoiceId);

  // dialog state
  const [showApprove, setShowApprove] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocId, setUploadDocId] = useState<number | ''>('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // commitment create state
  const [newCommitDocId, setNewCommitDocId] = useState<number | ''>('');
  const [newCommitReason, setNewCommitReason] = useState('');
  const [newCommitDueDate, setNewCommitDueDate] = useState('');
  const [commitCreateError, setCommitCreateError] = useState<string | null>(null);

  // commitment per-action state
  const [decideTarget, setDecideTarget] = useState<{ id: number; decision: 'approved' | 'rejected' } | null>(null);
  const [decideReason, setDecideReason] = useState('');
  const [decideError, setDecideError] = useState<string | null>(null);

  const [extendTarget, setExtendTarget] = useState<number | null>(null);
  const [extendDate, setExtendDate] = useState('');
  const [extendReason, setExtendReason] = useState('');
  const [extendError, setExtendError] = useState<string | null>(null);

  const inv = normalizeRequest(rawRequest);
  const timeline: TimelineEntry[] = Array.isArray(rawTimeline)
    ? rawTimeline.map((e) => normalizeTimeline(e))
    : [];
  const legalDocs: LegalDocEntry[] = Array.isArray(rawLegalDocs)
    ? rawLegalDocs.map((e) => normalizeLegalDoc(e))
    : [];
  const commitments: Commitment[] = commitmentsData ?? [];
  const catalog: LegalDocumentCatalog[] = catalogData?.data ?? [];

  const currentUserId = auth.user?.id ?? null;
  const isCreator = !!(inv && currentUserId && inv.createdById === currentUserId);
  const isAdmin = userRole === 'admin';
  const isApprover = isApproverRole(userRole);
  const sigReady = hasSignature(sigData);
  const canManageLegal = isCreator || isAdmin || auth.hasPermission('legal.manage');
  const canCreateCommitment =
    isApprover && !commitments.some((c) => c.status === 'pending');
  const canNotify = auth.hasPermission('notifications.send') || isApprover || isCreator;

  // --- actions ---
  async function doSubmit() {
    if (!inv) return;
    setActionError(null);
    try {
      await submitMut.mutateAsync({ id: inv.id });
    } catch (e) {
      setActionError(errMsg(e, 'Không thể gửi duyệt.'));
    }
  }

  async function doResubmit() {
    if (!inv) return;
    setActionError(null);
    try {
      await resubmitMut.mutateAsync({ id: inv.id });
    } catch (e) {
      setActionError(errMsg(e, 'Không thể gửi lại.'));
    }
  }

  async function doApprove() {
    if (!inv) return;
    setActionError(null);
    try {
      await approveMut.mutateAsync({ id: inv.id, payload: {} });
      setShowApprove(false);
    } catch (e) {
      setActionError(errMsg(e, 'Không thể duyệt.'));
    }
  }

  async function doReturn() {
    if (!inv) return;
    if (!returnReason.trim()) {
      setActionError('Vui lòng nhập lý do trả lại.');
      return;
    }
    setActionError(null);
    try {
      await returnMut.mutateAsync({ id: inv.id, payload: { reason: returnReason.trim() } });
      setShowReturn(false);
      setReturnReason('');
    } catch (e) {
      setActionError(errMsg(e, 'Không thể trả lại.'));
    }
  }

  async function doUpload() {
    setUploadError(null);
    if (!uploadFile) {
      setUploadError('Vui lòng chọn tệp.');
      return;
    }
    if (uploadDocId === '') {
      setUploadError('Vui lòng chọn loại tài liệu.');
      return;
    }
    try {
      await uploadDocMut.mutateAsync({
        file: uploadFile,
        legalDocumentId: Number(uploadDocId),
        notes: uploadNotes.trim() || undefined,
      });
      setUploadFile(null);
      setUploadDocId('');
      setUploadNotes('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      setUploadError(errMsg(e, 'Tải lên thất bại.'));
    }
  }

  async function doCreateCommitment() {
    setCommitCreateError(null);
    if (newCommitDocId === '') {
      setCommitCreateError('Vui lòng chọn loại tài liệu.');
      return;
    }
    if (!newCommitReason.trim()) {
      setCommitCreateError('Vui lòng nhập lý do cam kết.');
      return;
    }
    if (!newCommitDueDate) {
      setCommitCreateError('Vui lòng chọn hạn cam kết.');
      return;
    }
    try {
      await createCommitmentMut.mutateAsync({
        document_type_id: Number(newCommitDocId),
        reason: newCommitReason.trim(),
        due_date: newCommitDueDate,
      });
      setNewCommitDocId('');
      setNewCommitReason('');
      setNewCommitDueDate('');
    } catch (e) {
      setCommitCreateError(errMsg(e, 'Không thể tạo cam kết.'));
    }
  }

  async function doDecideCommitment() {
    if (!decideTarget) return;
    setDecideError(null);
    try {
      await decideCommitmentMut.mutateAsync({
        id: decideTarget.id,
        payload: {
          decision: decideTarget.decision,
          reason: decideReason.trim() || undefined,
        },
      });
      setDecideTarget(null);
      setDecideReason('');
    } catch (e) {
      setDecideError(errMsg(e, 'Không thể xử lý cam kết.'));
    }
  }

  async function doExtendCommitment() {
    if (extendTarget == null) return;
    setExtendError(null);
    if (!extendDate) {
      setExtendError('Vui lòng chọn hạn mới.');
      return;
    }
    if (!extendReason.trim()) {
      setExtendError('Vui lòng nhập lý do gia hạn.');
      return;
    }
    try {
      await extendCommitmentMut.mutateAsync({
        id: extendTarget,
        payload: { new_due_date: extendDate, reason: extendReason.trim() },
      });
      setExtendTarget(null);
      setExtendDate('');
      setExtendReason('');
    } catch (e) {
      setExtendError(errMsg(e, 'Không thể gia hạn.'));
    }
  }

  async function doRemind(id: number) {
    try {
      await remindCommitmentMut.mutateAsync(id);
    } catch {
      // silent — UI is small button
    }
  }

  // --- render guards ---
  if (loadingReq) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-xl py-12 flex items-center justify-center gap-2 text-[#6B7280]">
        <Loader2 size={20} className="animate-spin" />
        <span>Đang tải...</span>
      </div>
    );
  }

  if (reqError || !inv) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-[#374151] hover:text-[#EE0033]"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
        <InlineError message={reqError instanceof Error ? reqError.message : 'Không tìm thấy đề nghị.'} />
      </div>
    );
  }

  const canSubmit = inv.status === 'draft' && (isCreator || isAdmin);
  const canResubmit = inv.status === 'returned' && isCreator;
  const canApproveStage = stageMatchesRole(inv.status, userRole) || (inv.status.startsWith('pending') && isAdmin);

  const isActing =
    approveMut.isPending ||
    returnMut.isPending ||
    submitMut.isPending ||
    resubmitMut.isPending;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={onBack}
            className="mt-1 p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft size={18} className="text-[#374151]" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-[#111827]">Chi tiết đề nghị xuất hóa đơn</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-[#6B7280]">
              <span className="font-medium text-[#EE0033]">{inv.code || `#${inv.id}`}</span>
              <StatusBadge status={inv.status} />
            </div>
          </div>
        </div>
      </div>

      <InlineError message={actionError} />

      {/* Return / Rejection banner */}
      {(inv.returnReason || inv.rejectionReason) && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-sm rounded-md px-4 py-3 flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium">
              {inv.rejectionReason ? 'Lý do từ chối' : 'Lý do trả lại'}
            </div>
            <div className="mt-0.5">{inv.rejectionReason || inv.returnReason}</div>
          </div>
        </div>
      )}

      {/* Key info */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Thông tin chung</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <InfoRow
            label="Khách hàng"
            value={
              inv.customer
                ? `${inv.customer.name}${inv.customer.tax_code ? ` (MST: ${inv.customer.tax_code})` : ''}`
                : '—'
            }
          />
          <InfoRow label="Loại hóa đơn" value={inv.invoiceType?.name ?? '—'} />
          <InfoRow label="Loại dịch vụ" value={inv.serviceType || '—'} />
          <InfoRow label="Trung tâm doanh thu" value={inv.revenueCenter?.name ?? '—'} />
          <InfoRow label="Người tạo" value={inv.creator?.name ?? '—'} />
          <InfoRow label="Người xử lý hiện tại" value={inv.currentHandler?.name ?? '—'} />
          <InfoRow label="Ngày tạo" value={formatDateTime(inv.createdAt)} />
          <InfoRow
            label="Trạng thái pháp lý"
            value={inv.legalComplete ? 'Đầy đủ' : 'Còn thiếu'}
            valueClass={inv.legalComplete ? 'text-[#065F46]' : 'text-[#92400E]'}
          />
          {inv.invoiceNo && <InfoRow label="Số hóa đơn" value={inv.invoiceNo} />}
          {inv.notes && <InfoRow label="Ghi chú" value={inv.notes} fullWidth />}
        </div>
      </div>

      {/* Amounts */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Giá trị</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <AmountBox label="Trước thuế" value={formatVnd(inv.beforeVat)} />
          <AmountBox label="Thuế suất" value={`${inv.taxRate}%`} />
          <AmountBox label="Thuế VAT" value={formatVnd(inv.vatAmount)} />
          <AmountBox label="Sau thuế" value={formatVnd(inv.afterVat)} emphasis />
        </div>
      </div>

      {/* Actions */}
      {(canSubmit || canResubmit || canApproveStage) && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#111827] mb-4">Thao tác</h2>
          <div className="flex flex-wrap gap-3">
            {canSubmit && (
              <button
                onClick={doSubmit}
                disabled={isActing}
                className="h-9 px-4 bg-[#16A34A] text-white text-sm font-medium rounded-lg hover:bg-[#15803D] disabled:opacity-50 flex items-center gap-2"
              >
                <Send size={14} />
                {submitMut.isPending ? 'Đang gửi...' : 'Gửi duyệt'}
              </button>
            )}
            {canResubmit && (
              <button
                onClick={doResubmit}
                disabled={isActing}
                className="h-9 px-4 bg-[#D97706] text-white text-sm font-medium rounded-lg hover:bg-[#B45309] disabled:opacity-50 flex items-center gap-2"
              >
                <RotateCcw size={14} />
                {resubmitMut.isPending ? 'Đang gửi...' : 'Gửi lại'}
              </button>
            )}
            {canApproveStage && (
              <>
                <button
                  onClick={() => {
                    setActionError(null);
                    setShowApprove(true);
                  }}
                  disabled={isActing || !sigReady}
                  title={!sigReady ? 'Cần thiết lập chữ ký điện tử trước khi duyệt.' : undefined}
                  className="h-9 px-4 bg-[#16A34A] text-white text-sm font-medium rounded-lg hover:bg-[#15803D] disabled:opacity-50 flex items-center gap-2"
                >
                  <Check size={14} />
                  Duyệt
                </button>
                <button
                  onClick={() => {
                    setActionError(null);
                    setShowReturn(true);
                  }}
                  disabled={isActing}
                  className="h-9 px-4 bg-white text-[#DC2626] border border-[#DC2626] text-sm font-medium rounded-lg hover:bg-[#FEE2E2] disabled:opacity-50 flex items-center gap-2"
                >
                  <X size={14} />
                  Trả lại
                </button>
              </>
            )}
            {canApproveStage && !sigReady && (
              <div className="text-xs text-[#92400E] bg-[#FEF3C7] border border-[#FCD34D] rounded px-3 py-2 flex items-center gap-2">
                <AlertTriangle size={14} />
                Cần thiết lập chữ ký điện tử trước khi duyệt.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Lịch sử</h2>
        {loadingTimeline ? (
          <div className="flex items-center justify-center py-8 gap-2 text-[#6B7280]">
            <Loader2 size={18} className="animate-spin" />
            <span>Đang tải...</span>
          </div>
        ) : timeline.length === 0 ? (
          <p className="text-sm text-[#6B7280]">Chưa có hoạt động.</p>
        ) : (
          <ul className="space-y-3">
            {timeline.map((t, idx) => (
              <li key={t.id || idx} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                  <Clock size={14} className="text-[#6B7280]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#111827]">
                    <span className="font-medium">{t.actor}</span>
                    {t.action && <span className="text-[#6B7280]"> — {t.action}</span>}
                  </div>
                  {t.note && <div className="text-xs text-[#6B7280] mt-0.5">{t.note}</div>}
                  {t.createdAt && (
                    <div className="text-xs text-[#9CA3AF] mt-0.5">{formatDateTime(t.createdAt)}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Legal documents */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Hồ sơ pháp lý</h2>
        {loadingDocs ? (
          <div className="flex items-center justify-center py-8 gap-2 text-[#6B7280]">
            <Loader2 size={18} className="animate-spin" />
            <span>Đang tải...</span>
          </div>
        ) : legalDocs.length === 0 ? (
          <p className="text-sm text-[#6B7280]">Chưa có tài liệu nào.</p>
        ) : (
          <ul className="space-y-2 mb-4">
            {legalDocs.map((d) => (
              <li
                key={d.id}
                className="flex items-start gap-3 border border-[#E5E7EB] rounded-lg p-3"
              >
                <FileText size={18} className="text-[#6B7280] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#111827] truncate">{d.originalFilename}</div>
                  <div className="text-xs text-[#6B7280] mt-0.5">
                    {d.documentType && <span>{d.documentType} · </span>}
                    {formatBytes(d.fileSize)}
                    {d.createdAt && <span> · {formatDateTime(d.createdAt)}</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {canManageLegal && (
          <div className="border border-dashed border-[#D1D5DB] rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#111827]">Tải lên tài liệu</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
              <select
                value={uploadDocId === '' ? '' : String(uploadDocId)}
                onChange={(e) =>
                  setUploadDocId(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="h-9 px-3 rounded-lg border border-[#D1D5DB] text-sm focus:ring-2 focus:ring-[#EE0033] focus:border-[#EE0033] outline-none"
              >
                <option value="">-- Chọn loại tài liệu --</option>
                {catalog.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={uploadNotes}
              onChange={(e) => setUploadNotes(e.target.value)}
              placeholder="Ghi chú (tùy chọn)"
              rows={2}
              className="w-full rounded-lg border border-[#D1D5DB] p-2 text-sm focus:ring-2 focus:ring-[#EE0033] focus:border-[#EE0033] outline-none"
            />
            <InlineError message={uploadError} />
            <button
              onClick={doUpload}
              disabled={uploadDocMut.isPending}
              className="h-9 px-4 bg-[#EE0033] text-white text-sm font-medium rounded-lg hover:bg-[#CC002B] disabled:opacity-50 flex items-center gap-2"
            >
              <Upload size={14} />
              {uploadDocMut.isPending ? 'Đang tải...' : 'Tải lên'}
            </button>
          </div>
        )}
      </div>

      {/* Commitments */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Cam kết bổ sung hồ sơ</h2>
        {commitments.length === 0 ? (
          <p className="text-sm text-[#6B7280] mb-4">Chưa có cam kết nào.</p>
        ) : (
          <ul className="space-y-3 mb-4">
            {commitments.map((c) => (
              <li key={c.id} className="border border-[#E5E7EB] rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[#111827]">
                        {c.document_type?.name ?? 'Cam kết bổ sung'}
                      </span>
                      <CommitmentStatusBadge status={c.status} />
                    </div>
                    {c.reason && <div className="text-sm text-[#374151] mb-1">{c.reason}</div>}
                    <div className="text-xs text-[#6B7280]">
                      Hạn: {c.due_date || '—'}
                      {c.decided_by?.name && <span> · Người duyệt: {c.decided_by.name}</span>}
                    </div>
                    {c.decision_reason && (
                      <div className="text-xs text-[#6B7280] mt-1">Lý do quyết định: {c.decision_reason}</div>
                    )}
                  </div>
                  {c.status === 'pending' && (
                    <div className="flex flex-wrap gap-2">
                      {isApprover && (
                        <>
                          <button
                            onClick={() => {
                              setDecideError(null);
                              setDecideReason('');
                              setDecideTarget({ id: c.id, decision: 'approved' });
                            }}
                            className="h-8 px-3 bg-[#16A34A] text-white text-xs font-medium rounded-lg hover:bg-[#15803D]"
                          >
                            Duyệt cam kết
                          </button>
                          <button
                            onClick={() => {
                              setDecideError(null);
                              setDecideReason('');
                              setDecideTarget({ id: c.id, decision: 'rejected' });
                            }}
                            className="h-8 px-3 bg-white text-[#DC2626] border border-[#DC2626] text-xs font-medium rounded-lg hover:bg-[#FEE2E2]"
                          >
                            Từ chối cam kết
                          </button>
                        </>
                      )}
                      {isCreator && (
                        <button
                          onClick={() => {
                            setExtendError(null);
                            setExtendDate('');
                            setExtendReason('');
                            setExtendTarget(c.id);
                          }}
                          className="h-8 px-3 bg-white text-[#D97706] border border-[#D97706] text-xs font-medium rounded-lg hover:bg-[#FEF3C7]"
                        >
                          Gia hạn
                        </button>
                      )}
                      {canNotify && (
                        <button
                          onClick={() => doRemind(c.id)}
                          disabled={remindCommitmentMut.isPending}
                          className="h-8 px-3 bg-white text-[#1D4ED8] border border-[#1D4ED8] text-xs font-medium rounded-lg hover:bg-[#DBEAFE] disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <Bell size={12} />
                          Nhắc nhở
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {canCreateCommitment && (
          <div className="border border-dashed border-[#D1D5DB] rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#111827] flex items-center gap-2">
              <Plus size={14} />
              Tạo cam kết mới
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={newCommitDocId === '' ? '' : String(newCommitDocId)}
                onChange={(e) =>
                  setNewCommitDocId(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="h-9 px-3 rounded-lg border border-[#D1D5DB] text-sm focus:ring-2 focus:ring-[#EE0033] focus:border-[#EE0033] outline-none"
              >
                <option value="">-- Chọn loại tài liệu --</option>
                {catalog.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={newCommitDueDate}
                onChange={(e) => setNewCommitDueDate(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#D1D5DB] text-sm focus:ring-2 focus:ring-[#EE0033] focus:border-[#EE0033] outline-none"
              />
            </div>
            <textarea
              value={newCommitReason}
              onChange={(e) => setNewCommitReason(e.target.value)}
              placeholder="Lý do cam kết..."
              rows={2}
              className="w-full rounded-lg border border-[#D1D5DB] p-2 text-sm focus:ring-2 focus:ring-[#EE0033] focus:border-[#EE0033] outline-none"
            />
            <InlineError message={commitCreateError} />
            <button
              onClick={doCreateCommitment}
              disabled={createCommitmentMut.isPending}
              className="h-9 px-4 bg-[#EE0033] text-white text-sm font-medium rounded-lg hover:bg-[#CC002B] disabled:opacity-50"
            >
              {createCommitmentMut.isPending ? 'Đang tạo...' : 'Tạo cam kết'}
            </button>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      <Dialog open={showApprove} onOpenChange={setShowApprove}>
        <DialogContent className="md:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6 text-green-600" />
            </div>
            <DialogTitle className="text-center">Xác nhận phê duyệt</DialogTitle>
            <DialogDescription className="text-center">
              Đề nghị xuất hóa đơn mã {inv.code || `#${inv.id}`}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-3">
            <p className="text-sm text-gray-700">
              Tôi xác nhận đã soát xét đầy đủ hồ sơ đề nghị và đồng ý phê duyệt.
            </p>
            <InlineError message={actionError} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button className="h-9 px-4 bg-white border border-[#D1D5DB] text-sm font-medium text-[#374151] rounded-lg hover:bg-[#F9FAFB]">
                Hủy
              </button>
            </DialogClose>
            <button
              onClick={doApprove}
              disabled={isActing}
              className="h-9 px-4 bg-[#EE0033] text-white text-sm font-medium rounded-lg hover:bg-[#CC002B] disabled:opacity-50"
            >
              {approveMut.isPending ? 'Đang duyệt...' : 'Xác nhận duyệt'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Modal */}
      <Dialog open={showReturn} onOpenChange={setShowReturn}>
        <DialogContent className="md:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Trả lại đề nghị</DialogTitle>
            <DialogDescription className="text-center">
              Đề nghị xuất hóa đơn mã {inv.code || `#${inv.id}`}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-3">
            <label className="block text-sm font-medium text-[#374151]">
              Lý do trả lại <span className="text-[#DC2626]">*</span>
            </label>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              rows={4}
              placeholder="Nhập lý do..."
              className="w-full rounded-lg border border-[#D1D5DB] p-3 text-sm focus:ring-2 focus:ring-[#EE0033] focus:border-[#EE0033] outline-none"
            />
            <InlineError message={actionError} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button className="h-9 px-4 bg-white border border-[#D1D5DB] text-sm font-medium text-[#374151] rounded-lg hover:bg-[#F9FAFB]">
                Hủy
              </button>
            </DialogClose>
            <button
              onClick={doReturn}
              disabled={isActing || !returnReason.trim()}
              className="h-9 px-4 bg-[#DC2626] text-white text-sm font-medium rounded-lg hover:bg-[#B91C1C] disabled:opacity-50"
            >
              {returnMut.isPending ? 'Đang trả lại...' : 'Xác nhận trả lại'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decide commitment Modal */}
      <Dialog open={decideTarget !== null} onOpenChange={(o) => !o && setDecideTarget(null)}>
        <DialogContent className="md:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {decideTarget?.decision === 'approved' ? 'Duyệt cam kết' : 'Từ chối cam kết'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-3">
            <label className="block text-sm font-medium text-[#374151]">Lý do (tùy chọn)</label>
            <textarea
              value={decideReason}
              onChange={(e) => setDecideReason(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-[#D1D5DB] p-3 text-sm focus:ring-2 focus:ring-[#EE0033] focus:border-[#EE0033] outline-none"
            />
            <InlineError message={decideError} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button className="h-9 px-4 bg-white border border-[#D1D5DB] text-sm font-medium text-[#374151] rounded-lg hover:bg-[#F9FAFB]">
                Hủy
              </button>
            </DialogClose>
            <button
              onClick={doDecideCommitment}
              disabled={decideCommitmentMut.isPending}
              className={`h-9 px-4 text-white text-sm font-medium rounded-lg disabled:opacity-50 ${
                decideTarget?.decision === 'approved'
                  ? 'bg-[#16A34A] hover:bg-[#15803D]'
                  : 'bg-[#DC2626] hover:bg-[#B91C1C]'
              }`}
            >
              {decideCommitmentMut.isPending ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend commitment Modal */}
      <Dialog open={extendTarget !== null} onOpenChange={(o) => !o && setExtendTarget(null)}>
        <DialogContent className="md:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Gia hạn cam kết</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-3">
            <label className="block text-sm font-medium text-[#374151]">
              Hạn mới <span className="text-[#DC2626]">*</span>
            </label>
            <input
              type="date"
              value={extendDate}
              onChange={(e) => setExtendDate(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[#D1D5DB] text-sm focus:ring-2 focus:ring-[#EE0033] focus:border-[#EE0033] outline-none"
            />
            <label className="block text-sm font-medium text-[#374151]">
              Lý do <span className="text-[#DC2626]">*</span>
            </label>
            <textarea
              value={extendReason}
              onChange={(e) => setExtendReason(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-[#D1D5DB] p-3 text-sm focus:ring-2 focus:ring-[#EE0033] focus:border-[#EE0033] outline-none"
            />
            <InlineError message={extendError} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button className="h-9 px-4 bg-white border border-[#D1D5DB] text-sm font-medium text-[#374151] rounded-lg hover:bg-[#F9FAFB]">
                Hủy
              </button>
            </DialogClose>
            <button
              onClick={doExtendCommitment}
              disabled={extendCommitmentMut.isPending}
              className="h-9 px-4 bg-[#D97706] text-white text-sm font-medium rounded-lg hover:bg-[#B45309] disabled:opacity-50"
            >
              {extendCommitmentMut.isPending ? 'Đang gia hạn...' : 'Xác nhận'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueClass,
  fullWidth,
}: {
  label: string;
  value: string;
  valueClass?: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? 'md:col-span-2' : ''}>
      <div className="text-xs font-medium text-[#6B7280] uppercase mb-1">{label}</div>
      <div className={`text-sm ${valueClass ?? 'text-[#111827]'}`}>{value}</div>
    </div>
  );
}

function AmountBox({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="bg-[#F9FAFB] rounded-lg p-4">
      <div className="text-xs font-medium text-[#6B7280] uppercase mb-1">{label}</div>
      <div
        className={
          emphasis
            ? 'text-xl font-semibold text-[#EE0033]'
            : 'text-base font-medium text-[#111827]'
        }
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </div>
    </div>
  );
}
