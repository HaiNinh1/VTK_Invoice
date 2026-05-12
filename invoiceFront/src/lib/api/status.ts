// Explicit bidirectional status maps (kebab-case API <-> snake_case DB).
// DO NOT use blind replace('_','-') — Oracle warning.
//
// Frontend internal canonical form = API kebab-case (matches what we receive).

import type { InvoiceRequestStatus, LegalStatus } from './types';

// API kebab -> DB snake (for any client-side queries that need snake form)
export const STATUS_API_TO_DB: Record<InvoiceRequestStatus, string> = {
  draft: 'draft',
  'pending-vpgd': 'pending_vpgd',
  'pending-accountant': 'pending_accountant',
  'pending-director': 'pending_director',
  approved: 'approved',
  rejected: 'rejected',
  returned: 'returned',
  resubmitted: 'resubmitted',
  issued: 'issued',
  cancelled: 'cancelled',
};

export const STATUS_DB_TO_API: Record<string, InvoiceRequestStatus> = Object.fromEntries(
  Object.entries(STATUS_API_TO_DB).map(([k, v]) => [v, k as InvoiceRequestStatus])
) as Record<string, InvoiceRequestStatus>;

export function toApiStatus(s: string | null | undefined): InvoiceRequestStatus | null {
  if (!s) return null;
  if (s in STATUS_API_TO_DB) return s as InvoiceRequestStatus;
  if (s in STATUS_DB_TO_API) return STATUS_DB_TO_API[s];
  return null;
}

// Vietnamese labels
export const STATUS_LABEL_VI: Record<InvoiceRequestStatus, string> = {
  draft: 'Nháp',
  'pending-vpgd': 'Chờ VPGĐ duyệt',
  'pending-accountant': 'Chờ kế toán',
  'pending-director': 'Chờ giám đốc',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  returned: 'Trả lại',
  resubmitted: 'Đã nộp lại',
  issued: 'Đã xuất HĐ',
  cancelled: 'Đã huỷ',
};

// Tailwind/hex color tokens per status (bg + text)
export const STATUS_COLOR: Record<InvoiceRequestStatus, { bg: string; text: string }> = {
  draft: { bg: '#F3F4F6', text: '#4B5563' },
  'pending-vpgd': { bg: '#FEF3C7', text: '#92400E' },
  'pending-accountant': { bg: '#DBEAFE', text: '#1D4ED8' },
  'pending-director': { bg: '#FFF1F3', text: '#EE0033' },
  approved: { bg: '#DCFCE7', text: '#15803D' },
  rejected: { bg: '#FEE2E2', text: '#B91C1C' },
  returned: { bg: '#FFEDD5', text: '#C2410C' },
  resubmitted: { bg: '#E0E7FF', text: '#3730A3' },
  issued: { bg: '#D1FAE5', text: '#047857' },
  cancelled: { bg: '#F3F4F6', text: '#6B7280' },
};

export const LEGAL_LABEL_VI: Record<LegalStatus, string> = {
  complete: 'Đầy đủ',
  missing: 'Thiếu hồ sơ',
  overdue: 'Quá hạn',
  'in-progress': 'Đang bổ sung',
};

export const ROLE_LABEL_VI: Record<string, string> = {
  employee: 'Nhân viên',
  manager: 'Quản lý',
  accountant: 'Kế toán',
  director: 'Giám đốc',
  admin: 'Quản trị viên',
};
