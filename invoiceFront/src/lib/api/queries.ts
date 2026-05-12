// Centralized TanStack Query keys + hooks.
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import { dashboardApi, DashboardData } from './endpoints/dashboard';
import { notificationsApi } from './endpoints/notifications';
import { authApi } from './endpoints/auth';
import {
  invoiceRequestsApi,
  invoiceActionsApi,
  approvalsApi,
  ListInvoiceRequestsParams,
  CreateInvoiceRequestPayload,
} from './endpoints/invoiceRequests';
import {
  customersApi,
  invoiceTypesApi,
  serviceTypesApi,
  legalDocumentsCatalogApi,
  contractsApi,
  revenueCentersApi,
  usersApi,
  Customer,
  InvoiceType,
  ServiceType,
  LegalDocumentCatalog,
  Contract,
  PaymentInstallment,
  RevenueCenter,
  UserLite,
} from './endpoints/masters';
import { signatureApi } from './endpoints/signature';
import {
  commitmentsApi,
  Commitment,
  CreateCommitmentPayload,
  ExtendCommitmentPayload,
  DecideCommitmentPayload,
} from './endpoints/commitments';
import {
  reportsApi,
  LegalComplianceReport,
  ApproveLegalReportPayload,
} from './endpoints/reports';
import { healthApi, HealthResponse } from './endpoints/health';
import type { InvoiceRequest, Paginated, AppNotification } from './types';

export const qk = {
  dashboard: ['dashboard'] as const,
  notifications: (params?: Record<string, unknown>) => ['notifications', params] as const,
  invoiceRequests: (params?: ListInvoiceRequestsParams) =>
    ['invoice-requests', params] as const,
  invoiceRequest: (id: number | string) => ['invoice-request', String(id)] as const,
  invoiceRequestTimeline: (id: number | string) =>
    ['invoice-request', String(id), 'timeline'] as const,
  invoiceRequestLegalDocs: (id: number | string) =>
    ['invoice-request', String(id), 'legal-documents'] as const,
  approvalsPending: ['approvals', 'pending'] as const,
  customers: (params?: Record<string, unknown>) => ['customers', params] as const,
  invoiceTypes: (params?: Record<string, unknown>) => ['invoice-types', params] as const,
  serviceTypes: (params?: Record<string, unknown>) => ['service-types', params] as const,
  legalDocsCatalog: (params?: Record<string, unknown>) =>
    ['legal-documents-catalog', params] as const,
  contracts: (params?: Record<string, unknown>) => ['contracts', params] as const,
  contract: (id: number) => ['contract', id] as const,
  revenueCenters: (params?: Record<string, unknown>) => ['revenue-centers', params] as const,
  users: (params?: Record<string, unknown>) => ['users', params] as const,
  signature: ['signature'] as const,
};

// ---------- dashboard ----------
export function useDashboard(opts?: Omit<UseQueryOptions<DashboardData>, 'queryKey' | 'queryFn'>) {
  return useQuery<DashboardData>({
    queryKey: qk.dashboard,
    queryFn: dashboardApi.get,
    ...opts,
  });
}

// ---------- notifications ----------
export function useNotifications(params?: { unread?: boolean; per_page?: number; page?: number }) {
  return useQuery({
    queryKey: qk.notifications(params),
    queryFn: () => notificationsApi.list(params),
    refetchInterval: 60_000, // poll every minute
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

// ---------- invoice requests ----------
export function useInvoiceRequests(params: ListInvoiceRequestsParams = {}) {
  return useQuery<Paginated<InvoiceRequest>>({
    queryKey: qk.invoiceRequests(params),
    queryFn: () => invoiceRequestsApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useInvoiceRequest(id: number | string | null) {
  return useQuery({
    queryKey: id ? qk.invoiceRequest(id) : ['invoice-request', 'null'],
    queryFn: () => invoiceRequestsApi.show(id!),
    enabled: !!id,
  });
}

export function useInvoiceRequestTimeline(id: number | string | null) {
  return useQuery({
    queryKey: id ? qk.invoiceRequestTimeline(id) : ['noop'],
    queryFn: () => invoiceRequestsApi.timeline(id!),
    enabled: !!id,
  });
}

export function useCreateInvoiceRequest(
  opts?: UseMutationOptions<InvoiceRequest, unknown, CreateInvoiceRequestPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: invoiceRequestsApi.create,
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['invoice-requests'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      opts?.onSuccess?.(...args);
    },
    ...opts,
  });
}

export function useUpdateInvoiceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: Partial<CreateInvoiceRequestPayload> }) =>
      invoiceRequestsApi.update(id, payload),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['invoice-requests'] });
      qc.invalidateQueries({ queryKey: qk.invoiceRequest(vars.id) });
    },
  });
}

export function useDeleteInvoiceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => invoiceRequestsApi.destroy(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoice-requests'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ---------- invoice actions ----------
function makeActionHook<P = void>(fn: (id: number | string, payload: P) => Promise<unknown>) {
  return function useAction() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (args: { id: number | string; payload?: P }) =>
        fn(args.id, (args.payload ?? undefined) as P),
      onSuccess: (_d, vars) => {
        qc.invalidateQueries({ queryKey: ['invoice-requests'] });
        qc.invalidateQueries({ queryKey: qk.invoiceRequest(vars.id) });
        qc.invalidateQueries({ queryKey: ['approvals', 'pending'] });
        qc.invalidateQueries({ queryKey: ['dashboard'] });
        qc.invalidateQueries({ queryKey: ['notifications'] });
      },
    });
  };
}

export const useSubmitInvoiceRequest = makeActionHook<void>((id) => invoiceActionsApi.submit(id));
export const useApproveInvoiceRequest = makeActionHook<{ comment?: string }>((id, p) =>
  invoiceActionsApi.approve(id, p)
);
export const useRejectInvoiceRequest = makeActionHook<{ comment?: string }>((id, p) =>
  invoiceActionsApi.reject(id, p)
);
export const useReturnInvoiceRequest = makeActionHook<{ reason: string }>((id, p) =>
  invoiceActionsApi.return(id, p as { reason: string })
);
export const useResubmitInvoiceRequest = makeActionHook<void>((id) => invoiceActionsApi.resubmit(id));

// ---------- approvals pending ----------
export function useApprovalsPending() {
  return useQuery<Paginated<InvoiceRequest>>({
    queryKey: qk.approvalsPending,
    queryFn: () => approvalsApi.pending(),
    refetchInterval: 60_000,
  });
}

// ---------- masters ----------
export function useCustomers(params?: { search?: string; per_page?: number; page?: number }) {
  return useQuery({
    queryKey: qk.customers(params),
    queryFn: () => customersApi.list(params),
    staleTime: 5 * 60_000,
  });
}
export function useInvoiceTypes(params?: { search?: string; per_page?: number; status?: string }) {
  return useQuery({
    queryKey: qk.invoiceTypes(params),
    queryFn: () => invoiceTypesApi.list(params),
    staleTime: 5 * 60_000,
  });
}
export function useServiceTypes(params?: { search?: string; per_page?: number }) {
  return useQuery({
    queryKey: qk.serviceTypes(params),
    queryFn: () => serviceTypesApi.list(params),
    staleTime: 5 * 60_000,
  });
}
export function useLegalDocumentsCatalog(params?: { group?: string; enabled?: boolean }) {
  return useQuery({
    queryKey: qk.legalDocsCatalog(params),
    queryFn: () => legalDocumentsCatalogApi.list(params),
    staleTime: 5 * 60_000,
  });
}
export function useContracts(params?: {
  search?: string;
  per_page?: number;
  page?: number;
  customer_id?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: qk.contracts(params),
    queryFn: () => contractsApi.list(params),
    staleTime: 2 * 60_000,
  });
}
export function useContract(id: number | null) {
  return useQuery({
    queryKey: id ? qk.contract(id) : ['contract', 'null'],
    queryFn: () => contractsApi.show(id!),
    enabled: !!id,
  });
}
export function useRevenueCenters(params?: { search?: string; per_page?: number; page?: number }) {
  return useQuery({
    queryKey: qk.revenueCenters(params),
    queryFn: () => revenueCentersApi.list(params),
    staleTime: 5 * 60_000,
  });
}
export function useUsers(params?: {
  search?: string;
  per_page?: number;
  page?: number;
  role?: string;
  revenue_center_id?: number;
  department_id?: number;
}) {
  return useQuery({
    queryKey: qk.users(params),
    queryFn: () => usersApi.list(params),
    staleTime: 5 * 60_000,
  });
}

// ---------- signature ----------
export function useSignature() {
  return useQuery({
    queryKey: qk.signature,
    queryFn: signatureApi.show,
    staleTime: 30_000,
  });
}

export function useUpdateSignature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { method: 'draw' | 'text' | 'upload'; file?: File; text?: string }) =>
      signatureApi.update(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.signature });
    },
  });
}

// ---------- unread badge helper ----------
// Backend has no dedicated unread_count endpoint; we hit /notifications?unread=true&per_page=1
// and read meta.total which Laravel pagination provides as the authoritative unread total.
export function useUnreadNotificationCount() {
  const q = useNotifications({ unread: true, per_page: 1 });
  const total = (q.data?.meta as { total?: number } | undefined)?.total ?? 0;
  return { count: total, isLoading: q.isLoading, isError: q.isError };
}

// ---------- current user / change password ----------
export function useMe() {
  return useQuery({
    queryKey: ['auth', 'me'] as const,
    queryFn: authApi.me,
    staleTime: 60_000,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: {
      old_password: string;
      new_password: string;
      new_password_confirmation: string;
    }) => authApi.changePassword(payload),
  });
}

// Re-export AppNotification for convenience
export type { AppNotification };

// ============================================================================
// Phase B7 additions — hooks for commitments, reports, health, admin writes,
// contract installments/documents, invoice-request legal documents.
// ============================================================================

// Local key extensions (cache shapes align with src/lib/api/queryKeys.ts).
const k = {
  commitments: (invoiceRequestId: number | string) =>
    ['invoice-request', String(invoiceRequestId), 'commitments'] as const,
  commitment: (id: number | string) => ['commitment', String(id)] as const,
  contractInstallments: (contractId: number) =>
    ['contract', contractId, 'installments'] as const,
  contractDocuments: (contractId: number) =>
    ['contract', contractId, 'documents'] as const,
  invoiceRequestLegalDocs: (id: number | string) =>
    ['invoice-request', String(id), 'legal-documents'] as const,
  legalComplianceReport: (params?: Record<string, unknown>) =>
    ['reports', 'legal-compliance', params] as const,
  health: ['health'] as const,
};

// ---------- commitments ----------
export function useCommitmentsForInvoiceRequest(invoiceRequestId: number | string | null) {
  return useQuery<Commitment[]>({
    queryKey: invoiceRequestId ? k.commitments(invoiceRequestId) : ['commitments', 'null'],
    queryFn: () => commitmentsApi.listForInvoiceRequest(invoiceRequestId!),
    enabled: !!invoiceRequestId,
  });
}

export function useCommitment(id: number | string | null) {
  return useQuery<Commitment>({
    queryKey: id ? k.commitment(id) : ['commitment', 'null'],
    queryFn: () => commitmentsApi.show(id!),
    enabled: !!id,
  });
}

export function useCreateCommitment(invoiceRequestId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCommitmentPayload) =>
      commitmentsApi.create(invoiceRequestId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: k.commitments(invoiceRequestId) });
      qc.invalidateQueries({ queryKey: qk.invoiceRequest(invoiceRequestId) });
      qc.invalidateQueries({ queryKey: qk.invoiceRequestTimeline(invoiceRequestId) });
    },
  });
}

export function useExtendCommitment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: ExtendCommitmentPayload }) =>
      commitmentsApi.extend(id, payload),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: k.commitment(vars.id) });
      qc.invalidateQueries({ queryKey: ['invoice-request'] });
    },
  });
}

export function useDecideCommitment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: DecideCommitmentPayload }) =>
      commitmentsApi.decide(id, payload),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: k.commitment(vars.id) });
      qc.invalidateQueries({ queryKey: ['invoice-request'] });
      qc.invalidateQueries({ queryKey: ['approvals', 'pending'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useRemindCommitment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => commitmentsApi.remind(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: k.commitment(id) });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ---------- reports ----------
export function useLegalComplianceReport(params?: Record<string, unknown>) {
  return useQuery<LegalComplianceReport>({
    queryKey: k.legalComplianceReport(params),
    queryFn: () => reportsApi.legalCompliance.get(params),
    staleTime: 60_000,
  });
}

export function useApproveLegalReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload?: ApproveLegalReportPayload) =>
      reportsApi.legalCompliance.approve(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports', 'legal-compliance'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ---------- health ----------
export function useHealth(opts?: Omit<UseQueryOptions<HealthResponse>, 'queryKey' | 'queryFn'>) {
  return useQuery<HealthResponse>({
    queryKey: k.health,
    queryFn: healthApi.get,
    staleTime: 30_000,
    ...opts,
  });
}

// ---------- customers (writes) ----------
export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Customer>) => customersApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}
export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Customer> }) =>
      customersApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

// ---------- invoice types (admin writes) ----------
export function useCreateInvoiceType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<InvoiceType>) => invoiceTypesApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoice-types'] }),
  });
}
export function useUpdateInvoiceType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<InvoiceType> }) =>
      invoiceTypesApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoice-types'] }),
  });
}
export function useDeleteInvoiceType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => invoiceTypesApi.destroy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoice-types'] }),
  });
}
export function useToggleInvoiceTypeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => invoiceTypesApi.toggleStatus(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoice-types'] }),
  });
}

// ---------- service types (admin writes) ----------
export function useCreateServiceType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ServiceType>) => serviceTypesApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-types'] }),
  });
}
export function useUpdateServiceType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ServiceType> }) =>
      serviceTypesApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-types'] }),
  });
}
export function useDeleteServiceType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => serviceTypesApi.destroy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-types'] }),
  });
}

// ---------- legal documents catalog (admin writes) ----------
export function useCreateLegalDocCatalog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<LegalDocumentCatalog>) =>
      legalDocumentsCatalogApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['legal-documents-catalog'] }),
  });
}
export function useUpdateLegalDocCatalog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<LegalDocumentCatalog> }) =>
      legalDocumentsCatalogApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['legal-documents-catalog'] }),
  });
}
export function useDeleteLegalDocCatalog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => legalDocumentsCatalogApi.destroy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['legal-documents-catalog'] }),
  });
}

// ---------- contracts (writes) ----------
export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Contract>) => contractsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  });
}
export function useUpdateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Contract> }) =>
      contractsApi.update(id, payload),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      qc.invalidateQueries({ queryKey: qk.contract(vars.id) });
    },
  });
}
export function useDeleteContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => contractsApi.destroy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  });
}

// ---------- contract installments ----------
export function useContractInstallments(contractId: number | null) {
  return useQuery<PaymentInstallment[]>({
    queryKey: contractId ? k.contractInstallments(contractId) : ['contract', 'null', 'installments'],
    queryFn: () => contractsApi.installments.list(contractId!),
    enabled: !!contractId,
  });
}
export function useCreateInstallment(contractId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<PaymentInstallment>) =>
      contractsApi.installments.create(contractId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: k.contractInstallments(contractId) });
      qc.invalidateQueries({ queryKey: qk.contract(contractId) });
    },
  });
}
export function useUpdateInstallment(contractId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<PaymentInstallment> }) =>
      contractsApi.installments.update(contractId, id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: k.contractInstallments(contractId) });
      qc.invalidateQueries({ queryKey: qk.contract(contractId) });
    },
  });
}
export function useDeleteInstallment(contractId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => contractsApi.installments.destroy(contractId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: k.contractInstallments(contractId) });
      qc.invalidateQueries({ queryKey: qk.contract(contractId) });
    },
  });
}
export function useCreateInvoiceFromInstallment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contractId, installmentId }: { contractId: number; installmentId: number }) =>
      contractsApi.installments.createInvoiceRequest(contractId, installmentId),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['invoice-requests'] });
      qc.invalidateQueries({ queryKey: k.contractInstallments(vars.contractId) });
      qc.invalidateQueries({ queryKey: qk.contract(vars.contractId) });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ---------- contract documents ----------
export function useContractDocuments(contractId: number | null) {
  return useQuery({
    queryKey: contractId ? k.contractDocuments(contractId) : ['contract', 'null', 'documents'],
    queryFn: () => contractsApi.documents.list(contractId!),
    enabled: !!contractId,
  });
}
export function useUploadContractDocument(contractId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, kind }: { file: File; kind?: string }) =>
      contractsApi.documents.upload(contractId, file, kind),
    onSuccess: () => qc.invalidateQueries({ queryKey: k.contractDocuments(contractId) }),
  });
}
export function useDeleteContractDocument(contractId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: number) => contractsApi.documents.destroy(contractId, documentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: k.contractDocuments(contractId) }),
  });
}

// ---------- invoice request legal documents ----------
export function useInvoiceRequestLegalDocuments(invoiceRequestId: number | string | null) {
  return useQuery({
    queryKey: invoiceRequestId
      ? k.invoiceRequestLegalDocs(invoiceRequestId)
      : ['invoice-request', 'null', 'legal-documents'],
    queryFn: () => invoiceRequestsApi.legalDocuments.list(invoiceRequestId!),
    enabled: !!invoiceRequestId,
  });
}
export function useUploadInvoiceRequestLegalDocument(invoiceRequestId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      legalDocumentId,
      notes,
    }: {
      file: File;
      legalDocumentId: number;
      notes?: string;
    }) =>
      invoiceRequestsApi.legalDocuments.upload(String(invoiceRequestId), file, legalDocumentId, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: k.invoiceRequestLegalDocs(invoiceRequestId) });
      qc.invalidateQueries({ queryKey: qk.invoiceRequest(invoiceRequestId) });
    },
  });
}
export function useDeleteInvoiceRequestLegalDocument(invoiceRequestId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: number) =>
      invoiceRequestsApi.legalDocuments.destroy(invoiceRequestId, documentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: k.invoiceRequestLegalDocs(invoiceRequestId) });
      qc.invalidateQueries({ queryKey: qk.invoiceRequest(invoiceRequestId) });
    },
  });
}
