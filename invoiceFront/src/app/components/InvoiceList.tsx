import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  FileSpreadsheet, Plus, Search, Filter, Calendar, X, ChevronDown,
  ChevronLeft, ChevronRight, MoreVertical, Eye, Edit, Send, Trash2
} from 'lucide-react';

interface InvoiceListProps {
  getStatusBadge: (status: string) => ReactNode;
  getLegalIcon: (legal: string) => ReactNode;
  onCreateNew: () => void;
}

export default function InvoiceList({ getStatusBadge, getLegalIcon, onCreateNew }: InvoiceListProps) {
  const [filterExpanded, setFilterExpanded] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const invoiceListData = [
    { id: 'DN-2026-00156', invoiceNo: 'HD-001256', customer: 'Tập đoàn VNPT', serviceType: 'Tích hợp hệ thống', beforeVAT: '2.450.000.000', tax: '245.000.000', afterVAT: '2.695.000.000', revenueStatus: 'Đã xác nhận', creator: 'Nguyễn Văn A', date: '13/03/2026', status: 'pending', legal: 'complete' },
    { id: 'DN-2026-00155', invoiceNo: 'HD-001255', customer: 'Viettel Construction JSC', serviceType: 'Tư vấn CNTT', beforeVAT: '5.820.000.000', tax: '582.000.000', afterVAT: '6.402.000.000', revenueStatus: 'Đã xác nhận', creator: 'Trần Thị B', date: '13/03/2026', status: 'approved', legal: 'complete' },
    { id: 'DN-2026-00154', invoiceNo: 'HD-001254', customer: 'Công ty CP Bưu chính VN', serviceType: 'Dịch vụ Cloud', beforeVAT: '1.250.000.000', tax: '125.000.000', afterVAT: '1.375.000.000', revenueStatus: 'Chờ xác nhận', creator: 'Lê Văn C', date: '12/03/2026', status: 'issued', legal: 'missing' },
    { id: 'DN-2026-00153', invoiceNo: '', customer: 'Viettel Telecom', serviceType: 'Bảo trì hệ thống', beforeVAT: '8.900.000.000', tax: '890.000.000', afterVAT: '9.790.000.000', revenueStatus: 'Đã xác nhận', creator: 'Phạm Thị D', date: '12/03/2026', status: 'approved', legal: 'complete' },
    { id: 'DN-2026-00152', invoiceNo: 'HD-001252', customer: 'VNPT Vinaphone', serviceType: 'Tích hợp hệ thống', beforeVAT: '3.150.000.000', tax: '315.000.000', afterVAT: '3.465.000.000', revenueStatus: 'Đã xác nhận', creator: 'Hoàng Văn E', date: '11/03/2026', status: 'pending', legal: 'overdue' },
    { id: 'DN-2026-00151', invoiceNo: 'HD-001251', customer: 'Viettel Global Investment', serviceType: 'Phát triển phần mềm', beforeVAT: '12.400.000.000', tax: '1.240.000.000', afterVAT: '13.640.000.000', revenueStatus: 'Đã xác nhận', creator: 'Đỗ Thị F', date: '11/03/2026', status: 'issued', legal: 'complete' },
    { id: 'DN-2026-00150', invoiceNo: '', customer: 'Viettel High Tech', serviceType: 'Tư vấn CNTT', beforeVAT: '4.750.000.000', tax: '475.000.000', afterVAT: '5.225.000.000', revenueStatus: 'Chưa xác nhận', creator: 'Vũ Văn G', date: '10/03/2026', status: 'rejected', legal: 'missing' },
    { id: 'DN-2026-00149', invoiceNo: 'HD-001249', customer: 'VNPT Technology', serviceType: 'Dịch vụ Cloud', beforeVAT: '6.200.000.000', tax: '620.000.000', afterVAT: '6.820.000.000', revenueStatus: 'Đã xác nhận', creator: 'Bùi Thị H', date: '10/03/2026', status: 'approved', legal: 'complete' },
    { id: 'DN-2026-00148', invoiceNo: 'HD-001248', customer: 'Viettel Networks', serviceType: 'Bảo trì hệ thống', beforeVAT: '2.890.000.000', tax: '289.000.000', afterVAT: '3.179.000.000', revenueStatus: 'Đã xác nhận', creator: 'Ngô Văn I', date: '09/03/2026', status: 'issued', legal: 'complete' },
    { id: 'DN-2026-00147', invoiceNo: 'HD-001247', customer: 'Tập đoàn Bưu chính VN', serviceType: 'Tích hợp hệ thống', beforeVAT: '7.650.000.000', tax: '765.000.000', afterVAT: '8.415.000.000', revenueStatus: 'Đã xác nhận', creator: 'Phan Thị J', date: '09/03/2026', status: 'pending', legal: 'complete' },
    { id: 'DN-2026-00146', invoiceNo: '', customer: 'Viettel Aerospace', serviceType: 'Tư vấn CNTT', beforeVAT: '15.200.000.000', tax: '1.520.000.000', afterVAT: '16.720.000.000', revenueStatus: 'Chờ xác nhận', creator: 'Lý Văn K', date: '08/03/2026', status: 'draft', legal: 'missing' },
    { id: 'DN-2026-00145', invoiceNo: 'HD-001245', customer: 'VNPT Hà Nội', serviceType: 'Dịch vụ Cloud', beforeVAT: '4.320.000.000', tax: '432.000.000', afterVAT: '4.752.000.000', revenueStatus: 'Đã xác nhận', creator: 'Đặng Thị L', date: '08/03/2026', status: 'approved', legal: 'complete' },
    { id: 'DN-2026-00144', invoiceNo: 'HD-001244', customer: 'Viettel IDC', serviceType: 'Phát triển phần mềm', beforeVAT: '9.870.000.000', tax: '987.000.000', afterVAT: '10.857.000.000', revenueStatus: 'Đã xác nhận', creator: 'Trịnh Văn M', date: '07/03/2026', status: 'issued', legal: 'complete' },
    { id: 'DN-2026-00143', invoiceNo: '', customer: 'VNPT VinaPhone South', serviceType: 'Bảo trì hệ thống', beforeVAT: '3.450.000.000', tax: '345.000.000', afterVAT: '3.795.000.000', revenueStatus: 'Chưa xác nhận', creator: 'Mai Thị N', date: '07/03/2026', status: 'rejected', legal: 'overdue' },
    { id: 'DN-2026-00142', invoiceNo: 'HD-001242', customer: 'Viettel Solutions', serviceType: 'Tích hợp hệ thống', beforeVAT: '11.200.000.000', tax: '1.120.000.000', afterVAT: '12.320.000.000', revenueStatus: 'Đã xác nhận', creator: 'Hồ Văn O', date: '06/03/2026', status: 'issued', legal: 'complete' }
  ];

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Đề nghị xuất Hoá đơn</h1>
          <p className="text-sm text-[#6B7280] mt-1">Tổng: 156 đề nghị</p>
        </div>
        <div className="flex gap-3">
          <button className="h-10 px-4 bg-white text-[#374151] border border-[#D1D5DB] rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[#F3F4F6]">
            <FileSpreadsheet size={16} />
            Xuất Excel
          </button>
          <button
            className="h-10 px-4 bg-[#EE0033] text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[#CC002B]"
            onClick={onCreateNew}
          >
            <Plus size={16} />
            Tạo đề nghị mới
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#111827]">Bộ lọc</h3>
          <button
            onClick={() => setFilterExpanded(!filterExpanded)}
            className="p-1 hover:bg-[#F3F4F6] rounded"
          >
            <ChevronDown size={16} className={`text-[#6B7280] transition-transform ${filterExpanded ? '' : 'rotate-180'}`} />
          </button>
        </div>
        
        {filterExpanded && (
          <div className="space-y-4">
            {/* Row 1 */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Trung tâm</label>
                <select className="w-full h-9 px-3 border border-[#D1D5DB] rounded-lg text-sm">
                  <option>Tất cả</option>
                  <option>Trung tâm Hà Nội</option>
                  <option>Trung tâm TP.HCM</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Trạng thái</label>
                <select className="w-full h-9 px-3 border border-[#D1D5DB] rounded-lg text-sm">
                  <option>Tất cả</option>
                  <option>Chờ phê duyệt</option>
                  <option>Đã duyệt</option>
                  <option>Đã xuất HĐ</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Loại DV</label>
                <select className="w-full h-9 px-3 border border-[#D1D5DB] rounded-lg text-sm">
                  <option>Tất cả</option>
                  <option>Tích hợp hệ thống</option>
                  <option>Tư vấn CNTT</option>
                  <option>Dịch vụ Cloud</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Pháp lý</label>
                <select className="w-full h-9 px-3 border border-[#D1D5DB] rounded-lg text-sm">
                  <option>Tất cả</option>
                  <option>Đạt chuẩn</option>
                  <option>Thiếu hồ sơ</option>
                  <option>Quá hạn</option>
                </select>
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex items-end gap-3">
              <div className="w-[150px]">
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Từ ngày</label>
                <div className="relative">
                  <input type="text" placeholder="DD/MM/YYYY" className="w-full h-9 pl-3 pr-9 border border-[#D1D5DB] rounded-lg text-sm" />
                  <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                </div>
              </div>
              <div className="w-[150px]">
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Đến ngày</label>
                <div className="relative">
                  <input type="text" placeholder="DD/MM/YYYY" className="w-full h-9 pl-3 pr-9 border border-[#D1D5DB] rounded-lg text-sm" />
                  <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Tìm kiếm</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input type="text" placeholder="Tìm theo mã, khách hàng..." className="w-full h-9 pl-9 pr-3 border border-[#D1D5DB] rounded-lg text-sm" />
                </div>
              </div>
              <button className="h-9 px-5 bg-[#EE0033] text-white rounded-lg text-sm font-medium hover:bg-[#CC002B] flex items-center gap-2">
                <Filter size={14} />
                Lọc
              </button>
              <button className="h-9 px-3 text-sm text-[#6B7280] hover:text-[#EE0033]">
                Xoá bộ lọc
              </button>
            </div>

            {/* Active filter chips */}
            <div className="flex gap-2">
              <span className="inline-flex items-center h-7 px-3 bg-[#FFF1F3] text-[#EE0033] text-xs font-medium rounded-full">
                Trạng thái: Chờ phê duyệt
                <button className="ml-2 hover:bg-[#FFE0E5] rounded-full p-0.5">
                  <X size={12} />
                </button>
              </span>
              <span className="inline-flex items-center h-7 px-3 bg-[#FFF1F3] text-[#EE0033] text-xs font-medium rounded-full">
                Tháng 3/2026
                <button className="ml-2 hover:bg-[#FFE0E5] rounded-full p-0.5">
                  <X size={12} />
                </button>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* BULK SELECTION BAR */}
      {selectedRows.length > 0 && (
        <div className="bg-[#FFF1F3] border border-[#EE0033] rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-[#111827]">
            Đã chọn {selectedRows.length} đề nghị
          </span>
          <div className="flex gap-2">
            <button className="h-9 px-4 bg-[#EE0033] text-white rounded-lg text-sm font-medium hover:bg-[#CC002B] flex items-center gap-2">
              <Send size={14} />
              Gửi duyệt
            </button>
            <button className="h-9 px-4 bg-white text-[#374151] border border-[#D1D5DB] rounded-lg text-sm font-medium hover:bg-[#F3F4F6] flex items-center gap-2">
              <FileSpreadsheet size={14} />
              Xuất Excel
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F3F4F6]">
                <th className="w-10 px-4 py-3">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-[#D1D5DB]"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(invoiceListData.map(item => item.id));
                      } else {
                        setSelectedRows([]);
                      }
                    }}
                    checked={selectedRows.length === invoiceListData.length}
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Mã đề nghị</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Số HĐ</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Chủ đầu tư</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Loại DV</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">GT trước VAT</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Thuế</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">GT sau VAT</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">TT Doanh thu</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Người tạo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Ngày tạo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Trạng thái</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Pháp lý</th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {invoiceListData.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b border-[#E5E7EB] transition-colors ${
                    selectedRows.includes(item.id) ? 'bg-[#FFE0E5]' : 'hover:bg-[#FFF1F3]'
                  }`}
                >
                  <td className="px-4 py-3">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-[#D1D5DB]"
                      checked={selectedRows.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows([...selectedRows, item.id]);
                        } else {
                          setSelectedRows(selectedRows.filter(id => id !== item.id));
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-[#EE0033] whitespace-nowrap">{item.id}</td>
                  <td className="px-4 py-3 text-sm text-[#374151] whitespace-nowrap">{item.invoiceNo || '—'}</td>
                  <td className="px-4 py-3 text-sm text-[#374151] whitespace-nowrap">{item.customer}</td>
                  <td className="px-4 py-3 text-sm text-[#374151] whitespace-nowrap">{item.serviceType}</td>
                  <td className="px-4 py-3 text-sm text-[#374151] text-right whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {item.beforeVAT}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#374151] text-right whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {item.tax}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#374151] text-right whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {item.afterVAT}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#374151] whitespace-nowrap">{item.revenueStatus}</td>
                  <td className="px-4 py-3 text-sm text-[#374151] whitespace-nowrap">{item.creator}</td>
                  <td className="px-4 py-3 text-sm text-[#6B7280] whitespace-nowrap">{item.date}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(item.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      {getLegalIcon(item.legal)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuOpen(actionMenuOpen === item.id ? null : item.id)}
                        className="p-1 hover:bg-[#F3F4F6] rounded"
                      >
                        <MoreVertical size={16} className="text-[#6B7280]" />
                      </button>
                      {actionMenuOpen === item.id && (
                        <div className="absolute right-0 top-8 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 z-10 w-40">
                          <button className="w-full px-4 py-2 text-left text-sm text-[#374151] hover:bg-[#F3F4F6] flex items-center gap-2">
                            <Eye size={14} />
                            Xem chi tiết
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm text-[#374151] hover:bg-[#F3F4F6] flex items-center gap-2">
                            <Edit size={14} />
                            Sửa
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm text-[#374151] hover:bg-[#F3F4F6] flex items-center gap-2">
                            <Send size={14} />
                            Gửi duyệt
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm text-[#DC2626] hover:bg-[#FEE2E2] flex items-center gap-2">
                            <Trash2 size={14} />
                            Xoá
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="border-t border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-[#6B7280]">
            Hiển thị <span className="font-medium text-[#374151]">1-15</span> / <span className="font-medium text-[#374151]">156</span>
          </div>
          <div className="flex items-center gap-3">
            <select className="h-9 px-3 border border-[#D1D5DB] rounded-lg text-sm">
              <option>20 / trang</option>
              <option>50 / trang</option>
              <option>100 / trang</option>
            </select>
            <div className="flex gap-1">
              <button className="w-9 h-9 flex items-center justify-center border border-[#D1D5DB] rounded-lg hover:bg-[#F3F4F6]">
                <ChevronLeft size={16} className="text-[#6B7280]" />
              </button>
              <button className="w-9 h-9 flex items-center justify-center bg-[#EE0033] text-white rounded-lg text-sm font-medium">1</button>
              <button className="w-9 h-9 flex items-center justify-center border border-[#D1D5DB] rounded-lg hover:bg-[#F3F4F6] text-sm">2</button>
              <button className="w-9 h-9 flex items-center justify-center border border-[#D1D5DB] rounded-lg hover:bg-[#F3F4F6] text-sm">3</button>
              <span className="w-9 h-9 flex items-center justify-center text-[#9CA3AF]">...</span>
              <button className="w-9 h-9 flex items-center justify-center border border-[#D1D5DB] rounded-lg hover:bg-[#F3F4F6] text-sm">11</button>
              <button className="w-9 h-9 flex items-center justify-center border border-[#D1D5DB] rounded-lg hover:bg-[#F3F4F6]">
                <ChevronRight size={16} className="text-[#6B7280]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}