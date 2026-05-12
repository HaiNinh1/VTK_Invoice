import { useEffect, useMemo, useState } from 'react';
import {
  FileText, Plus, Search, Edit, Trash2, Power, PowerOff, CheckCircle,
  XCircle, AlertCircle, Settings, Loader2,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import {
  useInvoiceTypes,
  useCreateInvoiceType,
  useUpdateInvoiceType,
  useDeleteInvoiceType,
  useToggleInvoiceTypeStatus,
  useLegalDocumentsCatalog,
  useCreateLegalDocCatalog,
  useUpdateLegalDocCatalog,
  useDeleteLegalDocCatalog,
} from '../../lib/api/queries';
import { ApiError } from '../../lib/api/errors';
import type { InvoiceType, LegalDocumentCatalog } from '../../lib/api/endpoints/masters';

interface InvoiceTypeManagementProps {
  // kept for backward-compat with App.tsx; not used (backend authorizes server-side)
  userRole?: 'employee' | 'manager' | 'accountant' | 'director' | 'admin';
}

type TabKey = 'types' | 'documents';
type InvoiceTypeStatus = 'active' | 'inactive';

function errMsg(e: unknown, fallback: string): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return fallback;
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-sm rounded-md px-3 py-2">
      {message}
    </div>
  );
}

export default function InvoiceTypeManagement(_props: InvoiceTypeManagementProps) {
  const [tab, setTab] = useState<TabKey>('types');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Quản lý Loại hóa đơn</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Cấu hình loại hóa đơn và danh mục tài liệu pháp lý
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[#E5E7EB]">
        <TabButton active={tab === 'types'} onClick={() => setTab('types')}>
          Loại hóa đơn
        </TabButton>
        <TabButton active={tab === 'documents'} onClick={() => setTab('documents')}>
          Danh mục tài liệu pháp lý
        </TabButton>
      </div>

      {tab === 'types' ? <InvoiceTypesPanel /> : <LegalDocsCatalogPanel />}
    </div>
  );
}

function TabButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? 'border-[#EE0033] text-[#EE0033]'
          : 'border-transparent text-[#6B7280] hover:text-[#111827]'
      }`}
    >
      {children}
    </button>
  );
}

/* ========================= Invoice Types Panel ========================= */

function InvoiceTypesPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceTypeStatus>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editing, setEditing] = useState<InvoiceType | null>(null);
  const [target, setTarget] = useState<InvoiceType | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const params = {
    search: searchTerm || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    per_page: 100,
  };
  const { data, isLoading, isError } = useInvoiceTypes(params);

  const createMut = useCreateInvoiceType();
  const updateMut = useUpdateInvoiceType();
  const deleteMut = useDeleteInvoiceType();
  const toggleMut = useToggleInvoiceTypeStatus();

  const types = data?.data ?? [];
  const total = types.length;
  const activeCount = useMemo(() => types.filter(t => t.status === 'active').length, [types]);

  const openCreate = () => { setEditing(null); setShowFormModal(true); };
  const openEdit = (t: InvoiceType) => { setEditing(t); setShowFormModal(true); };
  const openDelete = (t: InvoiceType) => {
    setTarget(t);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const onToggle = async (t: InvoiceType) => {
    setPageError(null);
    try { await toggleMut.mutateAsync(t.id); }
    catch (e) { setPageError(errMsg(e, 'Không thể chuyển trạng thái')); }
  };

  const onDelete = async () => {
    if (!target) return;
    setDeleteError(null);
    try {
      await deleteMut.mutateAsync(target.id);
      setShowDeleteModal(false);
      setTarget(null);
    } catch (e) {
      setDeleteError(errMsg(e, 'Không thể xóa'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page-level error banner (toggle / load actions) */}
      {pageError && (
        <div className="flex items-start justify-between gap-3 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-sm rounded-md px-3 py-2">
          <span>{pageError}</span>
          <button onClick={() => setPageError(null)} className="text-[#991B1B] hover:text-[#7F1D1D]">
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-[#6B7280]">
          {isLoading ? 'Đang tải…' : `${total} loại hóa đơn`}
        </div>
        <Button
          onClick={openCreate}
          className="h-10 px-4 bg-[#EE0033] text-white hover:bg-[#CC0029]"
        >
          <Plus size={16} className="mr-2" />
          Tạo loại mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Tổng loại HĐ" value={String(total)}
          icon={<FileText size={20} className="text-[#6B7280]" />} bg="bg-[#F3F4F6]"
        />
        <StatCard
          label="Đang hoạt động" value={String(activeCount)} valueClass="text-[#16A34A]"
          icon={<CheckCircle size={20} className="text-[#16A34A]" />} bg="bg-[#D1FAE5]"
        />
        <StatCard
          label="Vô hiệu hóa" value={String(total - activeCount)} valueClass="text-[#6B7280]"
          icon={<Settings size={20} className="text-[#6B7280]" />} bg="bg-[#F3F4F6]"
        />
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Tìm tên loại, mã loại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | InvoiceTypeStatus)}
            className="h-10 px-3 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Vô hiệu hóa</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3">Mã loại</th>
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3">Tên loại</th>
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3">Mô tả</th>
                <th className="text-center text-xs font-medium text-[#6B7280] px-4 py-3">Trạng thái</th>
                <th className="text-center text-xs font-medium text-[#6B7280] px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {isLoading && (
                <tr><td colSpan={5} className="py-12 text-center text-sm text-[#6B7280]">
                  <Loader2 className="inline animate-spin mr-2" size={16} /> Đang tải…
                </td></tr>
              )}
              {isError && !isLoading && (
                <tr><td colSpan={5} className="py-12 text-center text-sm text-[#DC2626]">
                  Lỗi tải dữ liệu
                </td></tr>
              )}
              {!isLoading && !isError && types.map((t) => (
                <tr key={t.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-[#111827]">{t.code}</td>
                  <td className="px-4 py-3 text-sm text-[#111827]">{t.name}</td>
                  <td className="px-4 py-3 text-sm text-[#6B7280]">{t.description ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {t.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full text-xs font-medium bg-[#D1FAE5] text-[#065F46]">
                        <CheckCircle size={12} /> Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">
                        <XCircle size={12} /> Vô hiệu hóa
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 hover:bg-[#F3F4F6] rounded transition-colors"
                        title="Sửa"
                      >
                        <Edit size={16} className="text-[#6B7280]" />
                      </button>
                      <button
                        onClick={() => onToggle(t)}
                        disabled={toggleMut.isPending}
                        className="p-1.5 hover:bg-[#F3F4F6] rounded transition-colors disabled:opacity-50"
                        title={t.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                      >
                        {t.status === 'active'
                          ? <PowerOff size={16} className="text-[#DC2626]" />
                          : <Power size={16} className="text-[#16A34A]" />}
                      </button>
                      <button
                        onClick={() => openDelete(t)}
                        className="p-1.5 hover:bg-[#FEE2E2] rounded transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={16} className="text-[#DC2626]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && !isError && types.length === 0 && (
          <div className="py-12 text-center">
            <FileText size={48} className="mx-auto text-[#D1D5DB] mb-3" />
            <p className="text-sm text-[#6B7280]">Không tìm thấy loại hóa đơn nào</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <InvoiceTypeFormDialog
        open={showFormModal}
        onOpenChange={setShowFormModal}
        initial={editing}
        submitting={createMut.isPending || updateMut.isPending}
        onSubmit={async (payload) => {
          if (editing) {
            await updateMut.mutateAsync({ id: editing.id, payload });
          } else {
            await createMut.mutateAsync(payload);
          }
          setShowFormModal(false);
          setEditing(null);
        }}
      />

      {/* Delete Modal */}
      <Dialog
        open={showDeleteModal}
        onOpenChange={(v) => {
          setShowDeleteModal(v);
          if (!v) setDeleteError(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>Bạn có chắc chắn muốn xóa loại hóa đơn này?</DialogDescription>
          </DialogHeader>
          {target && (
            <div className="py-4 space-y-3">
              <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-[#D97706] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[#92400E]">
                    <div className="font-medium mb-1">Loại: {target.name}</div>
                    <div>Mã: {target.code}</div>
                  </div>
                </div>
              </div>
              {deleteError && <InlineError message={deleteError} />}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteMut.isPending}
            >
              Hủy
            </Button>
            <Button
              onClick={onDelete}
              disabled={deleteMut.isPending}
              className="bg-[#DC2626] text-white hover:bg-[#B91C1C]"
            >
              {deleteMut.isPending ? 'Đang xóa…' : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvoiceTypeFormDialog({
  open, onOpenChange, initial, submitting, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: InvoiceType | null;
  submitting: boolean;
  onSubmit: (payload: Partial<InvoiceType>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    code: '', name: '', description: '', status: 'active' as InvoiceTypeStatus,
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Sync when opening or switching target
  useEffect(() => {
    if (open) {
      setForm({
        code: initial?.code ?? '',
        name: initial?.name ?? '',
        description: initial?.description ?? '',
        status: (initial?.status === 'inactive' ? 'inactive' : 'active') as InvoiceTypeStatus,
      });
      setFormError(null);
    }
  }, [open, initial]);

  const submit = async () => {
    setFormError(null);
    if (!form.code || !form.name) {
      setFormError('Vui lòng nhập đầy đủ Mã loại và Tên loại');
      return;
    }
    try {
      await onSubmit({
        code: form.code,
        name: form.name,
        description: form.description || null,
        status: form.status,
      });
    } catch (e) {
      setFormError(errMsg(e, 'Không thể lưu'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? 'Chỉnh sửa loại hóa đơn' : 'Tạo loại hóa đơn mới'}</DialogTitle>
          <DialogDescription>Thông tin cơ bản của loại hóa đơn</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">
                Mã loại <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="VD: LAP_DAT"
                className="w-full h-10 px-3 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">
                Tên loại <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Lắp đặt"
                className="w-full h-10 px-3 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả chi tiết về loại hóa đơn này"
              rows={3}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">Trạng thái</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={form.status === 'active'}
                  onChange={() => setForm({ ...form, status: 'active' })}
                  className="w-4 h-4 text-[#EE0033] focus:ring-2 focus:ring-[#EE0033]"
                />
                <span className="text-sm text-[#374151]">Hoạt động</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={form.status === 'inactive'}
                  onChange={() => setForm({ ...form, status: 'inactive' })}
                  className="w-4 h-4 text-[#EE0033] focus:ring-2 focus:ring-[#EE0033]"
                />
                <span className="text-sm text-[#374151]">Vô hiệu hóa</span>
              </label>
            </div>
          </div>

          {formError && <InlineError message={formError} />}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button
            onClick={submit}
            disabled={submitting}
            className="bg-[#EE0033] text-white hover:bg-[#CC0029]"
          >
            {submitting ? 'Đang lưu…' : initial ? 'Lưu thay đổi' : 'Tạo mới'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ========================= Legal Documents Catalog Panel ========================= */

function LegalDocsCatalogPanel() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDel, setShowDel] = useState(false);
  const [editing, setEditing] = useState<LegalDocumentCatalog | null>(null);
  const [target, setTarget] = useState<LegalDocumentCatalog | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, isLoading, isError } = useLegalDocumentsCatalog();
  const docs = (data?.data ?? []).filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q);
  });

  const createMut = useCreateLegalDocCatalog();
  const updateMut = useUpdateLegalDocCatalog();
  const deleteMut = useDeleteLegalDocCatalog();

  const openDelete = (d: LegalDocumentCatalog) => {
    setTarget(d);
    setDeleteError(null);
    setShowDel(true);
  };

  const onDelete = async () => {
    if (!target) return;
    setDeleteError(null);
    try {
      await deleteMut.mutateAsync(target.id);
      setShowDel(false);
      setTarget(null);
    } catch (e) {
      setDeleteError(errMsg(e, 'Không thể xóa'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-[#6B7280]">
          {isLoading ? 'Đang tải…' : `${docs.length} tài liệu`}
        </div>
        <Button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="h-10 px-4 bg-[#EE0033] text-white hover:bg-[#CC0029]"
        >
          <Plus size={16} className="mr-2" />
          Tạo tài liệu mới
        </Button>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Tìm tên, mã tài liệu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
          />
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3">Mã</th>
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3">Tên tài liệu</th>
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3">Nhóm</th>
                <th className="text-center text-xs font-medium text-[#6B7280] px-4 py-3">Mặc định bắt buộc</th>
                <th className="text-center text-xs font-medium text-[#6B7280] px-4 py-3">Trạng thái</th>
                <th className="text-center text-xs font-medium text-[#6B7280] px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {isLoading && (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-[#6B7280]">
                  <Loader2 className="inline animate-spin mr-2" size={16} /> Đang tải…
                </td></tr>
              )}
              {isError && !isLoading && (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-[#DC2626]">
                  Lỗi tải dữ liệu
                </td></tr>
              )}
              {!isLoading && !isError && docs.map((d) => (
                <tr key={d.id} className="hover:bg-[#F9FAFB]">
                  <td className="px-4 py-3 text-sm font-medium text-[#111827]">{d.code}</td>
                  <td className="px-4 py-3 text-sm text-[#111827]">{d.name}</td>
                  <td className="px-4 py-3 text-sm text-[#6B7280]">{d.group ?? '—'}</td>
                  <td className="px-4 py-3 text-center text-sm">
                    {d.default_required
                      ? <span className="inline-block px-2 py-0.5 bg-[#FEE2E2] text-[#991B1B] text-xs rounded">Bắt buộc</span>
                      : <span className="text-[#6B7280] text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {d.enabled !== false ? (
                      <span className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full text-xs font-medium bg-[#D1FAE5] text-[#065F46]">
                        <CheckCircle size={12} /> Bật
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">
                        <XCircle size={12} /> Tắt
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => { setEditing(d); setShowForm(true); }}
                        className="p-1.5 hover:bg-[#F3F4F6] rounded"
                        title="Sửa"
                      >
                        <Edit size={16} className="text-[#6B7280]" />
                      </button>
                      <button
                        onClick={() => openDelete(d)}
                        className="p-1.5 hover:bg-[#FEE2E2] rounded"
                        title="Xóa"
                      >
                        <Trash2 size={16} className="text-[#DC2626]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && !isError && docs.length === 0 && (
          <div className="py-12 text-center">
            <FileText size={48} className="mx-auto text-[#D1D5DB] mb-3" />
            <p className="text-sm text-[#6B7280]">Chưa có tài liệu nào</p>
          </div>
        )}
      </div>

      <LegalDocFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        initial={editing}
        submitting={createMut.isPending || updateMut.isPending}
        onSubmit={async (payload) => {
          if (editing) {
            await updateMut.mutateAsync({ id: editing.id, payload });
          } else {
            await createMut.mutateAsync(payload);
          }
          setShowForm(false);
          setEditing(null);
        }}
      />

      <Dialog
        open={showDel}
        onOpenChange={(v) => {
          setShowDel(v);
          if (!v) setDeleteError(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>Bạn có chắc chắn muốn xóa tài liệu này?</DialogDescription>
          </DialogHeader>
          {target && (
            <div className="py-4 space-y-3">
              <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-lg p-4 text-sm text-[#92400E]">
                <div className="font-medium mb-1">{target.name}</div>
                <div>Mã: {target.code}</div>
              </div>
              {deleteError && <InlineError message={deleteError} />}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDel(false)}
              disabled={deleteMut.isPending}
            >
              Hủy
            </Button>
            <Button
              disabled={deleteMut.isPending}
              onClick={onDelete}
              className="bg-[#DC2626] text-white hover:bg-[#B91C1C]"
            >
              {deleteMut.isPending ? 'Đang xóa…' : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LegalDocFormDialog({
  open, onOpenChange, initial, submitting, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: LegalDocumentCatalog | null;
  submitting: boolean;
  onSubmit: (payload: Partial<LegalDocumentCatalog>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    code: '', name: '', group: '', default_required: false, enabled: true,
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({
        code: initial?.code ?? '',
        name: initial?.name ?? '',
        group: initial?.group ?? '',
        default_required: !!initial?.default_required,
        enabled: initial?.enabled !== false,
      });
      setFormError(null);
    }
  }, [open, initial]);

  const submit = async () => {
    setFormError(null);
    if (!form.code || !form.name) {
      setFormError('Vui lòng nhập Mã và Tên tài liệu');
      return;
    }
    try {
      await onSubmit({
        code: form.code,
        name: form.name,
        group: form.group || null,
        default_required: form.default_required,
        enabled: form.enabled,
      });
    } catch (e) {
      setFormError(errMsg(e, 'Không thể lưu'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? 'Chỉnh sửa tài liệu' : 'Tạo tài liệu mới'}</DialogTitle>
          <DialogDescription>Danh mục tài liệu pháp lý dùng chung</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">
                Mã <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="VD: HOP_DONG"
                className="w-full h-10 px-3 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">
                Tên <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Hợp đồng kinh tế"
                className="w-full h-10 px-3 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">Nhóm</label>
            <input
              type="text"
              value={form.group}
              onChange={(e) => setForm({ ...form, group: e.target.value })}
              placeholder="VD: Hợp đồng / Pháp lý / Thanh toán"
              className="w-full h-10 px-3 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.default_required}
                onChange={(e) => setForm({ ...form, default_required: e.target.checked })}
                className="w-4 h-4 rounded border-[#D1D5DB] text-[#EE0033] focus:ring-2 focus:ring-[#EE0033]"
              />
              <span className="text-sm text-[#374151]">Mặc định bắt buộc</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                className="w-4 h-4 rounded border-[#D1D5DB] text-[#EE0033] focus:ring-2 focus:ring-[#EE0033]"
              />
              <span className="text-sm text-[#374151]">Đang bật</span>
            </label>
          </div>

          {formError && <InlineError message={formError} />}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button
            onClick={submit}
            disabled={submitting}
            className="bg-[#EE0033] text-white hover:bg-[#CC0029]"
          >
            {submitting ? 'Đang lưu…' : initial ? 'Lưu thay đổi' : 'Tạo mới'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ========================= Shared ========================= */

function StatCard({
  label, value, icon, bg, valueClass = 'text-[#111827]',
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  bg: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-[#6B7280] mb-1">{label}</div>
          <div className={`text-2xl font-semibold ${valueClass}`}>{value}</div>
        </div>
        <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
