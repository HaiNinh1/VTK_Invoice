// MASTER INVOICE REQUEST DATA — BACKEND-DRIVEN
// Originally a static array; now a hook that fetches /invoice-requests and
// maps backend `InvoiceRequest` rows to the legacy frontend shape consumed by
// all dashboards / lists / approval / reports / accounting components.
//
// Consumers (DashboardEmployee/Manager/Company, InvoiceListRoleBased,
// ApprovalRoleBased, LegalTracking, InvoiceExport, AccountingVFS, Reports, App)
// destructure the same names they used to import statically:
//
//   const { MASTER_INVOICE_DATA, getPendingApprovals, ... } = useMasterInvoiceData();

import {
  createContext,
  useContext,
  useMemo,
  ReactNode,
  createElement,
} from 'react';
import { useInvoiceRequests } from '../../lib/api/queries';
import type { InvoiceRequest as BackendInvoiceRequest } from '../../lib/api/types';

// ---------- Legacy public type (consumed by components) ----------
export interface InvoiceRequest {
  id: number;
  requestCode: string;
  invoiceNo: string;
  customer: string;
  taxCode: string;
  serviceType: string;
  beforeVAT: number;
  taxRate: string;
  afterVAT: number;
  revenueCenter: string;
  creator: string;
  department: string;
  createdDate: string;
  status: 'draft' | 'pending' | 'pending-vpgd' | 'approved' | 'issued' | 'rejected' | 'accounted';
  legalStatus: {
    completed: number;
    total: number;
    status: 'complete' | 'insufficient' | 'overdue' | 'supplementing';
  };
  commitment: {
    code: string;
    status: 'active' | 'overdue' | 'near-due';
    deadline: string;
    daysRemaining: number;
    content: string;
    createdBy: string;
    createdDate: string;
  } | null;
  sInvoiceStatus: 'completed' | 'sent-to-cqt' | 'error' | 'pending' | 'none';
  sInvoiceCode?: string;
  sInvoiceError?: string;
  vfsStatus: 'completed' | 'processing' | 'pending' | 'none';
}

// ---------- helpers ----------
function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v) || 0;
  return 0;
}

function formatDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function mapStatus(api: string): InvoiceRequest['status'] {
  // Map every backend kebab/snake variant onto the legacy union the UI knows.
  // Backend emits: draft, pending (=accountant stage), pending-vpgd (=director stage),
  //                approved, rejected, returned, resubmitted, issued, cancelled.
  switch (api) {
    case 'draft':
      return 'draft';
    case 'pending-vpgd':
    case 'pending_vpgd':
      return 'pending-vpgd';
    case 'pending':
    case 'pending-accountant':
    case 'pending_accountant':
    case 'pending-director':
    case 'pending_director':
    case 'resubmitted':
      return 'pending';
    case 'approved':
      return 'approved';
    case 'rejected':
    case 'returned':
      return 'rejected';
    case 'issued':
      return 'issued';
    case 'accounted':
      return 'accounted';
    default:
      return 'pending';
  }
}

function mapLegalStatus(b: BackendInvoiceRequest): InvoiceRequest['legalStatus'] {
  // Backend now returns `legal_status` (was `legal_status_cache`). Tolerate both for safety.
  const cache = ((b.legal_status ?? (b as unknown as { legal_status_cache?: unknown }).legal_status_cache) ?? {}) as {
    completed?: number;
    total?: number;
    status?: string;
  };
  const completed = typeof cache.completed === 'number' ? cache.completed : b.legal_complete ? 1 : 0;
  const total = typeof cache.total === 'number' ? cache.total : 1;
  let status: InvoiceRequest['legalStatus']['status'] = 'complete';
  if (cache.status === 'overdue') status = 'overdue';
  else if (cache.status === 'in-progress' || cache.status === 'in_progress') status = 'supplementing';
  else if (b.legal_complete) status = 'complete';
  else status = 'insufficient';
  return { completed, total, status };
}

function mapSInvoice(s: string | null | undefined): InvoiceRequest['sInvoiceStatus'] {
  switch (s) {
    case 'completed':
    case 'issued':
      return 'completed';
    case 'sent_to_cqt':
    case 'sent-to-cqt':
      return 'sent-to-cqt';
    case 'error':
      return 'error';
    case 'pending':
    case 'pushing':
      return 'pending';
    default:
      return 'none';
  }
}

function mapVfs(s: string | null | undefined): InvoiceRequest['vfsStatus'] {
  switch (s) {
    case 'completed':
    case 'posted':
      return 'completed';
    case 'processing':
      return 'processing';
    case 'pending':
      return 'pending';
    default:
      return 'none';
  }
}

function mapCommitment(b: BackendInvoiceRequest): InvoiceRequest['commitment'] {
  if (!b.commitment) return null;
  const c = b.commitment;
  const deadline = c.deadline ? formatDate(c.deadline) : '';
  // Map backend kebab statuses to legacy UI buckets.
  let status: NonNullable<InvoiceRequest['commitment']>['status'] = 'active';
  if (c.status === 'expired' || c.status === 'overdue') status = 'overdue';
  else if (c.status === 'pending') status = 'near-due';
  return {
    code: c.code,
    status,
    deadline,
    daysRemaining: 0,
    content: '',
    createdBy: '',
    createdDate: '',
  };
}

function mapBackendRecord(b: BackendInvoiceRequest): InvoiceRequest {
  // Backend now exposes request_code, before_vat, after_vat, invoice_no,
  // s_invoice_status, vfs_status, commitment, creator. We map them properly.
  const serviceTypeName =
    typeof b.service_type === 'string'
      ? b.service_type
      : b.invoice_type?.name ?? '—';
  const revenueCenterCode =
    typeof b.revenue_center === 'string' ? b.revenue_center : '';
  return {
    id: b.id,
    requestCode: b.request_code,
    invoiceNo: b.invoice_no ?? '',
    customer: b.customer?.name ?? '—',
    taxCode: b.customer?.tax_code ?? '',
    serviceType: serviceTypeName,
    beforeVAT: toNumber(b.before_vat),
    taxRate: b.tax_rate != null ? `${Number(b.tax_rate)}%` : '10%',
    afterVAT: toNumber(b.after_vat),
    revenueCenter: revenueCenterCode,
    creator: b.creator?.name ?? '—',
    department: revenueCenterCode,
    createdDate: formatDate(b.created_at),
    status: mapStatus(b.status),
    legalStatus: mapLegalStatus(b),
    commitment: mapCommitment(b),
    sInvoiceStatus: mapSInvoice(b.s_invoice_status),
    sInvoiceCode: b.s_invoice_code ?? undefined,
    sInvoiceError: b.s_invoice_error ?? undefined,
    vfsStatus: mapVfs(b.vfs_status),
  };
}

// ---------- helper functions, all operating on the mapped list ----------
function buildHelpers(data: InvoiceRequest[]) {
  const getMonthlyStats = () => {
    const total = data.length;
    const issued = data.filter((r) => r.status === 'issued' || r.status === 'accounted').length;
    const pending = data.filter((r) => r.status === 'pending' || r.status === 'pending-vpgd').length;
    const approved = data.filter((r) => r.status === 'approved').length;
    return { total, issued, pending, approved };
  };

  const getRecentRequests = (limit = 5) => data.slice(0, limit);

  const getPendingApprovals = () =>
    data.filter((r) => r.status === 'pending' || r.status === 'pending-vpgd');

  const getCommitmentRecords = () => data.filter((r) => r.commitment !== null);

  const getSInvoiceByStatus = (status: 'completed' | 'sent-to-cqt' | 'error' | 'pending') =>
    data.filter((r) => r.sInvoiceStatus === status);

  const getVFSByStatus = (status: 'completed' | 'processing' | 'pending') =>
    data.filter((r) => r.vfsStatus === status);

  const getLegalStats = () => {
    const complete = data.filter((r) => r.legalStatus.status === 'complete').length;
    const insufficient = data.filter((r) => r.legalStatus.status === 'insufficient').length;
    const overdue = data.filter((r) => r.legalStatus.status === 'overdue').length;
    const supplementing = data.filter((r) => r.legalStatus.status === 'supplementing').length;
    return { complete, insufficient, overdue, supplementing, total: data.length };
  };

  const getRecordByCode = (code: string) => data.find((r) => r.requestCode === code) ?? null;

  return {
    getMonthlyStats,
    getRecentRequests,
    getPendingApprovals,
    getCommitmentRecords,
    getSInvoiceByStatus,
    getVFSByStatus,
    getLegalStats,
    getRecordByCode,
  };
}

// ---------- Context shape ----------
interface MasterInvoiceContextValue extends ReturnType<typeof buildHelpers> {
  MASTER_INVOICE_DATA: InvoiceRequest[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const MasterInvoiceContext = createContext<MasterInvoiceContextValue | null>(null);

export function MasterInvoiceDataProvider({ children }: { children: ReactNode }) {
  const query = useInvoiceRequests({ per_page: 100, sort: '-created_at' });

  const value = useMemo<MasterInvoiceContextValue>(() => {
    const rows = (query.data?.data ?? []).map(mapBackendRecord);
    return {
      MASTER_INVOICE_DATA: rows,
      isLoading: query.isLoading,
      isError: query.isError,
      refetch: () => query.refetch(),
      ...buildHelpers(rows),
    };
  }, [query.data, query.isLoading, query.isError, query.refetch]);

  return createElement(MasterInvoiceContext.Provider, { value }, children);
}

export function useMasterInvoiceData(): MasterInvoiceContextValue {
  const ctx = useContext(MasterInvoiceContext);
  if (!ctx) {
    // Allow components to render without provider (defensive — returns empty list)
    return {
      MASTER_INVOICE_DATA: [],
      isLoading: false,
      isError: false,
      refetch: () => {},
      ...buildHelpers([]),
    };
  }
  return ctx;
}

// ---------- Backward-compat named exports (deprecated, return EMPTY) ----------
// Kept so that `import { MASTER_INVOICE_DATA } from ...` does not break the build
// before all consumers are migrated. Prefer the hook above.
export const MASTER_INVOICE_DATA: InvoiceRequest[] = [];
export const getMonthlyStats = () => buildHelpers([]).getMonthlyStats();
export const getRecentRequests = (limit = 5) => buildHelpers([]).getRecentRequests(limit);
export const getPendingApprovals = () => buildHelpers([]).getPendingApprovals();
export const getCommitmentRecords = () => buildHelpers([]).getCommitmentRecords();
export const getSInvoiceByStatus = (s: 'completed' | 'sent-to-cqt' | 'error' | 'pending') =>
  buildHelpers([]).getSInvoiceByStatus(s);
export const getVFSByStatus = (s: 'completed' | 'processing' | 'pending') =>
  buildHelpers([]).getVFSByStatus(s);
export const getLegalStats = () => buildHelpers([]).getLegalStats();
export const getRecordByCode = (code: string) => buildHelpers([]).getRecordByCode(code);
