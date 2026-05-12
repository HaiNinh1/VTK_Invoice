import { apiDelete, apiGet, apiPost, apiPut, unwrap } from '../client';
import type { Paginated } from '../types';
import { saveDownload } from '../download';

export interface Customer {
  id: number;
  name: string;
  tax_code?: string | null;
  address?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
}

export interface InvoiceType {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  status?: 'active' | 'inactive';
}

export interface ServiceType {
  id: number;
  code: string;
  name: string;
}

export interface LegalDocumentCatalog {
  id: number;
  code: string;
  name: string;
  group?: string | null;
  default_required?: boolean;
  enabled?: boolean;
}

export interface Contract {
  id: number;
  code: string;
  name: string;
  customer_id: number;
  customer?: Customer;
  total_amount?: number | string;
  // Backend truth field: total_value_after_tax. Older callers still read
  // total_amount_after_tax; keep both nullable for safety.
  total_value_after_tax?: number | string | null;
  total_amount_after_tax?: number | string | null;
  total_invoiced?: number | string;
  total_paid?: number | string;
  remaining_amount?: number | string;
  progress?: number;
  signed_date?: string | null;
  expiry_date?: string | null;
  status?: 'draft' | 'active' | 'completed' | 'terminated' | string;
  notes?: string | null;
  project_manager_id?: number | null;
  project_manager?: { id: number; name: string; email?: string | null } | null;
  revenue_center_id?: number | null;
  revenue_center?: { id: number; code: string; name: string } | null;
  installments?: PaymentInstallment[];
  installments_count?: number;
  documents_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentInstallment {
  id: number;
  contract_id: number;
  sequence: number;
  name?: string | null;
  amount: number | string;
  due_date?: string | null;
  status?: 'planned' | 'scheduled' | 'invoiced' | 'paid' | string;
  invoiced_amount?: number | string;
  paid_amount?: number | string;
  notes?: string | null;
}

export interface RevenueCenter {
  id: number;
  code: string;
  name: string;
  manager_user_id?: number | null;
}

export interface UserLite {
  id: number;
  name: string;
  employee_code?: string | null;
  department_id?: number | null;
  revenue_center_id?: number | null;
}

function buildList<T>(raw: unknown): Paginated<T> {
  return raw as Paginated<T>;
}

export const customersApi = {
  list: async (params?: { search?: string; per_page?: number; page?: number }) => {
    const raw = await apiGet<unknown>('/customers', { params });
    return buildList<Customer>(raw);
  },
  show: async (id: number) => unwrap<Customer>(await apiGet<unknown>(`/customers/${id}`)),
  create: async (p: Partial<Customer>) => unwrap<Customer>(await apiPost<unknown>('/customers', p)),
  update: async (id: number, p: Partial<Customer>) =>
    unwrap<Customer>(await apiPut<unknown>(`/customers/${id}`, p)),
};

export const invoiceTypesApi = {
  list: async (params?: { search?: string; per_page?: number; status?: string }) => {
    const raw = await apiGet<unknown>('/invoice-types', { params });
    return buildList<InvoiceType>(raw);
  },
  show: async (id: number) =>
    unwrap<InvoiceType>(await apiGet<unknown>(`/invoice-types/${id}`)),
  create: async (p: Partial<InvoiceType>) =>
    unwrap<InvoiceType>(await apiPost<unknown>('/invoice-types', p)),
  update: async (id: number, p: Partial<InvoiceType>) =>
    unwrap<InvoiceType>(await apiPut<unknown>(`/invoice-types/${id}`, p)),
  destroy: (id: number) => apiDelete<void>(`/invoice-types/${id}`),
  toggleStatus: async (id: number) =>
    unwrap<InvoiceType>(await apiPost<unknown>(`/invoice-types/${id}/toggle-status`)),
};

export const serviceTypesApi = {
  list: async (params?: { search?: string; per_page?: number }) => {
    const raw = await apiGet<unknown>('/service-types', { params });
    return buildList<ServiceType>(raw);
  },
  show: async (id: number) =>
    unwrap<ServiceType>(await apiGet<unknown>(`/service-types/${id}`)),
  create: async (p: Partial<ServiceType>) =>
    unwrap<ServiceType>(await apiPost<unknown>('/service-types', p)),
  update: async (id: number, p: Partial<ServiceType>) =>
    unwrap<ServiceType>(await apiPut<unknown>(`/service-types/${id}`, p)),
  destroy: (id: number) => apiDelete<void>(`/service-types/${id}`),
};

export const legalDocumentsCatalogApi = {
  list: async (params?: { group?: string; enabled?: boolean }) => {
    const raw = await apiGet<unknown>('/legal-documents', { params });
    return buildList<LegalDocumentCatalog>(raw);
  },
  show: async (id: number) =>
    unwrap<LegalDocumentCatalog>(await apiGet<unknown>(`/legal-documents/${id}`)),
  create: async (p: Partial<LegalDocumentCatalog>) =>
    unwrap<LegalDocumentCatalog>(await apiPost<unknown>('/legal-documents', p)),
  update: async (id: number, p: Partial<LegalDocumentCatalog>) =>
    unwrap<LegalDocumentCatalog>(await apiPut<unknown>(`/legal-documents/${id}`, p)),
  destroy: (id: number) => apiDelete<void>(`/legal-documents/${id}`),
};

export const contractsApi = {
  list: async (params?: {
    search?: string;
    per_page?: number;
    page?: number;
    customer_id?: number;
    status?: string;
  }) => {
    const raw = await apiGet<unknown>('/contracts', { params });
    return buildList<Contract>(raw);
  },
  show: async (id: number) => unwrap<Contract>(await apiGet<unknown>(`/contracts/${id}`)),
  create: async (p: Partial<Contract>) =>
    unwrap<Contract>(await apiPost<unknown>('/contracts', p)),
  update: async (id: number, p: Partial<Contract>) =>
    unwrap<Contract>(await apiPut<unknown>(`/contracts/${id}`, p)),
  destroy: (id: number) => apiDelete<void>(`/contracts/${id}`),

  installments: {
    list: async (contractId: number) => {
      const raw = await apiGet<unknown>(`/contracts/${contractId}/installments`);
      return unwrap<PaymentInstallment[]>(raw);
    },
    create: async (contractId: number, p: Partial<PaymentInstallment>) =>
      unwrap<PaymentInstallment>(
        await apiPost<unknown>(`/contracts/${contractId}/installments`, p)
      ),
    update: async (contractId: number, id: number, p: Partial<PaymentInstallment>) =>
      unwrap<PaymentInstallment>(
        await apiPut<unknown>(`/contracts/${contractId}/installments/${id}`, p)
      ),
    destroy: (contractId: number, id: number) =>
      apiDelete<void>(`/contracts/${contractId}/installments/${id}`),
    createInvoiceRequest: async (contractId: number, installmentId: number) =>
      unwrap<unknown>(
        await apiPost<unknown>(
          `/contracts/${contractId}/installments/${installmentId}/create-invoice-request`
        )
      ),
  },

  documents: {
    list: async (contractId: number) => {
      const raw = await apiGet<unknown>(`/contracts/${contractId}/documents`);
      return unwrap<Array<Record<string, unknown>>>(raw);
    },
    upload: async (contractId: number, file: File, kind?: string) => {
      const fd = new FormData();
      fd.append('file', file);
      if (kind) fd.append('kind', kind);
      return apiPost<unknown>(`/contracts/${contractId}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    destroy: (contractId: number, documentId: number) =>
      apiDelete<void>(`/contracts/${contractId}/documents/${documentId}`),
    /**
     * Auth-gated download. Returns the saved filename and triggers a browser save.
     */
    download: (contractId: number, documentId: number) =>
      saveDownload(
        `/contracts/${contractId}/documents/${documentId}/download`,
        `contract-${contractId}-doc-${documentId}`
      ),
  },
};

export const revenueCentersApi = {
  list: async (params?: { search?: string; per_page?: number; page?: number }) => {
    const raw = await apiGet<unknown>('/revenue-centers', { params });
    return buildList<RevenueCenter>(raw);
  },
};

export const usersApi = {
  list: async (params?: {
    search?: string;
    per_page?: number;
    page?: number;
    role?: string;
    revenue_center_id?: number;
    department_id?: number;
  }) => {
    const raw = await apiGet<unknown>('/users', { params });
    return buildList<UserLite>(raw);
  },
};
