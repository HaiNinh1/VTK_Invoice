import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { useCreateContract, useUpdateContract, useCustomers } from '../../../lib/api/queries';
import type { Contract, Customer } from '../../../lib/api/endpoints/masters';
import { ApiError } from '../../../lib/api/errors';

type ContractStatus = 'draft' | 'active' | 'completed' | 'terminated';

interface ContractFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  contract?: Contract | null;
}

interface FormState {
  code: string;
  name: string;
  total_amount: string;
  total_value_after_tax: string;
  customer_id: string;
  signed_date: string;
  expiry_date: string;
  status: ContractStatus;
  project_manager_id: string;
  revenue_center_id: string;
  notes: string;
}

const EMPTY: FormState = {
  code: '',
  name: '',
  total_amount: '',
  total_value_after_tax: '',
  customer_id: '',
  signed_date: '',
  expiry_date: '',
  status: 'draft',
  project_manager_id: '',
  revenue_center_id: '',
  notes: '',
};

function fromContract(c: Contract): FormState {
  return {
    code: c.code ?? '',
    name: c.name ?? '',
    total_amount: c.total_amount != null ? String(c.total_amount) : '',
    total_value_after_tax:
      (c.total_value_after_tax ?? c.total_amount_after_tax) != null
        ? String(c.total_value_after_tax ?? c.total_amount_after_tax)
        : '',
    customer_id: c.customer_id != null ? String(c.customer_id) : '',
    signed_date: c.signed_date ?? '',
    expiry_date: c.expiry_date ?? '',
    status: (['draft', 'active', 'completed', 'terminated'].includes(String(c.status))
      ? c.status
      : 'draft') as ContractStatus,
    project_manager_id: c.project_manager_id != null ? String(c.project_manager_id) : '',
    revenue_center_id: c.revenue_center_id != null ? String(c.revenue_center_id) : '',
    notes: c.notes ?? '',
  };
}

export default function ContractFormModal({
  open,
  onOpenChange,
  mode,
  contract,
}: ContractFormModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const createMut = useCreateContract();
  const updateMut = useUpdateContract();

  // Sync form when opening / contract changes.
  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && contract) {
      setForm(fromContract(contract));
      setCustomerSearch(contract.customer?.name ?? '');
    } else {
      setForm(EMPTY);
      setCustomerSearch('');
    }
    setError(null);
  }, [open, mode, contract]);

  // Live customer search (only when modal is open to avoid wasted fetches).
  const customersQuery = useCustomers(
    open ? { search: customerSearch || undefined, per_page: 20 } : undefined
  );
  const customerOptions: Customer[] = customersQuery.data?.data ?? [];

  // Make sure currently-selected customer stays visible even if outside search.
  const selectedCustomer = contract?.customer;
  const mergedOptions: Customer[] =
    selectedCustomer &&
    !customerOptions.some((o) => o.id === selectedCustomer.id) &&
    form.customer_id === String(selectedCustomer.id)
      ? [selectedCustomer, ...customerOptions]
      : customerOptions;

  function validate(): string | null {
    if (!form.code.trim()) return 'Mã hợp đồng là bắt buộc.';
    if (form.code.length > 64) return 'Mã hợp đồng tối đa 64 ký tự.';
    if (!form.name.trim()) return 'Tên hợp đồng là bắt buộc.';
    if (form.name.length > 255) return 'Tên hợp đồng tối đa 255 ký tự.';
    if (!form.customer_id) return 'Vui lòng chọn khách hàng.';
    const ta = Number(form.total_amount);
    if (!form.total_amount || !Number.isFinite(ta) || ta < 0)
      return 'Tổng giá trị (trước VAT) phải là số >= 0.';
    if (form.total_value_after_tax) {
      const tvat = Number(form.total_value_after_tax);
      if (!Number.isFinite(tvat) || tvat < ta)
        return 'Tổng giá trị (sau VAT) phải >= tổng trước VAT.';
    }
    if (form.signed_date && form.expiry_date && form.expiry_date < form.signed_date)
      return 'Ngày hết hạn phải sau hoặc bằng ngày ký.';
    if (form.notes.length > 2000) return 'Ghi chú tối đa 2000 ký tự.';
    return null;
  }

  function toPayload(): Record<string, unknown> {
    const isEdit = mode === 'edit';
    const p: Record<string, unknown> = {
      code: form.code.trim(),
      name: form.name.trim(),
      customer_id: Number(form.customer_id),
      total_amount: Number(form.total_amount),
      status: form.status,
    };
    // Optional / nullable fields: send null to clear on edit; omit on create
    // when blank (backend default applies). Empty string never sent.
    const optionalNumber = (key: string, raw: string) => {
      if (raw === '' || raw == null) {
        if (isEdit) p[key] = null;
      } else {
        const n = Number(raw);
        if (Number.isFinite(n)) p[key] = n;
      }
    };
    const optionalString = (key: string, raw: string) => {
      const trimmed = raw.trim();
      if (trimmed === '') {
        if (isEdit) p[key] = null;
      } else {
        p[key] = trimmed;
      }
    };
    optionalNumber('total_value_after_tax', form.total_value_after_tax);
    optionalNumber('project_manager_id', form.project_manager_id);
    optionalNumber('revenue_center_id', form.revenue_center_id);
    optionalString('signed_date', form.signed_date);
    optionalString('expiry_date', form.expiry_date);
    optionalString('notes', form.notes);
    return p;
  }

  async function handleSubmit() {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    try {
      const payload = toPayload();
      if (mode === 'edit' && contract) {
        await updateMut.mutateAsync({ id: contract.id, payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Lưu thất bại';
      setError(msg);
    }
  }

  const isPending = createMut.isPending || updateMut.isPending;
  const title = mode === 'edit' ? 'Cập nhật hợp đồng' : 'Tạo hợp đồng mới';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Nhập thông tin hợp đồng. Các trường có dấu <span className="text-[#EE0033]">*</span> là bắt buộc.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-[#374151] mb-1">
              Mã hợp đồng <span className="text-[#EE0033]">*</span>
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              maxLength={64}
              className="w-full h-9 px-3 border border-[#D1D5DB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
              placeholder="VD: CT-2026-001"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-[#374151] mb-1">
              Trạng thái
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ContractStatus })}
              className="w-full h-9 px-3 border border-[#D1D5DB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
            >
              <option value="draft">Nháp</option>
              <option value="active">Đang thực hiện</option>
              <option value="completed">Hoàn thành</option>
              <option value="terminated">Đã huỷ</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[#374151] mb-1">
              Tên hợp đồng <span className="text-[#EE0033]">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={255}
              className="w-full h-9 px-3 border border-[#D1D5DB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[#374151] mb-1">
              Khách hàng <span className="text-[#EE0033]">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Tìm khách hàng..."
                className="flex-1 h-9 px-3 border border-[#D1D5DB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
              />
              <select
                value={form.customer_id}
                onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                className="flex-1 h-9 px-3 border border-[#D1D5DB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
              >
                <option value="">— Chọn khách hàng —</option>
                {mergedOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.tax_code ? ` (MST: ${c.tax_code})` : ''}
                  </option>
                ))}
              </select>
            </div>
            {customersQuery.isLoading && (
              <p className="text-xs text-[#6B7280] mt-1">Đang tải danh sách khách hàng...</p>
            )}
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-[#374151] mb-1">
              Tổng giá trị trước VAT (VNĐ) <span className="text-[#EE0033]">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.total_amount}
              onChange={(e) => setForm({ ...form, total_amount: e.target.value })}
              className="w-full h-9 px-3 border border-[#D1D5DB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-[#374151] mb-1">
              Tổng giá trị sau VAT (VNĐ)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.total_value_after_tax}
              onChange={(e) => setForm({ ...form, total_value_after_tax: e.target.value })}
              className="w-full h-9 px-3 border border-[#D1D5DB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
              placeholder="Để trống nếu chưa có"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-[#374151] mb-1">Ngày ký</label>
            <input
              type="date"
              value={form.signed_date}
              onChange={(e) => setForm({ ...form, signed_date: e.target.value })}
              className="w-full h-9 px-3 border border-[#D1D5DB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-[#374151] mb-1">Ngày hết hạn</label>
            <input
              type="date"
              value={form.expiry_date}
              onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
              className="w-full h-9 px-3 border border-[#D1D5DB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-[#374151] mb-1">
              ID Người phụ trách (tùy chọn)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={form.project_manager_id}
              onChange={(e) => setForm({ ...form, project_manager_id: e.target.value })}
              className="w-full h-9 px-3 border border-[#D1D5DB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
              placeholder="ID người dùng phụ trách hợp đồng"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-[#374151] mb-1">
              ID Trung tâm doanh thu (tùy chọn)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={form.revenue_center_id}
              onChange={(e) => setForm({ ...form, revenue_center_id: e.target.value })}
              className="w-full h-9 px-3 border border-[#D1D5DB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
              placeholder="ID trung tâm doanh thu"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[#374151] mb-1">Ghi chú</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              maxLength={2000}
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
            />
          </div>
        </div>

        {error && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-sm rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Huỷ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-[#EE0033] text-white hover:bg-[#CC0029] disabled:opacity-50"
          >
            {isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
            {mode === 'edit' ? 'Lưu thay đổi' : 'Tạo hợp đồng'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
