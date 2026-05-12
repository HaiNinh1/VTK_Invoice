// Zod schemas mirroring backend FormRequest validation rules.
//
// Use with react-hook-form via @hookform/resolvers/zod:
//
//   import { zodResolver } from '@hookform/resolvers/zod';
//   import { createInvoiceRequestSchema } from '@/lib/validation';
//   const form = useForm({ resolver: zodResolver(createInvoiceRequestSchema) });
//
// Vietnamese error messages — UI is VN-only per spec.

import { z } from 'zod';

// ---------- shared primitives ----------

const positiveInt = z
  .number({ message: 'Phải là số' })
  .int('Phải là số nguyên')
  .positive('Phải lớn hơn 0');

const nonNegativeNumber = z
  .number({ message: 'Phải là số' })
  .nonnegative('Không được âm');

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD');

const optionalString = z.string().trim().optional().or(z.literal(''));

// ---------- auth ----------

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    new_password: z.string().min(8, 'Mật khẩu mới tối thiểu 8 ký tự'),
    new_password_confirmation: z.string().min(1, 'Vui lòng nhập lại mật khẩu mới'),
  })
  .refine((d) => d.new_password === d.new_password_confirmation, {
    path: ['new_password_confirmation'],
    message: 'Mật khẩu nhập lại không khớp',
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ---------- invoice request ----------

export const createInvoiceRequestSchema = z.object({
  customer_id: positiveInt,
  invoice_type_id: positiveInt,
  service_type_id: positiveInt,
  contract_id: positiveInt.nullable().optional(),
  payment_installment_id: positiveInt.nullable().optional(),
  revenue_center_id: positiveInt.nullable().optional(),
  amount_before_vat: nonNegativeNumber,
  tax_rate: nonNegativeNumber.optional(),
  vat_amount: nonNegativeNumber.optional(),
  amount_after_vat: nonNegativeNumber.optional(),
  notes: optionalString,
});
export type CreateInvoiceRequestInput = z.infer<typeof createInvoiceRequestSchema>;

export const updateInvoiceRequestSchema = createInvoiceRequestSchema.partial();
export type UpdateInvoiceRequestInput = z.infer<typeof updateInvoiceRequestSchema>;

// ---------- approval / rejection / return ----------

export const approveInvoiceSchema = z.object({
  comment: optionalString,
});

export const rejectInvoiceSchema = z.object({
  comment: optionalString,
});

export const returnInvoiceSchema = z.object({
  reason: z.string().trim().min(3, 'Lý do trả lại tối thiểu 3 ký tự'),
});
export type ReturnInvoiceInput = z.infer<typeof returnInvoiceSchema>;

// ---------- contract ----------

export const createContractSchema = z.object({
  code: z.string().trim().min(1, 'Vui lòng nhập mã hợp đồng').max(50),
  name: z.string().trim().min(1, 'Vui lòng nhập tên hợp đồng').max(255),
  customer_id: positiveInt,
  total_amount: nonNegativeNumber.optional(),
  total_amount_after_tax: nonNegativeNumber.optional(),
  status: z.enum(['draft', 'active', 'closed', 'cancelled']).optional(),
});
export type CreateContractInput = z.infer<typeof createContractSchema>;

export const updateContractSchema = createContractSchema.partial();

export const createInstallmentSchema = z.object({
  sequence: positiveInt,
  name: optionalString,
  amount: nonNegativeNumber,
  due_date: isoDate.optional(),
  status: optionalString,
});
export type CreateInstallmentInput = z.infer<typeof createInstallmentSchema>;

// ---------- invoice type catalog ----------

export const invoiceTypeSchema = z.object({
  code: z.string().trim().min(1, 'Vui lòng nhập mã').max(50),
  name: z.string().trim().min(1, 'Vui lòng nhập tên').max(255),
  description: optionalString,
  status: z.enum(['active', 'inactive']).optional(),
});
export type InvoiceTypeInput = z.infer<typeof invoiceTypeSchema>;

// ---------- service type catalog ----------

export const serviceTypeSchema = z.object({
  code: z.string().trim().min(1, 'Vui lòng nhập mã').max(50),
  name: z.string().trim().min(1, 'Vui lòng nhập tên').max(255),
});
export type ServiceTypeInput = z.infer<typeof serviceTypeSchema>;

// ---------- legal document catalog ----------

export const legalDocumentCatalogSchema = z.object({
  code: z.string().trim().min(1, 'Vui lòng nhập mã').max(50),
  name: z.string().trim().min(1, 'Vui lòng nhập tên').max(255),
  group: optionalString,
  default_required: z.boolean().optional(),
  enabled: z.boolean().optional(),
});
export type LegalDocumentCatalogInput = z.infer<typeof legalDocumentCatalogSchema>;

// ---------- customer ----------

export const customerSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên khách hàng').max(255),
  tax_code: z
    .string()
    .trim()
    .regex(/^\d{10}(-\d{3})?$/, 'Mã số thuế VN phải gồm 10 hoặc 13 chữ số')
    .optional()
    .or(z.literal('')),
  address: optionalString,
  contact_name: optionalString,
  contact_phone: optionalString,
  contact_email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
});
export type CustomerInput = z.infer<typeof customerSchema>;

// ---------- commitment ----------

export const createCommitmentSchema = z.object({
  document_type_id: positiveInt,
  reason: z.string().trim().min(3, 'Lý do tối thiểu 3 ký tự'),
  due_date: isoDate,
});
export type CreateCommitmentInput = z.infer<typeof createCommitmentSchema>;

export const extendCommitmentSchema = z.object({
  new_due_date: isoDate,
  reason: z.string().trim().min(3, 'Lý do gia hạn tối thiểu 3 ký tự'),
});
export type ExtendCommitmentInput = z.infer<typeof extendCommitmentSchema>;

export const decideCommitmentSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reason: optionalString,
});
export type DecideCommitmentInput = z.infer<typeof decideCommitmentSchema>;
