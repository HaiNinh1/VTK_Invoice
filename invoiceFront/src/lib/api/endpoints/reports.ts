// Reports endpoints.
//
// Backend routes:
//   GET  /reports/legal-compliance              (permission: report.view.company)
//   POST /reports/legal-compliance/approve      (permission: report.view.company + role admin|director + signature)

import { apiGet, apiPost, unwrap } from '../client';

export interface LegalComplianceReportCenterRow {
  revenue_center_id: number | null;
  name: string | null;
  total: number;
  complete: number;
}

export interface LegalComplianceReportServiceRow {
  service_type_id: number | null;
  name: string | null;
  total: number;
  complete: number;
}

export interface LegalComplianceReport {
  generated_at?: string;
  approved_at?: string | null;
  approved_by?: { id: number; name: string } | null;
  totals: {
    total: number;
    complete: number;
    supplementing: number;
    insufficient: number;
    overdue: number;
    completion_rate: number;
  };
  by_center: LegalComplianceReportCenterRow[];
  by_service: LegalComplianceReportServiceRow[];
  [key: string]: unknown;
}

export interface ApproveLegalReportPayload {
  comment?: string;
}

export const reportsApi = {
  legalCompliance: {
    get: async (params?: {
      from?: string;
      to?: string;
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
