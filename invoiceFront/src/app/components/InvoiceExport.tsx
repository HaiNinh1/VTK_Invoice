import { useState } from 'react';
import {
  FileText, Download, Printer, Eye, X, Check, ChevronDown, FileSpreadsheet,
  Settings, Calendar, Filter, Search, CheckSquare, Square
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { Button } from './ui/button';
import { useMasterInvoiceData } from '../data/masterInvoiceData';

interface InvoiceExportProps {
  userRole: 'employee' | 'manager' | 'accountant' | 'director' | 'admin';
}

export default function InvoiceExport({ userRole }: InvoiceExportProps) {
  const { MASTER_INVOICE_DATA } = useMasterInvoiceData();
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [templateType, setTemplateType] = useState<'standard' | 'detailed' | 'simple'>('standard');
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('month');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter data based on user role
  const getFilteredData = () => {
    let data = MASTER_INVOICE_DATA;

    // Role-based filtering
    if (userRole === 'employee') {
      data = data.filter(inv => inv.creator === 'Nguyễn Văn A');
    } else if (userRole === 'manager') {
      data = data.filter(inv => inv.revenueCenter === 'KV3');
    }

    // Status filter
    if (statusFilter !== 'all') {
      data = data.filter(inv => inv.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      data = data.filter(inv =>
        inv.requestCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return data;
  };

  const filteredData = getFilteredData();

  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedInvoices(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Select all
  const toggleSelectAll = () => {
    if (selectedInvoices.length === filteredData.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredData.map(inv => inv.requestCode));
    }
  };

  // Export settings
  const [exportSettings, setExportSettings] = useState({
    includeHeader: true,
    includeFooter: true,
    includeLogo: true,
    includeSignature: true,
    includeStamp: true,
    paperSize: 'A4',
    orientation: 'portrait' as 'portrait' | 'landscape',
    includeAttachments: false,
  });

  // Handle export
  const handleExport = () => {
    if (selectedInvoices.length === 0) {
      alert('Vui lòng chọn ít nhất 1 hóa đơn để xuất');
      return;
    }

    // Simulate export
    const filename = `hoa-don-${exportFormat}-${new Date().toISOString().split('T')[0]}.${exportFormat === 'pdf' ? 'pdf' : 'xlsx'}`;
    alert(`Đang xuất ${selectedInvoices.length} hóa đơn thành ${exportFormat.toUpperCase()}...\nTên file: ${filename}`);
  };

  // Handle print
  const handlePrint = () => {
    if (selectedInvoices.length === 0) {
      alert('Vui lòng chọn ít nhất 1 hóa đơn để in');
      return;
    }
    alert(`Đang in ${selectedInvoices.length} hóa đơn...`);
  };

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'draft', label: 'Bản nháp' },
    { value: 'pending', label: 'Đề nghị duyệt' },
    { value: 'approved', label: 'Đã duyệt' },
    { value: 'issued', label: 'Đã xuất HĐ' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Xuất hóa đơn</h1>
          <p className="text-sm text-[#6B7280] mt-1">Xuất file PDF, Excel hoặc in ấn hóa đơn</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowSettings(true)}
            className="h-10 px-4"
          >
            <Settings size={16} className="mr-2" />
            Cấu hình
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#6B7280] mb-1">Tổng số HĐ</div>
              <div className="text-2xl font-semibold text-[#111827]">{filteredData.length}</div>
            </div>
            <div className="w-10 h-10 bg-[#F3F4F6] rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-[#6B7280]" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#6B7280] mb-1">Đã chọn</div>
              <div className="text-2xl font-semibold text-[#EE0033]">{selectedInvoices.length}</div>
            </div>
            <div className="w-10 h-10 bg-[#FFF1F3] rounded-lg flex items-center justify-center">
              <CheckSquare size={20} className="text-[#EE0033]" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#6B7280] mb-1">Định dạng</div>
              <div className="text-lg font-semibold text-[#111827]">{exportFormat.toUpperCase()}</div>
            </div>
            <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center">
              {exportFormat === 'pdf' ? (
                <FileText size={20} className="text-[#1D4ED8]" />
              ) : (
                <FileSpreadsheet size={20} className="text-[#16A34A]" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#6B7280] mb-1">Mẫu in</div>
              <div className="text-lg font-semibold text-[#111827]">
                {templateType === 'standard' ? 'Chuẩn' : templateType === 'detailed' ? 'Chi tiết' : 'Đơn giản'}
              </div>
            </div>
            <div className="w-10 h-10 bg-[#FEF3C7] rounded-lg flex items-center justify-center">
              <Settings size={20} className="text-[#D97706]" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Search */}
          <div className="md:col-span-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Tìm mã ĐN, khách hàng, số HĐ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] focus:border-transparent"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Export Format */}
          <div className="md:col-span-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'excel')}
              className="w-full h-10 px-3 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] focus:border-transparent"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
          </div>

          {/* Template */}
          <div className="md:col-span-3">
            <select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value as any)}
              className="w-full h-10 px-3 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] focus:border-transparent"
            >
              <option value="standard">Mẫu chuẩn</option>
              <option value="detailed">Mẫu chi tiết</option>
              <option value="simple">Mẫu đơn giản</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-[#374151] hover:text-[#EE0033] transition-colors"
            >
              {selectedInvoices.length === filteredData.length ? (
                <CheckSquare size={18} className="text-[#EE0033]" />
              ) : (
                <Square size={18} />
              )}
              <span>Chọn tất cả ({filteredData.length})</span>
            </button>
            {selectedInvoices.length > 0 && (
              <button
                onClick={() => setSelectedInvoices([])}
                className="text-sm text-[#6B7280] hover:text-[#EE0033] transition-colors"
              >
                Bỏ chọn
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={selectedInvoices.length === 0}
              className="h-10 px-4"
            >
              <Eye size={16} className="mr-2" />
              Xem trước
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={selectedInvoices.length === 0}
              className="h-10 px-4"
            >
              <Printer size={16} className="mr-2" />
              In ({selectedInvoices.length})
            </Button>
            <Button
              onClick={handleExport}
              disabled={selectedInvoices.length === 0}
              className="h-10 px-4 bg-[#EE0033] text-white hover:bg-[#CC0029]"
            >
              <Download size={16} className="mr-2" />
              Xuất file ({selectedInvoices.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.length === filteredData.length && filteredData.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-[#D1D5DB] text-[#EE0033] focus:ring-2 focus:ring-[#EE0033]"
                  />
                </th>
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3">Mã đề nghị</th>
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3">Số HĐ</th>
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3">Khách hàng</th>
                <th className="text-right text-xs font-medium text-[#6B7280] px-4 py-3">Giá trị (VNĐ)</th>
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3">Người tạo</th>
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3">Ngày tạo</th>
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredData.map((invoice) => {
                const isSelected = selectedInvoices.includes(invoice.requestCode);
                return (
                  <tr
                    key={invoice.requestCode}
                    className={`hover:bg-[#F9FAFB] transition-colors cursor-pointer ${isSelected ? 'bg-[#FFF1F3]' : ''}`}
                    onClick={() => toggleSelection(invoice.requestCode)}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(invoice.requestCode)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-[#D1D5DB] text-[#EE0033] focus:ring-2 focus:ring-[#EE0033]"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[#111827]">{invoice.requestCode}</td>
                    <td className="px-4 py-3 text-sm text-[#6B7280]">{invoice.invoiceNo || '—'}</td>
                    <td className="px-4 py-3 text-sm text-[#374151]">{invoice.customer}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-[#111827]">
                      {invoice.afterVAT.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6B7280]">{invoice.creator}</td>
                    <td className="px-4 py-3 text-sm text-[#6B7280]">{invoice.createdDate}</td>
                    <td className="px-4 py-3">
                      {getStatusBadge(invoice.status)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="py-12 text-center">
            <FileText size={48} className="mx-auto text-[#D1D5DB] mb-3" />
            <p className="text-sm text-[#6B7280]">Không tìm thấy hóa đơn nào</p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Xem trước hóa đơn</DialogTitle>
            <DialogDescription>
              Đang xem trước {selectedInvoices.length} hóa đơn với mẫu {templateType}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="border border-[#E5E7EB] rounded-lg p-8 bg-white">
              <div className="text-center mb-6">
                <div className="text-2xl font-bold text-[#EE0033]">VIETTEL TECH SERVICES</div>
                <div className="text-sm text-[#6B7280] mt-1">Công ty Cổ phần Dịch vụ Công nghệ Viettel</div>
                <div className="text-sm text-[#6B7280]">MST: 0100109106-151</div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-[#111827]">HÓA ĐƠN GIÁ TRỊ GIA TĂNG</h2>
                <p className="text-sm text-[#6B7280] mt-1">(Mẫu số: 01GTKT0/001)</p>
              </div>

              {selectedInvoices.slice(0, 1).map(id => {
                const invoice = filteredData.find(inv => inv.requestCode === id);
                if (!invoice) return null;

                return (
                  <div key={id} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Đơn vị bán hàng:</strong> Viettel Tech Services
                      </div>
                      <div>
                        <strong>Ký hiệu:</strong> AA/26E
                      </div>
                      <div>
                        <strong>Địa chỉ:</strong> Tầng 10, Tòa nhà Viettel, 285 Cách Mạng Tháng 8
                      </div>
                      <div>
                        <strong>Số:</strong> {invoice.invoiceNo || 'Chưa có'}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div><strong>Khách hàng:</strong> {invoice.customer}</div>
                      <div><strong>MST:</strong> {invoice.taxCode}</div>
                      <div><strong>Địa chỉ:</strong> Hà Nội</div>
                    </div>

                    <table className="w-full border border-[#E5E7EB] text-sm">
                      <thead className="bg-[#F9FAFB]">
                        <tr>
                          <th className="border border-[#E5E7EB] px-3 py-2 text-left">Dịch vụ</th>
                          <th className="border border-[#E5E7EB] px-3 py-2 text-right">Đơn giá</th>
                          <th className="border border-[#E5E7EB] px-3 py-2 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-[#E5E7EB] px-3 py-2">{invoice.serviceType}</td>
                          <td className="border border-[#E5E7EB] px-3 py-2 text-right">
                            {invoice.beforeVAT.toLocaleString('vi-VN')}
                          </td>
                          <td className="border border-[#E5E7EB] px-3 py-2 text-right">
                            {invoice.beforeVAT.toLocaleString('vi-VN')}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="border border-[#E5E7EB] px-3 py-2 text-right font-medium">
                            Tiền trước thuế:
                          </td>
                          <td className="border border-[#E5E7EB] px-3 py-2 text-right font-medium">
                            {invoice.beforeVAT.toLocaleString('vi-VN')}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="border border-[#E5E7EB] px-3 py-2 text-right font-medium">
                            Thuế GTGT ({invoice.taxRate}):
                          </td>
                          <td className="border border-[#E5E7EB] px-3 py-2 text-right font-medium">
                            {(invoice.afterVAT - invoice.beforeVAT).toLocaleString('vi-VN')}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="border border-[#E5E7EB] px-3 py-2 text-right font-bold">
                            Tổng cộng:
                          </td>
                          <td className="border border-[#E5E7EB] px-3 py-2 text-right font-bold text-[#EE0033]">
                            {invoice.afterVAT.toLocaleString('vi-VN')}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="grid grid-cols-2 gap-8 mt-8 text-sm">
                      <div className="text-center">
                        <div className="font-medium mb-12">Người mua hàng</div>
                        <div className="text-[#9CA3AF] italic">(Ký, ghi rõ họ tên)</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium mb-12">Người bán hàng</div>
                        <div className="text-[#9CA3AF] italic">(Ký, ghi rõ họ tên, đóng dấu)</div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {selectedInvoices.length > 1 && (
                <div className="mt-6 p-4 bg-[#F9FAFB] rounded-lg text-center text-sm text-[#6B7280]">
                  ... và {selectedInvoices.length - 1} hóa đơn khác
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Đóng
            </Button>
            <Button onClick={handleExport} className="bg-[#EE0033] text-white hover:bg-[#CC0029]">
              <Download size={16} className="mr-2" />
              Xuất file
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cấu hình xuất hóa đơn</DialogTitle>
            <DialogDescription>
              Tùy chỉnh nội dung và định dạng khi xuất hóa đơn
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={exportSettings.includeHeader}
                  onChange={(e) => setExportSettings({ ...exportSettings, includeHeader: e.target.checked })}
                  className="w-4 h-4 rounded border-[#D1D5DB] text-[#EE0033] focus:ring-2 focus:ring-[#EE0033]"
                />
                <span className="text-sm text-[#374151]">Bao gồm header (logo, thông tin công ty)</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={exportSettings.includeFooter}
                  onChange={(e) => setExportSettings({ ...exportSettings, includeFooter: e.target.checked })}
                  className="w-4 h-4 rounded border-[#D1D5DB] text-[#EE0033] focus:ring-2 focus:ring-[#EE0033]"
                />
                <span className="text-sm text-[#374151]">Bao gồm footer (chữ ký, ghi chú)</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={exportSettings.includeLogo}
                  onChange={(e) => setExportSettings({ ...exportSettings, includeLogo: e.target.checked })}
                  className="w-4 h-4 rounded border-[#D1D5DB] text-[#EE0033] focus:ring-2 focus:ring-[#EE0033]"
                />
                <span className="text-sm text-[#374151]">Hiển thị logo Viettel</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={exportSettings.includeSignature}
                  onChange={(e) => setExportSettings({ ...exportSettings, includeSignature: e.target.checked })}
                  className="w-4 h-4 rounded border-[#D1D5DB] text-[#EE0033] focus:ring-2 focus:ring-[#EE0033]"
                />
                <span className="text-sm text-[#374151]">Bao gồm chữ ký điện tử</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={exportSettings.includeStamp}
                  onChange={(e) => setExportSettings({ ...exportSettings, includeStamp: e.target.checked })}
                  className="w-4 h-4 rounded border-[#D1D5DB] text-[#EE0033] focus:ring-2 focus:ring-[#EE0033]"
                />
                <span className="text-sm text-[#374151]">Hiển thị con dấu</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={exportSettings.includeAttachments}
                  onChange={(e) => setExportSettings({ ...exportSettings, includeAttachments: e.target.checked })}
                  className="w-4 h-4 rounded border-[#D1D5DB] text-[#EE0033] focus:ring-2 focus:ring-[#EE0033]"
                />
                <span className="text-sm text-[#374151]">Đính kèm hồ sơ pháp lý (nếu có)</span>
              </label>
            </div>

            <div className="border-t border-[#E5E7EB] pt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">Khổ giấy</label>
                <select
                  value={exportSettings.paperSize}
                  onChange={(e) => setExportSettings({ ...exportSettings, paperSize: e.target.value })}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
                >
                  <option value="A4">A4 (210 x 297 mm)</option>
                  <option value="A5">A5 (148 x 210 mm)</option>
                  <option value="Letter">Letter (216 x 279 mm)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">Hướng trang</label>
                <div className="flex gap-3">
                  <label className="flex-1 flex items-center gap-3 p-3 border border-[#E5E7EB] rounded-lg cursor-pointer hover:border-[#EE0033] transition-colors">
                    <input
                      type="radio"
                      name="orientation"
                      value="portrait"
                      checked={exportSettings.orientation === 'portrait'}
                      onChange={(e) => setExportSettings({ ...exportSettings, orientation: 'portrait' })}
                      className="w-4 h-4 text-[#EE0033] focus:ring-2 focus:ring-[#EE0033]"
                    />
                    <span className="text-sm text-[#374151]">Dọc</span>
                  </label>
                  <label className="flex-1 flex items-center gap-3 p-3 border border-[#E5E7EB] rounded-lg cursor-pointer hover:border-[#EE0033] transition-colors">
                    <input
                      type="radio"
                      name="orientation"
                      value="landscape"
                      checked={exportSettings.orientation === 'landscape'}
                      onChange={(e) => setExportSettings({ ...exportSettings, orientation: 'landscape' })}
                      className="w-4 h-4 text-[#EE0033] focus:ring-2 focus:ring-[#EE0033]"
                    />
                    <span className="text-sm text-[#374151]">Ngang</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Hủy
            </Button>
            <Button onClick={() => setShowSettings(false)} className="bg-[#EE0033] text-white hover:bg-[#CC0029]">
              Lưu cấu hình
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function for status badges
function getStatusBadge(status: string) {
  const statusMap: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: '#F3F4F6', text: '#6B7280', label: 'Bản nháp' },
    pending: { bg: '#FEF3C7', text: '#92400E', label: 'Đề nghị duyệt' },
    approved: { bg: '#DBEAFE', text: '#1E40AF', label: 'Đã duyệt' },
    rejected: { bg: '#FEE2E2', text: '#991B1B', label: 'Từ chối' },
    returned: { bg: '#FEEBC8', text: '#C05621', label: 'Trả lại' },
    issued: { bg: '#D1FAE5', text: '#065F46', label: 'Đã xuất HĐ' },
  };

  const s = statusMap[status];
  if (!s) return <span className="text-xs text-[#6B7280]">—</span>;

  return (
    <span
      className="inline-flex items-center h-6 px-3 rounded-full text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}
