import { useMemo, useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  FileCheck,
  TrendingUp,
  Building,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import {
  useContracts,
  useContract,
  useContractInstallments,
  useCreateInvoiceFromInstallment,
} from '../../lib/api/queries';
import type { Contract, PaymentInstallment } from '../../lib/api/endpoints/masters';

interface ContractManagementProps {
  userRole?: 'employee' | 'manager' | 'accountant' | 'director' | 'admin';
  onCreateInvoiceFromContract?: (contractId: number, installmentId: number) => void;
}

type StatusFilter = 'all' | 'active' | 'completed' | 'draft' | 'terminated';

function toNumber(v: number | string | undefined | null): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatVND(n: number): string {
  return n.toLocaleString('vi-VN');
}

function formatBillion(n: number): string {
  return (n / 1_000_000_000).toFixed(1);
}

function formatMillion(n: number): string {
  return (n / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 0 });
}

function statusBadge(status?: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: '#D1FAE5', text: '#065F46', label: 'Đang thực hiện' },
    completed: { bg: '#DBEAFE', text: '#1E40AF', label: 'Hoàn thành' },
    terminated: { bg: '#FEE2E2', text: '#991B1B', label: 'Đã huỷ' },
    draft: { bg: '#F3F4F6', text: '#6B7280', label: 'Nháp' },
  };
  const s = map[status ?? ''] ?? map.draft;
  return (
    <span
      className="inline-flex items-center h-6 px-3 rounded-full text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

function installmentStatusBadge(status?: string) {
  const map: Record<string, { Icon: typeof Clock; bg: string; text: string; label: string }> = {
    pending: { Icon: Clock, bg: '#FEF3C7', text: '#92400E', label: 'Chưa xuất HĐ' },
    invoiced: { Icon: FileText, bg: '#DBEAFE', text: '#1E40AF', label: 'Đã xuất HĐ' },
    paid: { Icon: CheckCircle, bg: '#D1FAE5', text: '#065F46', label: 'Đã thanh toán' },
  };
  const s = map[status ?? ''] ?? map.pending;
  const Icon = s.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      <Icon size={12} />
      {s.label}
    </span>
  );
}

export default function ContractManagement({ onCreateInvoiceFromContract }: ContractManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Server-side filtering for status (backend supports `status` param) +
  // server-side search (`search` param). Role-based visibility is enforced
  // server-side via policies; no client filter needed.
  const listQuery = useContracts({
    search: searchTerm || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    per_page: 50,
  });

  const contracts: Contract[] = listQuery.data?.data ?? [];

  // Stats (computed from current page; rough indicators).
  const stats = useMemo(() => {
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter((c) => c.status === 'active').length;
    const totalValue = contracts.reduce((sum, c) => sum + toNumber(c.total_amount_after_tax ?? c.total_amount), 0);
    return { totalContracts, activeContracts, totalValue };
  }, [contracts]);

  // Detail data: fetch full contract + installments only when a row is opened.
  const detailQuery = useContract(showDetailModal ? selectedContractId : null);
  const installmentsQuery = useContractInstallments(showDetailModal ? selectedContractId : null);
  const selectedContract: Contract | undefined = detailQuery.data;
  const installments: PaymentInstallment[] = installmentsQuery.data ?? selectedContract?.installments ?? [];

  const createInvoiceMut = useCreateInvoiceFromInstallment();

  const handleViewDetail = (contract: Contract) => {
    setSelectedContractId(contract.id);
    setShowDetailModal(true);
  };

  const handleCreateInvoice = async (contractId: number, installmentId: number) => {
    if (onCreateInvoiceFromContract) {
      onCreateInvoiceFromContract(contractId, installmentId);
      setShowDetailModal(false);
      return;
    }
    try {
      await createInvoiceMut.mutateAsync({ contractId, installmentId });
      alert('Đã tạo đề nghị xuất hoá đơn từ đợt thanh toán.');
      setShowDetailModal(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Tạo đề nghị thất bại';
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Quản lý Hợp đồng</h1>
          <p className="text-sm text-[#6B7280] mt-1">Quản lý hợp đồng và thanh toán theo đợt</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="h-10 px-4 bg-[#EE0033] text-white hover:bg-[#CC0029]"
        >
          <Plus size={16} className="mr-2" />
          Tạo hợp đồng mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#6B7280] mb-1">Tổng HĐ (trang này)</div>
              <div className="text-2xl font-semibold text-[#111827]">{stats.totalContracts}</div>
            </div>
            <div className="w-10 h-10 bg-[#F3F4F6] rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-[#6B7280]" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#6B7280] mb-1">Đang thực hiện</div>
              <div className="text-2xl font-semibold text-[#16A34A]">{stats.activeContracts}</div>
            </div>
            <div className="w-10 h-10 bg-[#D1FAE5] rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-[#16A34A]" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#6B7280] mb-1">Tổng giá trị</div>
              <div className="text-lg font-semibold text-[#111827]">{formatBillion(stats.totalValue)}B</div>
            </div>
            <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-[#1D4ED8]" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Tìm mã HĐ, tên HĐ, khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="h-10 px-3 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] focus:border-transparent"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang thực hiện</option>
            <option value="completed">Hoàn thành</option>
            <option value="draft">Nháp</option>
            <option value="terminated">Đã huỷ</option>
          </select>
        </div>
      </div>

      {/* List states */}
      {listQuery.isLoading && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl py-12 flex items-center justify-center gap-2 text-[#6B7280]">
          <Loader2 size={20} className="animate-spin" />
          <span>Đang tải hợp đồng...</span>
        </div>
      )}

      {listQuery.isError && (
        <div className="bg-white border border-red-200 rounded-xl py-8 text-center text-sm text-red-700">
          Không tải được danh sách hợp đồng. Vui lòng thử lại.
        </div>
      )}

      {/* Contract Cards */}
      {!listQuery.isLoading && !listQuery.isError && (
        <div className="grid grid-cols-1 gap-4">
          {contracts.map((contract) => {
            const totalValue = toNumber(contract.total_amount_after_tax ?? contract.total_amount);
            return (
              <div
                key={contract.id}
                className="bg-white border border-[#E5E7EB] rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewDetail(contract)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-[#111827]">{contract.code}</h3>
                      {statusBadge(contract.status)}
                    </div>
                    <p className="text-sm text-[#6B7280] mb-2">{contract.name}</p>
                    <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                      {contract.customer?.name && (
                        <div className="flex items-center gap-1">
                          <Building size={14} />
                          <span>{contract.customer.name}</span>
                        </div>
                      )}
                      {contract.customer?.tax_code && (
                        <div className="flex items-center gap-1">
                          <FileCheck size={14} />
                          <span>MST: {contract.customer.tax_code}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#6B7280] mb-1">Tổng giá trị</div>
                    <div className="text-xl font-bold text-[#EE0033]">{formatVND(totalValue)}đ</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!listQuery.isLoading && !listQuery.isError && contracts.length === 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl py-12 text-center">
          <FileText size={48} className="mx-auto text-[#D1D5DB] mb-3" />
          <p className="text-sm text-[#6B7280]">Không tìm thấy hợp đồng nào</p>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết hợp đồng</DialogTitle>
            <DialogDescription>
              {selectedContract && `${selectedContract.code} - ${selectedContract.name}`}
            </DialogDescription>
          </DialogHeader>

          {detailQuery.isLoading && (
            <div className="py-12 flex items-center justify-center gap-2 text-[#6B7280]">
              <Loader2 size={20} className="animate-spin" />
              <span>Đang tải chi tiết hợp đồng...</span>
            </div>
          )}

          {selectedContract && (
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="bg-[#F9FAFB] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-[#111827] mb-3">Thông tin hợp đồng</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-[#6B7280] mb-1">Mã hợp đồng</div>
                    <div className="font-medium text-[#111827]">{selectedContract.code}</div>
                  </div>
                  <div>
                    <div className="text-[#6B7280] mb-1">Khách hàng</div>
                    <div className="font-medium text-[#111827]">
                      {selectedContract.customer?.name ?? '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#6B7280] mb-1">MST</div>
                    <div className="font-medium text-[#111827]">
                      {selectedContract.customer?.tax_code ?? '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#6B7280] mb-1">Trạng thái</div>
                    <div className="font-medium text-[#111827]">{statusBadge(selectedContract.status)}</div>
                  </div>
                  <div>
                    <div className="text-[#6B7280] mb-1">Tổng giá trị (trước VAT)</div>
                    <div className="font-medium text-[#111827]">
                      {formatVND(toNumber(selectedContract.total_amount))}đ
                    </div>
                  </div>
                  <div>
                    <div className="text-[#6B7280] mb-1">Tổng giá trị (sau VAT)</div>
                    <div className="font-bold text-[#EE0033]">
                      {formatVND(toNumber(selectedContract.total_amount_after_tax))}đ
                    </div>
                  </div>
                </div>
              </div>

              {/* Installments */}
              <div>
                <h3 className="text-sm font-semibold text-[#111827] mb-3">
                  Các đợt thanh toán ({installments.length})
                </h3>

                {installmentsQuery.isLoading && (
                  <div className="py-6 flex items-center justify-center gap-2 text-[#6B7280]">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang tải...</span>
                  </div>
                )}

                {!installmentsQuery.isLoading && installments.length === 0 && (
                  <div className="py-6 text-center text-sm text-[#6B7280]">
                    Hợp đồng chưa có đợt thanh toán nào.
                  </div>
                )}

                <div className="space-y-3">
                  {installments.map((inst) => (
                    <div key={inst.id} className="border border-[#E5E7EB] rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-sm font-semibold text-[#111827]">
                              {inst.name ?? `Đợt ${inst.sequence}`}
                            </h4>
                            {installmentStatusBadge(inst.status)}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                            {inst.due_date && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar size={12} />
                                <strong>Hạn:</strong> {inst.due_date}
                              </span>
                            )}
                            <span>
                              <strong>Số thứ tự:</strong> {inst.sequence}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-[#EE0033] mb-2">
                            {formatVND(toNumber(inst.amount))}đ
                          </div>
                          {inst.status === 'pending' && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateInvoice(selectedContract.id, inst.id);
                              }}
                              disabled={createInvoiceMut.isPending}
                              className="h-8 px-3 bg-[#EE0033] text-white hover:bg-[#CC0029] text-xs disabled:opacity-50"
                            >
                              {createInvoiceMut.isPending ? 'Đang xử lý...' : 'Xuất HĐ'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Modal (deferred — full form lands in a later phase) */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tạo hợp đồng mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin hợp đồng và định nghĩa các đợt thanh toán
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center text-sm text-[#6B7280]">
            Form tạo hợp đồng sẽ được hoàn thiện ở giai đoạn tiếp theo. Hiện tại hợp đồng được khởi
            tạo từ phía admin/quản lý hợp đồng trong hệ thống.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
