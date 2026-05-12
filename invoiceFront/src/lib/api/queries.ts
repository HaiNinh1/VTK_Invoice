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
} from './endpoints/masters';
import { signatureApi } from './endpoints/signature';
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
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: ['invoice-requests'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      opts?.onSuccess?.(data, vars, ctx);
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
export function useUnreadNotificationCount() {
  const q = useNotifications({ unread: true, per_page: 1 });
  // Backend returns paginated with meta.total
  const total = (q.data?.meta as { total?: number } | undefined)?.total ?? q.data?.data.length ?? 0;
  return { count: total, isLoading: q.isLoading, isError: q.isError };
}

// Re-export AppNotification for convenience
export type { AppNotification };
