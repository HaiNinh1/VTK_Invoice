import { useState } from 'react';
import {
  FileText, Plus, Search, Edit, Eye, Trash2, Calendar, DollarSign,
  CheckCircle, Clock, AlertCircle, ChevronRight, X, Upload, FileCheck,
  TrendingUp, Users, Building
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { CONTRACTS, Contract, PaymentInstallment, getContractProgress } from '../data/contractData';

interface ContractManagementProps {
  userRole: 'employee' | 'manager' | 'accountant' | 'director' | 'admin';
  onCreateInvoiceFromContract?: (contractId: string, installmentId: string) => void;
}

export default function ContractManagement({ userRole, onCreateInvoiceFromContract }: ContractManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'draft'>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter contracts based on role
  const getFilteredContracts = () => {
    let data = CONTRACTS;

    // Role-based filtering
    if (userRole === 'employee') {
      data = data.filter(c => c.projectManager === 'Nguyễn Văn A');
    } else if (userRole === 'manager') {
      data = data.filter(c => c.revenueCenter === 'KV3');
    }

    // Search filter
    if (searchTerm) {
      data = data.filter(c =>
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      data = data.filter(c => c.status === statusFilter);
    }

    return data;
  };

  const filteredContracts = getFilteredContracts();

  // Calculate statistics
  const totalContracts = filteredContracts.length;
  const activeContracts = filteredContracts.filter(c => c.status === 'active').length;
  const totalValue = filteredContracts.reduce((sum, c) => sum + c.totalValueAfterTax, 0);
  const totalInvoiced = filteredContracts.reduce((sum, c) => sum + c.totalInvoiced, 0);
  const avgProgress = filteredContracts.length > 0
    ? Math.round(filteredContracts.reduce((sum, c) => sum + getContractProgress(c.id), 0) / filteredContracts.length)
    : 0;

  // Handle view detail
  const handleViewDetail = (contract: Contract) => {
    setSelectedContract(contract);
    setShowDetailModal(true);
  };

  // Handle create invoice from installment
  const handleCreateInvoice = (contractId: string, installmentId: string) => {
    if (onCreateInvoiceFromContract) {
      onCreateInvoiceFromContract(contractId, installmentId);
      setShowDetailModal(false);
    } else {
      alert(`Tạo đề nghị xuất HĐ từ hợp đồng ${contractId}, đợt ${installmentId}`);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: '#D1FAE5', text: '#065F46', label: 'Đang thực hiện' },
      completed: { bg: '#DBEAFE', text: '#1E40AF', label: 'Hoàn thành' },
      terminated: { bg: '#FEE2E2', text: '#991B1B', label: 'Đã huỷ' },
      draft: { bg: '#F3F4F6', text: '#6B7280', label: 'Nháp' }
    };
    const s = map[status] || map.draft;
    return (
      <span
        className="inline-flex items-center h-6 px-3 rounded-full text-xs font-medium"
        style={{ backgroundColor: s.bg, color: s.text }}
      >
        {s.label}
      </span>
    );
  };

  // Get installment status badge
  const getInstallmentStatus = (status: string) => {
    const map: Record<string, { icon: any; bg: string; text: string; label: string }> = {
      pending: { icon: Clock, bg: '#FEF3C7', text: '#92400E', label: 'Chưa xuất HĐ' },
      invoiced: { icon: FileText, bg: '#DBEAFE', text: '#1E40AF', label: 'Đã xuất HĐ' },
      paid: { icon: CheckCircle, bg: '#D1FAE5', text: '#065F46', label: 'Đã thanh toán' }
    };
    const s = map[status] || map.pending;
    const Icon = s.icon;
    return (
      <span
        className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full text-xs font-medium"
        style={{ backgroundColor: s.bg, color: s.text }}
      >
        <Icon size={12} />
        {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Quản lý Hợp đồng</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Quản lý hợp đồng và thanh toán theo đợt
          </p>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#6B7280] mb-1">Tổng HĐ</div>
              <div className="text-2xl font-semibold text-[#111827]">{totalContracts}</div>
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
              <div className="text-2xl font-semibold text-[#16A34A]">{activeContracts}</div>
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
              <div className="text-lg font-semibold text-[#111827]">
                {(totalValue / 1000000000).toFixed(1)}B
              </div>
            </div>
            <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-[#1D4ED8]" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#6B7280] mb-1">Đã xuất HĐ</div>
              <div className="text-lg font-semibold text-[#EE0033]">
                {(totalInvoiced / 1000000000).toFixed(1)}B
              </div>
            </div>
            <div className="w-10 h-10 bg-[#FFF1F3] rounded-lg flex items-center justify-center">
              <FileCheck size={20} className="text-[#EE0033]" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#6B7280] mb-1">TB tiến độ</div>
              <div className="text-2xl font-semibold text-[#111827]">{avgProgress}%</div>
            </div>
            <div className="w-10 h-10 bg-[#FEF3C7] rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-[#D97706]" />
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
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-10 px-3 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] focus:border-transparent"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang thực hiện</option>
            <option value="completed">Hoàn thành</option>
            <option value="draft">Nháp</option>
          </select>
        </div>
      </div>

      {/* Contract Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredContracts.map((contract) => {
          const progress = getContractProgress(contract.id);
          const pendingInstallments = contract.installments.filter(i => i.status === 'pending').length;

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
                    {getStatusBadge(contract.status)}
                  </div>
                  <p className="text-sm text-[#6B7280] mb-2">{contract.name}</p>
                  <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                    <div className="flex items-center gap-1">
                      <Building size={14} />
                      <span>{contract.customer}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>PM: {contract.projectManager}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{contract.startDate} - {contract.endDate}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-[#6B7280] mb-1">Tổng giá trị</div>
                  <div className="text-xl font-bold text-[#EE0033]">
                    {contract.totalValueAfterTax.toLocaleString('vi-VN')}đ
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-[#6B7280] mb-2">
                  <span>Tiến độ thanh toán</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <div className="w-full bg-[#E5E7EB] rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      progress >= 80 ? 'bg-[#16A34A]' :
                      progress >= 50 ? 'bg-[#F59E0B]' : 'bg-[#EE0033]'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-[#E5E7EB]">
                <div>
                  <div className="text-xs text-[#6B7280] mb-1">Đã xuất HĐ</div>
                  <div className="text-sm font-semibold text-[#111827]">
                    {(contract.totalInvoiced / 1000000).toLocaleString('vi-VN')}tr
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#6B7280] mb-1">Đã thanh toán</div>
                  <div className="text-sm font-semibold text-[#16A34A]">
                    {(contract.totalPaid / 1000000).toLocaleString('vi-VN')}tr
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#6B7280] mb-1">Còn lại</div>
                  <div className="text-sm font-semibold text-[#DC2626]">
                    {(contract.remainingAmount / 1000000).toLocaleString('vi-VN')}tr
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#6B7280] mb-1">Đợt chờ xuất</div>
                  <div className="text-sm font-semibold text-[#D97706]">
                    {pendingInstallments} đợt
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredContracts.length === 0 && (
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
                    <div className="font-medium text-[#111827]">{selectedContract.customer}</div>
                  </div>
                  <div>
                    <div className="text-[#6B7280] mb-1">MST</div>
                    <div className="font-medium text-[#111827]">{selectedContract.taxCode}</div>
                  </div>
                  <div>
                    <div className="text-[#6B7280] mb-1">Loại dịch vụ</div>
                    <div className="font-medium text-[#111827]">{selectedContract.serviceType}</div>
                  </div>
                  <div>
                    <div className="text-[#6B7280] mb-1">PM</div>
                    <div className="font-medium text-[#111827]">{selectedContract.projectManager}</div>
                  </div>
                  <div>
                    <div className="text-[#6B7280] mb-1">Trung tâm</div>
                    <div className="font-medium text-[#111827]">{selectedContract.revenueCenter}</div>
                  </div>
                  <div>
                    <div className="text-[#6B7280] mb-1">Ngày ký</div>
                    <div className="font-medium text-[#111827]">{selectedContract.signDate}</div>
                  </div>
                  <div>
                    <div className="text-[#6B7280] mb-1">Thời gian thực hiện</div>
                    <div className="font-medium text-[#111827]">
                      {selectedContract.startDate} - {selectedContract.endDate}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#6B7280] mb-1">Tổng giá trị</div>
                    <div className="font-bold text-[#EE0033]">
                      {selectedContract.totalValueAfterTax.toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                </div>
              </div>

              {/* Master Documents */}
              <div>
                <h3 className="text-sm font-semibold text-[#111827] mb-3">
                  Hồ sơ pháp lý master ({selectedContract.masterDocuments.length})
                </h3>
                <div className="border border-[#E5E7EB] rounded-lg divide-y divide-[#E5E7EB]">
                  {selectedContract.masterDocuments.map((doc) => (
                    <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-[#F9FAFB]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center">
                          <FileCheck size={20} className="text-[#1D4ED8]" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[#111827]">{doc.name}</div>
                          <div className="text-xs text-[#6B7280]">
                            Upload bởi {doc.uploadBy} • {doc.uploadDate}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-[#D1FAE5] text-[#065F46] rounded">
                        Dùng chung
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Installments */}
              <div>
                <h3 className="text-sm font-semibold text-[#111827] mb-3">
                  Các đợt thanh toán ({selectedContract.installments.length})
                </h3>
                <div className="space-y-3">
                  {selectedContract.installments.map((inst, idx) => (
                    <div
                      key={inst.id}
                      className="border border-[#E5E7EB] rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-sm font-semibold text-[#111827]">{inst.name}</h4>
                            {getInstallmentStatus(inst.status)}
                          </div>
                          <p className="text-xs text-[#6B7280] mb-2">
                            <strong>Điều kiện:</strong> {inst.condition}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                            <span><strong>Hạn:</strong> {inst.dueDate}</span>
                            <span><strong>Tỷ lệ:</strong> {inst.percentage}%</span>
                            {inst.invoiceRequestId && (
                              <span><strong>Mã ĐN:</strong> {inst.invoiceRequestId}</span>
                            )}
                            {inst.invoiceNo && (
                              <span><strong>Số HĐ:</strong> {inst.invoiceNo}</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold text-[#EE0033] mb-2">
                            {inst.amount.toLocaleString('vi-VN')}đ
                          </div>
                          {inst.status === 'pending' && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateInvoice(selectedContract.id, inst.id);
                              }}
                              className="h-8 px-3 bg-[#EE0033] text-white hover:bg-[#CC0029] text-xs"
                            >
                              Xuất HĐ
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Specific documents for this installment */}
                      <div className="border-t border-[#E5E7EB] pt-3 mt-3">
                        <div className="text-xs font-medium text-[#6B7280] mb-2">
                          Giấy tờ riêng của đợt này:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {inst.specificDocuments.map((doc, docIdx) => (
                            <span
                              key={docIdx}
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-[#FEF3C7] text-[#92400E] rounded"
                            >
                              <FileText size={12} />
                              {doc}
                            </span>
                          ))}
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

      {/* Create Modal (Placeholder) */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tạo hợp đồng mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin hợp đồng và định nghĩa các đợt thanh toán
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 text-center text-sm text-[#6B7280]">
            Tính năng tạo hợp đồng mới đang được phát triển
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
