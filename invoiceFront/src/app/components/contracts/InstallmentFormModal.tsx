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
import { useCreateInstallment, useUpdateInstallment } from '../../../lib/api/queries';
import type { PaymentInstallment } from '../../../lib/api/endpoints/masters';
import { ApiError } from '../../../lib/api/errors';

type InstallmentStatus = 'planned' | 'scheduled' | 'invoiced' | 'paid';

interface InstallmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  contractId: number;
  installment?: PaymentInstallment | null;
}

interface FormState {
  amount: string;
  due_date: string;
  description: string;
  sequence: string;
  status: InstallmentStatus;
}

const EMPTY: FormState = {
  amount: '',
  due_date: '',
  description: '',
  sequence: '',
  status: 'planned',
};

function fromInstallment(i: PaymentInstallment): FormState {
  return {
    amount: i.amount != null ? String(i.amount) : '',
    due_date: i.due_date ?? '',
    description: i.name ?? '',
    sequence: i.sequence != null ? String(i.sequence) : '',
    status: (['planned', 'scheduled', 'invoiced', 'paid'].includes(String(i.status))
      ? i.status
      : 'planned') as InstallmentStatus,
  };
}

export default function InstallmentFormModal({
  open,
  onOpenChange,
  mode,
  contractId,
  installment,
}: InstallmentFormModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const createMut = useCreateInstallment(contractId);
  const updateMut = useUpdateInstallment(contractId);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && installment) {
      setForm(fromInstallment(installment));
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [open, mode, installment]);

  function validate(): string | null {
    const amt = Number(form.amount);
    if (!form.amount || !Number.isFinite(amt) || amt <= 0)
      return 'Số tiền phải là số > 0.';
    if (!form.due_date) return 'Vui lòng chọn ngày đến hạn.';
    if (form.sequence) {
      const seq = Number(form.sequence);
      if (!Number.isFinite(seq) || seq < 1) return 'Thứ tự phải là số nguyên >= 1.';
    }
    if (form.description.length > 2000) return 'Mô tả tối đa 2000 ký tự.';
    return null;
  }

  function toPayload(): Record<string, unknown> {
    const isEdit = mode === 'edit';
    const p: Record<string, unknown> = {
      amount: Number(form.amount),
      due_date: form.due_date,
      status: form.status,
    };
    if (form.sequence) {
      p.sequence = Number(form.sequence);
    }
    if (form.description.trim()) {
      p.description = form.description.trim();
    } else if (isEdit) {
      p.description = null;
    }
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
      if (mode === 'edit' && installment) {
        await updateMut.mutateAsync({ id: installment.id, payload });
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
  const title = mode === 'edit' ? 'Cập nhật đợt thanh toán' : 'Thêm đợt thanh toán';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Các trường có dấu <span className="text-[#EE0033]">*</span> là bắt buộc.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 py-2">
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">
              Số tiền (VNĐ) <span className="text-[#EE0033]">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full h-9 px-3 border border-[#D1D5DB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">
              Ngày đến hạn <span className="text-[#EE0033]">*</span>
            </label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="w-full h-9 px-3 border border-[#D1D5DB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">
                Thứ tự đợt
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.sequence}
                onChange={(e) => setForm({ ...form, sequence: e.target.value })}
                className="w-full h-9 px-3 border border-[#D1D5DB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
                placeholder="Tự động nếu để trống"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">
                Trạng thái
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as InstallmentStatus })
                }
                className="w-full h-9 px-3 border border-[#D1D5DB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
              >
                <option value="planned">Đã lập kế hoạch</option>
                <option value="scheduled">Đã lên lịch</option>
                <option value="invoiced">Đã xuất HĐ</option>
                <option value="paid">Đã thanh toán</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Mô tả</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={2000}
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
              placeholder="VD: Đợt 1 - 30% sau ký HĐ"
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
            {mode === 'edit' ? 'Lưu thay đổi' : 'Thêm đợt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
