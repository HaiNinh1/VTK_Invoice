import { apiDelete, apiGet, apiPost, apiPut, unwrap } from '../client';
import type { InvoiceRequest, Paginated } from '../types';
import { saveDownload } from '../download';

export interface InvoiceRequestFilters {
  status?: string | string[];
  customer_id?: number;
  invoice_type_id?: number;
  service_type_id?: number;
  revenue_center_id?: number;
  created_by_id?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface ListInvoiceRequestsParams {
  filters?: InvoiceRequestFilters;
  sort?: string; // e.g. '-created_at'
  page?: number;
  per_page?: number;
  include?: string;
}

function buildParams(p: ListInvoiceRequestsParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (p.sort) out.sort = p.sort;
  if (p.page) out.page = p.page;
  if (p.per_page) out.per_page = p.per_page;
  if (p.include) out.include = p.include;
  if (p.filters) {
    for (const [k, v] of Object.entries(p.filters)) {
      if (v === undefined || v === null || v === '') continue;
      out[`filter[${k}]`] = Array.isArray(v) ? v.join(',') : v;
    }
  }
  return out;
}

export interface CreateInvoiceRequestPayload {
  customer_id: number;
  invoice_type_id: number;
  service_type_id: number;
  contract_id?: number | null;
  payment_installment_id?: number | null;
  revenue_center_id?: number | null;
  amount_before_vat: number;
  tax_rate?: number;
  vat_amount?: number;
  amount_after_vat?: number;
  notes?: string;
}

export const invoiceRequestsApi = {
  list: async (params: ListInvoiceRequestsParams = {}) => {
    const raw = await apiGet<unknown>('/invoice-requests', { params: buildParams(params) });
    const payload = raw as Paginated<InvoiceRequest> | { data: InvoiceRequest[] };
    return payload as Paginated<InvoiceRequest>;
  },

  show: async (id: number | string): Promise<InvoiceRequest> => {
    const raw = await apiGet<unknown>(`/invoice-requests/${id}`);
    return unwrap<InvoiceRequest>(raw);
  },

  create: async (payload: CreateInvoiceRequestPayload): Promise<InvoiceRequest> => {
    const raw = await apiPost<unknown>('/invoice-requests', payload);
    return unwrap<InvoiceRequest>(raw);
  },

  update: async (
    id: number | string,
    payload: Partial<CreateInvoiceRequestPayload>
  ): Promise<InvoiceRequest> => {
    const raw = await apiPut<unknown>(`/invoice-requests/${id}`, payload);
    return unwrap<InvoiceRequest>(raw);
  },

  destroy: (id: number | string) => apiDelete<void>(`/invoice-requests/${id}`),

  timeline: async (id: number | string) => {
    const raw = await apiGet<unknown>(`/invoice-requests/${id}/timeline`);
    return unwrap<Array<Record<string, unknown>>>(raw);
  },

  // Legal documents
  legalDocuments: {
    list: async (invoiceRequestId: number | string) => {
      const raw = await apiGet<unknown>(`/invoice-requests/${invoiceRequestId}/legal-documents`);
      return unwrap<Array<Record<string, unknown>>>(raw);
    },
    upload: async (
      invoiceRequestId: number | string,
      file: File,
      legalDocumentId: number,
      notes?: string,
      onProgress?: (pct: number) => void
    ) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('legal_document_id', String(legalDocumentId));
      if (notes) fd.append('notes', notes);
      const raw = await apiPost<unknown>(
        `/invoice-requests/${invoiceRequestId}/legal-documents`,
        fd,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
          },
        }
      );
      return unwrap<Record<string, unknown>>(raw);
    },
    destroy: (invoiceRequestId: number | string, documentId: number | string) =>
      apiDelete<void>(`/invoice-requests/${invoiceRequestId}/legal-documents/${documentId}`),
    /**
     * Auth-gated download. Returns the saved filename and triggers a browser save.
     */
    download: (invoiceRequestId: number | string, documentId: number | string) =>
      saveDownload(
        `/invoice-requests/${invoiceRequestId}/legal-documents/${documentId}/download`,
        `invoice-${invoiceRequestId}-legal-${documentId}`
      ),
  },
};

// Action endpoints (submit / approve / reject / return / resubmit)
export const invoiceActionsApi = {
  submit: (id: number | string) =>
    apiPost<unknown>(`/invoice-requests/${id}/submit`),
  approve: (id: number | string, payload?: { comment?: string }) =>
    apiPost<unknown>(`/invoice-requests/${id}/approve`, payload ?? {}),
  reject: (id: number | string, payload?: { comment?: string }) =>
    apiPost<unknown>(`/invoice-requests/${id}/reject`, payload ?? {}),
  return: (id: number | string, payload: { reason: string }) =>
    apiPost<unknown>(`/invoice-requests/${id}/return`, payload),
  resubmit: (id: number | string) =>
    apiPost<unknown>(`/invoice-requests/${id}/resubmit`),
};

// Approvals pending
export const approvalsApi = {
  pending: async () => {
    const raw = await apiGet<unknown>('/approvals/pending');
    const payload = raw as Paginated<InvoiceRequest> | { data: InvoiceRequest[] };
    return payload as Paginated<InvoiceRequest>;
  },
};
