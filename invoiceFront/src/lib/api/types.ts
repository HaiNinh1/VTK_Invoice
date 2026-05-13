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
  phone?: string | null;
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

// InvoiceRequest — matches backend InvoiceRequestResource exactly.
// See: invoiceBack/app/Http/Resources/InvoiceRequestResource.php
export interface InvoiceRequest {
  id: number;
  request_code: string;
  invoice_no: string | null;
  status: InvoiceRequestStatus;

  invoice_type_id: number | null;
  invoice_type?: { id: number; code: string; name: string } | null;

  customer_id?: number | null;
  customer?: { id: number; name: string; tax_code?: string | null } | null;

  // Backend returns these as STRINGS (service_type=name, revenue_center=code), not objects.
  service_type?: string | null;
  revenue_center?: string | null;
  revenue_center_id?: number | null;

  contract_id?: number | null;
  contract_number?: string | null;
  contract_date?: string | null;
  payment_installment_id?: number | null;
  installment_id?: number | null;

  creator?: { id: number; name: string } | null;
  creator_id: number | null;
  current_handler_id?: number | null;
  approved_by_id?: number | null;

  // Backend returns these as decimal strings.
  before_vat: number | string;
  tax_rate: number | string;
  after_vat: number | string;

  legal_complete: boolean;
  legal_status?: Record<string, unknown> | null;

  commitment?: {
    id: number;
    code: string;
    status: string;
    deadline: string | null;
    director_decision?: 'accepted' | 'rejected' | null;
  } | null;

  return_reason?: string | null;
  rejection_reason?: string | null;

  s_invoice_status?: 'pending' | 'pushing' | 'issued' | 'sent_to_cqt' | 'completed' | 'error' | null;
  s_invoice_code?: string | null;
  s_invoice_error?: string | null;
  vfs_status?: 'pending' | 'processing' | 'posted' | 'completed' | 'error' | null;

  notes?: string | null;
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
  title?: string;
  message?: string;
  category?: string;
  priority?: string;
  data: Record<string, unknown> & {
    title?: string;
    message?: string;
    invoice_request_id?: number;
    invoice_request_code?: string;
    request_code?: string;
  };
  read_at: string | null;
  created_at: string;
}

export interface ApiSuccess<T> {
  data: T;
  meta?: unknown;
}
