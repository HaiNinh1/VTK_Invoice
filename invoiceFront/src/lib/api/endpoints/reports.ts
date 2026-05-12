// Reports endpoints.
//
// Backend routes:
//   GET  /reports/legal-compliance              (permission: report.view.company)
//   POST /reports/legal-compliance/approve      (permission: report.view.company + role admin|director + signature)

import { apiGet, apiPost, unwrap } from '../client';

export interface LegalComplianceReportRow {
  invoice_request_id: number;
  invoice_request_code: string;
  customer?: { id: number; name: string } | null;
  legal_complete: boolean;
  missing_documents?: string[];
  overdue_commitments?: number;
  [key: string]: unknown;
}

export interface LegalComplianceReport {
  generated_at?: string;
  approved_at?: string | null;
  approved_by?: { id: number; name: string } | null;
  totals?: {
    total: number;
    complete: number;
    missing: number;
    overdue: number;
  };
  rows: LegalComplianceReportRow[];
  [key: string]: unknown;
}

export interface ApproveLegalReportPayload {
  comment?: string;
}

export const reportsApi = {
  legalCompliance: {
    get: async (params?: {
      date_from?: string;
      date_to?: string;
      revenue_center_id?: number;
    }): Promise<LegalComplianceReport> => {
      const raw = await apiGet<unknown>('/reports/legal-compliance', { params });
      return unwrap<LegalComplianceReport>(raw);
    },

    approve: async (
      payload?: ApproveLegalReportPayload
    ): Promise<LegalComplianceReport> => {
      const raw = await apiPost<unknown>('/reports/legal-compliance/approve', payload ?? {});
      return unwrap<LegalComplianceReport>(raw);
    },
  },
};
