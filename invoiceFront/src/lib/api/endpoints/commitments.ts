// Commitment endpoints. Tied to a parent invoice request.
//
// Backend routes (all auth + permission gated):
//   GET    /invoice-requests/{invoiceRequest}/commitments
//   POST   /invoice-requests/{invoiceRequest}/commitments      (commitment.create + signature)
//   GET    /commitments/{commitment}
//   POST   /commitments/{commitment}/extend                    (commitment.extend + signature)
//   POST   /commitments/{commitment}/decide                    (commitment.approve + signature)
//   POST   /commitments/{commitment}/remind                    (commitment.remind)

import { apiGet, apiPost, unwrap } from '../client';

export type CommitmentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'extended'
  | 'completed'
  | 'expired';

export interface Commitment {
  id: number;
  invoice_request_id: number;
  document_type_id?: number | null;
  document_type?: { id: number; code: string; name: string } | null;
  reason?: string | null;
  committed_at?: string | null;
  due_date: string;
  status: CommitmentStatus;
  extensions_used?: number;
  decided_at?: string | null;
  decided_by_id?: number | null;
  decided_by?: { id: number; name: string } | null;
  decision_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCommitmentPayload {
  document_type_id: number;
  reason: string;
  due_date: string; // YYYY-MM-DD
}

export interface ExtendCommitmentPayload {
  new_due_date: string;
  reason: string;
}

export interface DecideCommitmentPayload {
  decision: 'approved' | 'rejected';
  reason?: string;
}

export const commitmentsApi = {
  listForInvoiceRequest: async (invoiceRequestId: number | string): Promise<Commitment[]> => {
    const raw = await apiGet<unknown>(`/invoice-requests/${invoiceRequestId}/commitments`);
    return unwrap<Commitment[]>(raw);
  },

  create: async (
    invoiceRequestId: number | string,
    payload: CreateCommitmentPayload
  ): Promise<Commitment> => {
    const raw = await apiPost<unknown>(
      `/invoice-requests/${invoiceRequestId}/commitments`,
      payload
    );
    return unwrap<Commitment>(raw);
  },

  show: async (commitmentId: number | string): Promise<Commitment> => {
    const raw = await apiGet<unknown>(`/commitments/${commitmentId}`);
    return unwrap<Commitment>(raw);
  },

  extend: async (
    commitmentId: number | string,
    payload: ExtendCommitmentPayload
  ): Promise<Commitment> => {
    const raw = await apiPost<unknown>(`/commitments/${commitmentId}/extend`, payload);
    return unwrap<Commitment>(raw);
  },

  decide: async (
    commitmentId: number | string,
    payload: DecideCommitmentPayload
  ): Promise<Commitment> => {
    const raw = await apiPost<unknown>(`/commitments/${commitmentId}/decide`, payload);
    return unwrap<Commitment>(raw);
  },

  remind: async (commitmentId: number | string): Promise<{ message?: string }> => {
    return apiPost<{ message?: string }>(`/commitments/${commitmentId}/remind`);
  },
};
