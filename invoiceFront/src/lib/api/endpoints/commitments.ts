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
  | 'expired'
  | 'overdue';

export interface Commitment {
  id: number;
  code: string;
  invoice_request_id?: number;
  content: string | null;
  deadline: string | null;        // YYYY-MM-DD
  status: CommitmentStatus;
  signer_id?: number | null;
  signed_at?: string | null;
  missing_documents?: Array<Record<string, unknown>> | null;
  director_id?: number | null;
  director_decision?: 'accepted' | 'rejected' | null;
  director_note?: string | null;
  extensions?: {
    count: number;
    last?: Record<string, unknown> | null;
  };
  days_remaining?: number | null;
  signature_snapshot_id?: number | null;
  invoice_request?: {
    id: number;
    request_code: string;
    status: string;
    legal_complete: boolean;
  } | null;
  created_at?: string;
  updated_at?: string;
}

// Backend: StoreCommitmentRequest requires `content` (string min 10) + `deadline` (date after today).
export interface CreateCommitmentPayload {
  content: string;
  deadline: string; // YYYY-MM-DD
}

// Backend: ExtendCommitmentRequest requires `days` (int 1-30) + `reason` (string min 10).
export interface ExtendCommitmentPayload {
  days: number;
  reason: string;
}

// Backend: DecideCommitmentRequest requires `decision: accepted|rejected`; `note` required when rejected.
export interface DecideCommitmentPayload {
  decision: 'accepted' | 'rejected';
  note?: string;
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
