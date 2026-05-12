// Shared API types matching backend response shapes.

export interface Paginated<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
}

export interface User {
  id: number;
  name: string;
  email: string;
  employee_code?: string | null;
  is_active?: boolean;
  department?: { id: number; code: string; name: string } | null;
  revenue_center?: { id: number; code: string; name: string } | null;
  roles?: string[];
  permissions?: string[];
}

export type InvoiceRequestStatus =
  | 'draft'
  | 'pending-vpgd'
  | 'pending-accountant'
  | 'pending-director'
  | 'approved'
  | 'rejected'
  | 'returned'
  | 'resubmitted'
  | 'issued'
  | 'cancelled';

export type LegalStatus = 'complete' | 'missing' | 'overdue' | 'in-progress';

export interface InvoiceRequest {
  id: number;
  code: string;
  status: InvoiceRequestStatus;
  customer_id: number | null;
  customer?: { id: number; name: string; tax_code?: string | null } | null;
  invoice_type_id: number | null;
  invoice_type?: { id: number; code: string; name: string } | null;
  service_type_id: number | null;
  service_type?: { id: number; code: string; name: string } | null;
  contract_id?: number | null;
  payment_installment_id?: number | null;
  revenue_center_id?: number | null;
  revenue_center?: { id: number; code: string; name: string } | null;
  department_id?: number | null;
  created_by_id?: number | null;
  creator?: { id: number; name: string } | null;
  current_handler_id?: number | null;
  current_handler?: { id: number; name: string } | null;
  amount_before_vat: number | string;
  vat_amount: number | string;
  amount_after_vat: number | string;
  tax_rate?: number | string;
  legal_complete?: boolean;
  legal_status_cache?: Record<string, unknown> | null;
  notes?: string | null;
  return_reason?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  // Backend shape is flexible — keep as record and let components pull what they need.
  [key: string]: unknown;
}

export interface AppNotification {
  id: string;
  type: string;
  data: Record<string, unknown> & {
    title?: string;
    message?: string;
    invoice_request_id?: number;
    invoice_request_code?: string;
  };
  read_at: string | null;
  created_at: string;
}

export interface ApiSuccess<T> {
  data: T;
  meta?: unknown;
}
