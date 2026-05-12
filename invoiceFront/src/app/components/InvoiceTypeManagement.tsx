import { useState } from 'react';
import {
  FileText, Plus, Search, Edit, Trash2, Power, PowerOff, CheckCircle,
  XCircle, AlertCircle, ChevronDown, X, Check, Settings
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { Button } from './ui/button';
import { INVOICE_TYPES, ALL_LEGAL_DOCUMENTS, InvoiceType, LegalDocumentItem } from '../data/invoiceTypes';

interface InvoiceTypeManagementProps {
  userRole: 'employee' | 'manager' | 'accountant' | 'director' | 'admin';
}

export default function InvoiceTypeManagement({ userRole }: InvoiceTypeManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedType, setSelectedType] = useState<InvoiceType | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    serviceTypes: [] as string[],
    legalDocuments: ALL_LEGAL_DOCUMENTS.map(doc => ({ ...doc, enabled: false })),
    status: 'active' as 'active' | 'inactive'
  });

  // Filter data
  const filteredTypes = INVOICE_TYPES.filter(type => {
    const matchesSearch = type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         type.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || type.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalTypes = INVOICE_TYPES.length;
  const activeTypes = INVOICE_TYPES.filter(t => t.status === 'active').length;
  const totalInvoices = INVOICE_TYPES.reduce((sum, t) => sum + t.totalInvoices, 0);
  const avgCompliance = Math.round(
    INVOICE_TYPES.reduce((sum, t) => sum + t.complianceRate, 0) / INVOICE_TYPES.length
  );

  // Handle create
  const handleCreate = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      serviceTypes: [],
      legalDocuments: ALL_LEGAL_DOCUMENTS.map(doc => ({ ...doc, enabled: false })),
      status: 'active'
    });
    setShowCreateModal(true);
  };

  // Handle edit
  const handleEdit = (type: InvoiceType) => {
    setSelectedType(type);
    setFormData({
      code: type.code,
      name: type.name,
      description: type.description,
      serviceTypes: [...type.serviceTypes],
      legalDocuments: type.legalDocuments,
      status: type.status
    });
    setShowEditModal(true);
  };

  // Handle delete
  const handleDelete = (type: InvoiceType) => {
    setSelectedType(type);
    setShowDeleteModal(true);
  };

  // Handle toggle status
  const handleToggleStatus = (type: InvoiceType) => {
    alert(`Đã ${type.status === 'active' ? 'vô hiệu hóa' : 'kích hoạt'} loại hóa đơn: ${type.name}`);
  };

  // Handle save
  const handleSave = () => {
    const enabledDocs = formData.legalDocuments.filter(doc => doc.enabled);
    if (formData.name && formData.code && formData.serviceTypes.length > 0 && enabledDocs.length > 0) {
      alert(`Đã lưu loại hóa đơn: ${formData.name}\nYêu cầu ${enabledDocs.length} loại tài liệu pháp lý`);
      setShowCreateModal(false);
      setShowEditModal(false);
    } else {
      alert('Vui lòng điền đầy đủ thông tin và chọn ít nhất 1 loại dịch vụ và 1 tài liệu pháp lý');
    }
  };

  // Toggle document in form
  const toggleDocument = (docId: string) => {
    setFormData({
      ...formData,
      legalDocuments: formData.legalDocuments.map(doc =>
        doc.id === docId ? { ...doc, enabled: !doc.enabled } : doc
      )
    });
  };

  // Add/Remove service type
  const addServiceType = (service: string) => {
    if (service && !formData.serviceTypes.includes(service)) {
      setFormData({
        ...formData,
        serviceTypes: [...formData.serviceTypes, service]
      });
    }
  };

  const removeServiceType = (service: string) => {
    setFormData({
      ...formData,
      serviceTypes: formData.serviceTypes.filter(s => s !== service)
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Quản lý Loại hóa đơn</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Cấu hình yêu cầu tài liệu pháp lý cho từng loại hóa đơn
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="h-10 px-4 bg-[#EE0033] text-white hover:bg-[#CC0029]"
        >
          <Plus size={16} className="mr-2" />
          Tạo loại mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#6B7280] mb-1">Tổng loại HĐ</div>
              <div className="text-2xl font-semibold text-[#111827]">{totalTypes}</div>
            </div>
            <div className="w-10 h-10 bg-[#F3F4F6] rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-[#6B7280]" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#6B7280] mb-1">Đang hoạt động</div>
              <div className="text-2xl font-semibold text-[#16A34A]">{activeTypes}</div>
            </div>
            <div className="w-10 h-10 bg-[#D1FAE5] rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-[#16A34A]" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#6B7280] mb-1">Tổng HĐ</div>
              <div className="text-2xl font-semibold text-[#111827]">{totalInvoices}</div>
            </div>
            <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-[#1D4ED8]" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#6B7280] mb-1">TB đạt chuẩn</div>
              <div className="text-2xl font-semibold text-[#EE0033]">{avgCompliance}%</div>
            </div>
            <div className="w-10 h-10 bg-[#FFF1F3] rounded-lg flex items-center justify-center">
              <Settings size={20} className="text-[#EE0033]" />
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
              placeholder="Tìm tên loại, mã loại..."
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
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3">Loại dịch vụ</th>
                <th className="text-center text-xs font-medium text-[#6B7280] px-4 py-3">Tài liệu PL</th>
                <th className="text-center text-xs font-medium text-[#6B7280] px-4 py-3">Số HĐ</th>
                <th className="text-center text-xs font-medium text-[#6B7280] px-4 py-3">Đạt chuẩn</th>
                <th className="text-center text-xs font-medium text-[#6B7280] px-4 py-3">Trạng thái</th>
                <th className="text-center text-xs font-medium text-[#6B7280] px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredTypes.map((type) => {
                const enabledDocs = type.legalDocuments.filter(doc => doc.enabled);
                return (
                  <tr key={type.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[#111827]">{type.code}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-[#111827]">{type.name}</div>
                      <div className="text-xs text-[#6B7280] mt-1">{type.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {type.serviceTypes.slice(0, 2).map((service, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-1 bg-[#F3F4F6] text-[#374151] text-xs rounded"
                          >
                            {service}
                          </span>
                        ))}
                        {type.serviceTypes.length > 2 && (
                          <span className="inline-block px-2 py-1 bg-[#F3F4F6] text-[#6B7280] text-xs rounded">
                            +{type.serviceTypes.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium text-[#111827]">
                        {enabledDocs.length}/11
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-[#6B7280]">
                      {type.totalInvoices}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-[#E5E7EB] rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              type.complianceRate >= 80 ? 'bg-[#16A34A]' :
                              type.complianceRate >= 50 ? 'bg-[#F59E0B]' : 'bg-[#DC2626]'
                            }`}
                            style={{ width: `${type.complianceRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-[#6B7280]">
                          {type.complianceRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {type.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full text-xs font-medium bg-[#D1FAE5] text-[#065F46]">
                          <CheckCircle size={12} />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">
                          <XCircle size={12} />
                          Vô hiệu hóa
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(type)}
                          className="p-1.5 hover:bg-[#F3F4F6] rounded transition-colors"
                          title="Sửa"
                        >
                          <Edit size={16} className="text-[#6B7280]" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(type)}
                          className="p-1.5 hover:bg-[#F3F4F6] rounded transition-colors"
                          title={type.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        >
                          {type.status === 'active' ? (
                            <PowerOff size={16} className="text-[#DC2626]" />
                          ) : (
                            <Power size={16} className="text-[#16A34A]" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(type)}
                          className="p-1.5 hover:bg-[#FEE2E2] rounded transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={16} className="text-[#DC2626]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTypes.length === 0 && (
          <div className="py-12 text-center">
            <FileText size={48} className="mx-auto text-[#D1D5DB] mb-3" />
            <p className="text-sm text-[#6B7280]">Không tìm thấy loại hóa đơn nào</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={(open) => {
        setShowCreateModal(open);
        setShowEditModal(open);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showCreateModal ? 'Tạo loại hóa đơn mới' : 'Chỉnh sửa loại hóa đơn'}</DialogTitle>
            <DialogDescription>
              Cấu hình thông tin và yêu cầu tài liệu pháp lý
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#111827]">Thông tin cơ bản</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    Mã loại <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
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
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Lắp đặt"
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi tiết về loại hóa đơn này"
                  rows={3}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
                />
              </div>
            </div>

            {/* Service Types */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#111827]">
                Loại dịch vụ áp dụng <span className="text-[#DC2626]">*</span>
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="service-input"
                  placeholder="Nhập tên dịch vụ và nhấn Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      addServiceType(input.value);
                      input.value = '';
                    }
                  }}
                  className="flex-1 h-10 px-3 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.serviceTypes.map((service, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 h-8 px-3 bg-[#EE0033] text-white text-sm rounded-lg"
                  >
                    {service}
                    <button
                      onClick={() => removeServiceType(service)}
                      className="hover:bg-[#CC0029] rounded-full p-0.5"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Legal Documents Checklist */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#111827]">
                  Tài liệu pháp lý yêu cầu <span className="text-[#DC2626]">*</span>
                </h3>
                <span className="text-xs text-[#6B7280]">
                  Đã chọn: {formData.legalDocuments.filter(doc => doc.enabled).length}/11
                </span>
              </div>
              <div className="border border-[#E5E7EB] rounded-lg divide-y divide-[#E5E7EB]">
                {formData.legalDocuments.map((doc) => (
                  <label
                    key={doc.id}
                    className="flex items-start gap-3 p-4 hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={doc.enabled}
                      onChange={() => toggleDocument(doc.id)}
                      className="w-4 h-4 mt-0.5 rounded border-[#D1D5DB] text-[#EE0033] focus:ring-2 focus:ring-[#EE0033]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#111827]">{doc.name}</span>
                        {doc.required && (
                          <span className="text-xs px-2 py-0.5 bg-[#FEE2E2] text-[#991B1B] rounded">
                            Bắt buộc
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B7280] mt-1">{doc.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#111827]">Trạng thái</h3>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={formData.status === 'active'}
                    onChange={() => setFormData({ ...formData, status: 'active' })}
                    className="w-4 h-4 text-[#EE0033] focus:ring-2 focus:ring-[#EE0033]"
                  />
                  <span className="text-sm text-[#374151]">Hoạt động</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={formData.status === 'inactive'}
                    onChange={() => setFormData({ ...formData, status: 'inactive' })}
                    className="w-4 h-4 text-[#EE0033] focus:ring-2 focus:ring-[#EE0033]"
                  />
                  <span className="text-sm text-[#374151]">Vô hiệu hóa</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[#EE0033] text-white hover:bg-[#CC0029]"
            >
              {showCreateModal ? 'Tạo mới' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa loại hóa đơn này?
            </DialogDescription>
          </DialogHeader>

          {selectedType && (
            <div className="py-4">
              <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-[#D97706] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[#92400E]">
                    <div className="font-medium mb-1">Loại: {selectedType.name}</div>
                    <div>Có {selectedType.totalInvoices} hóa đơn đang sử dụng loại này</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => {
                alert(`Đã xóa loại hóa đơn: ${selectedType?.name}`);
                setShowDeleteModal(false);
              }}
              className="bg-[#DC2626] text-white hover:bg-[#B91C1C]"
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
