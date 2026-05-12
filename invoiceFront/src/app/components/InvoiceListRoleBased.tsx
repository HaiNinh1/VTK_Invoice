import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import {
  FileSpreadsheet, Plus, Search, Filter, Calendar, X, ChevronDown,
  ChevronLeft, ChevronRight, MoreVertical, Eye, Edit, Send, Trash2,
  CheckCircle, XCircle, FileText
} from 'lucide-react';
import { formatVND, truncateText, emptyCell } from '../utils/formatters';
import TableSkeleton from './TableSkeleton';
import { useMasterInvoiceData } from '../data/masterInvoiceData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { Button } from './ui/button';

interface InvoiceListRoleBasedProps {
  getStatusBadge: (status: string) => ReactNode;
  getLegalIcon: (legal: string) => ReactNode;
  onCreateNew: () => void;
  userRole: 'employee' | 'manager' | 'accountant' | 'director' | 'admin';
}

export default function InvoiceListRoleBased({ 
  getStatusBadge, 
  getLegalIcon, 
  onCreateNew,
  userRole 
}: InvoiceListRoleBasedProps) {
  const { MASTER_INVOICE_DATA } = useMasterInvoiceData();
  const [filterExpanded, setFilterExpanded] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Handle view detail
  const handleViewDetail = (invoiceId: string) => {
    const invoice = MASTER_INVOICE_DATA.find(inv => inv.requestCode === invoiceId);
    if (invoice) {
      setSelectedInvoice(invoice);
      setShowDetailModal(true);
      setActionMenuOpen(null);
    }
  };

  // Convert MASTER_INVOICE_DATA to display format
  const allInvoiceData = MASTER_INVOICE_DATA.map(record => ({
    id: record.requestCode,
    invoiceNo: record.invoiceNo,
    customer: record.customer,
    serviceType: record.serviceType,
    beforeVAT: record.beforeVAT.toLocaleString('vi-VN'),
    tax: ((record.afterVAT - record.beforeVAT)).toLocaleString('vi-VN'),
    afterVAT: record.afterVAT.toLocaleString('vi-VN'),
    revenueCenter: record.revenueCenter,
    creator: record.creator,
    date: record.createdDate,
    status: record.status,
    legal: record.legalStatus.status === 'complete' ? 'complete' : 
           record.legalStatus.status === 'insufficient' ? 'missing' : 
           record.legalStatus.status === 'overdue' ? 'overdue' : 'committed',
    approvedBy: record.status === 'approved' || record.status === 'issued' || record.status === 'accounted' ? 'Lê Thị Kế toán' : ''
  }));

  // Filter data based on role
  const invoiceListData = userRole === 'employee' 
    ? allInvoiceData.filter(item => item.creator === 'Nguyễn Văn A')
    : userRole === 'manager'
    ? allInvoiceData.filter(item => item.revenueCenter === 'KV3')
    : allInvoiceData;

  // Get title and count based on role
  const getTitle = () => {
    if (userRole === 'employee') {
      return 'Đề nghị xuất Hoá đơn của tôi';
    }
    if (userRole === 'manager') {
      return 'Đề nghị xuất Hoá đơn — TT Khu vực 3';
    }
    return 'Đề nghị xuất Hoá đơn — Toàn công ty';
  };

  const getCount = () => {
    return invoiceListData.length;
  };

  // Check if user can edit/delete a record
  const canEditRecord = (record: any) => {
    if (userRole === 'admin') return true;
    if (userRole === 'employee' && record.creator === 'Nguyễn Văn A' && record.status === 'draft') return true;
    if (userRole === 'manager' && record.creator === 'Nguyễn Văn A' && record.status === 'draft') return true;
    return false;
  };

  const canDeleteRecord = (record: any) => {
    if (userRole === 'admin') return true;
    if (userRole === 'employee' && record.creator === 'Nguyễn Văn A' && record.status === 'draft') return true;
    if (userRole === 'manager' && record.creator === 'Nguyễn Văn A' && record.status === 'draft') return true;
    return false;
  };

  const canSubmitRecord = (record: any) => {
    if (userRole === 'employee' && record.creator === 'Nguyễn Văn A' && record.status === 'draft') return true;
    if (userRole === 'manager' && record.creator === 'Nguyễn Văn A' && record.status === 'draft') return true;
    return false;
  };

  // Show columns based on role
  const showRevenueCenterColumn = userRole !== 'employee' && userRole !== 'manager';
  const showCreatorColumn = userRole !== 'employee';
  const showApprovedByColumn = userRole === 'director' || userRole === 'admin';
  const showCreateButton = userRole === 'employee' || userRole === 'manager' || userRole === 'admin';

  // Empty state for new employee users
  if (userRole === 'employee' && invoiceListData.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#111827]">{getTitle()}</h1>
            <p className="text-sm text-[#6B7280] mt-1">Tổng: 0 đề nghị</p>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#FFF1F3] flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-[#EE0033]" />
          </div>
          <h3 className="text-lg font-semibold text-[#111827] mb-2">Bạn chưa có đề nghị nào</h3>
          <p className="text-sm text-[#6B7280] mb-6">Bắt đầu tạo đề nghị đầu tiên!</p>
          <button
            className="h-10 px-6 bg-[#EE0033] text-white rounded-lg text-sm font-medium hover:bg-[#CC002B] inline-flex items-center gap-2"
            onClick={onCreateNew}
          >
            <Plus size={16} />
            Tạo đề nghị mới
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">{getTitle()}</h1>
          <p className="text-sm text-[#6B7280] mt-1">Tổng: {getCount()} đề nghị</p>
        </div>
        <div className="flex gap-2">
          <button className="h-10 px-4 bg-white text-[#374151] border border-[#D1D5DB] rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#F3F4F6]">
            <FileSpreadsheet size={16} />
            Xuất Excel
          </button>
          {showCreateButton && (
            <button
              className="h-10 px-4 bg-[#EE0033] text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#CC002B]"
              onClick={onCreateNew}
            >
              <Plus size={16} />
              Tạo đề nghị mới
            </button>
          )}
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
            {/* Row 1 - Filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Show Revenue Center only for accountant/director/admin (not employee/manager) */}
              {userRole !== 'employee' && userRole !== 'manager' && (
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Trung tâm doanh thu</label>
                  <select className="w-full h-9 px-3 border border-[#D1D5DB] rounded-lg text-sm">
                    <option>Tất cả</option>
                    <option>TT Khu vực 1</option>
                    <option>TT Khu vực 2</option>
                    <option>TT Khu vực 3</option>
                    <option>TT Khu vực 4</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Trạng thái</label>
                <select className="w-full h-9 px-3 border border-[#D1D5DB] rounded-lg text-sm">
                  <option>Tất cả</option>
                  <option>Bản thảo</option>
                  <option>Chờ phê duyệt</option>
                  <option>Đã duyệt</option>
                  <option>Đã xuất HĐ</option>
                  <option>Từ chối</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Loại dịch vụ</label>
                <select className="w-full h-9 px-3 border border-[#D1D5DB] rounded-lg text-sm">
                  <option>Tất cả</option>
                  <option>Tích hợp hệ thống</option>
                  <option>Tư vấn CNTT</option>
                  <option>Dịch vụ Cloud</option>
                  <option>Phát triển phần mềm</option>
                  <option>Bảo trì hệ thống</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Tình trạng pháp lý</label>
                <select className="w-full h-9 px-3 border border-[#D1D5DB] rounded-lg text-sm">
                  <option>Tất cả</option>
                  <option>Đầy đủ</option>
                  <option>Thiếu hồ sơ</option>
                  <option>Quá hạn</option>
                </select>
              </div>

              {/* Show Creator filter only for non-employee */}
              {userRole !== 'employee' && (
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Người tạo</label>
                  <select className="w-full h-9 px-3 border border-[#D1D5DB] rounded-lg text-sm">
                    <option>Tất cả</option>
                    <option>Nguyễn Văn A</option>
                    <option>Trần Thị B</option>
                    <option>Lê Văn C</option>
                    <option>Phạm Thị D</option>
                  </select>
                </div>
              )}

              {/* Director-only filter: Accountant who approved */}
              {userRole === 'director' && (
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Kế toán duyệt</label>
                  <select className="w-full h-9 px-3 border border-[#D1D5DB] rounded-lg text-sm">
                    <option>Tất cả</option>
                    <option>Lê Thị Kế toán</option>
                    <option>Nguyễn Văn KT</option>
                    <option>Trần Thị KT</option>
                  </select>
                </div>
              )}
            </div>

            {/* Row 2 - Date Range & Search */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Từ ngày</label>
                <div className="relative">
                  <input 
                    type="date" 
                    className="w-full h-9 px-3 pr-8 border border-[#D1D5DB] rounded-lg text-sm"
                  />
                  <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Đến ngày</label>
                <div className="relative">
                  <input 
                    type="date" 
                    className="w-full h-9 px-3 pr-8 border border-[#D1D5DB] rounded-lg text-sm"
                  />
                  <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Tìm kiếm</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Mã đề nghị, Khách hàng..." 
                    className="w-full h-9 pl-9 pr-3 border border-[#D1D5DB] rounded-lg text-sm"
                  />
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <button className="h-8 px-3 text-sm text-[#6B7280] hover:text-[#374151]">
                Xóa bộ lọc
              </button>
              <button className="h-8 px-4 bg-[#EE0033] text-white text-sm font-medium rounded-lg hover:bg-[#CC002B]">
                Áp dụng
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Desktop Table */}
        <div className="overflow-x-auto relative hidden md:block">
          <table className="w-full min-w-[1200px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#F3F4F6] border-b border-[#E5E7EB]">
                {/* Sticky checkbox column */}
                <th className="sticky left-0 z-20 bg-[#F3F4F6] w-10 px-4 py-3 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
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
                  />
                </th>
                {/* Sticky Mã đề nghị column */}
                <th className="sticky left-10 z-20 bg-[#F3F4F6] text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase min-w-[140px] shadow-[2px_0_4px_rgba(0,0,0,0.05)]">Mã đề nghị</th>
                
                {/* Scrollable columns */}
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase min-w-[120px]">Số HĐ</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase min-w-[180px]">Khách hàng (CĐT)</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase min-w-[140px]">Loại DV</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase min-w-[140px]">Giá trị sau VAT</th>
                
                {/* Show Revenue Center only for non-employee */}
                {showRevenueCenterColumn && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase min-w-[120px]">TT Doanh thu</th>
                )}
                
                {/* Show Creator only for non-employee */}
                {showCreatorColumn && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase min-w-[120px]">Người tạo</th>
                )}
                
                {/* Show Approved By only for director */}
                {showApprovedByColumn && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase min-w-[120px]">Đã duyệt bởi</th>
                )}
                
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase min-w-[120px]">Trạng thái</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase min-w-[80px]">Pháp lý</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase min-w-[100px]">Ngày tạo</th>
                
                {/* Sticky action column */}
                <th className="sticky right-0 z-20 bg-[#F3F4F6] text-center px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase min-w-[100px] shadow-[-2px_0_4px_rgba(0,0,0,0.05)]">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton rows={10} columns={userRole === 'director' ? 14 : userRole === 'employee' ? 10 : 13} />
              ) : (
                invoiceListData.map((item) => {
                  const customerTruncated = truncateText(item.customer, 30);
                  return (
                    <tr 
                      key={item.id} 
                      className="border-b border-[#E5E7EB] hover:bg-[#FFF1F3] transition-colors h-12"
                    >
                      {/* Sticky checkbox cell */}
                      <td className="sticky left-0 z-10 bg-white px-4 py-3 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
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
                      
                      {/* Sticky Mã đề nghị cell */}
                      <td className="sticky left-10 z-10 bg-white px-4 py-3 text-sm font-medium text-[#EE0033] shadow-[2px_0_4px_rgba(0,0,0,0.05)]">{item.id}</td>
                      
                      {/* Scrollable cells */}
                      <td className="px-4 py-3 text-sm text-[#6B7280]">
                        {emptyCell(item.invoiceNo)}
                      </td>
                      <td 
                        className="px-4 py-3 text-sm text-[#374151] relative"
                        onMouseEnter={() => customerTruncated.isTruncated && setHoveredCell(`customer-${item.id}`)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {customerTruncated.text}
                        {customerTruncated.isTruncated && hoveredCell === `customer-${item.id}` && (
                          <div className="absolute left-0 top-full mt-1 bg-[#111827] text-white text-xs px-3 py-2 rounded-lg shadow-xl z-30 whitespace-nowrap">
                            {customerTruncated.fullText}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6B7280]">{item.serviceType}</td>
                      <td className="px-4 py-3 text-sm text-[#374151] text-right font-[tabular-nums]">
                        {formatVND(item.afterVAT)}
                      </td>
                      
                      {showRevenueCenterColumn && (
                        <td className="px-4 py-3 text-sm text-[#6B7280]">{item.revenueCenter}</td>
                      )}
                      
                      {showCreatorColumn && (
                        <td className="px-4 py-3 text-sm text-[#6B7280]">{item.creator}</td>
                      )}
                      
                      {showApprovedByColumn && (
                        <td className="px-4 py-3 text-sm text-[#6B7280]">{emptyCell(item.approvedBy)}</td>
                      )}
                      
                      <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          {getLegalIcon(item.legal)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6B7280]">{item.date}</td>
                      
                      {/* Sticky action cell */}
                      <td className="sticky right-0 z-10 bg-white px-4 py-3 shadow-[-2px_0_4px_rgba(0,0,0,0.05)]">
                        <div className="relative">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === item.id ? null : item.id)}
                            className="p-1 hover:bg-[#F3F4F6] rounded"
                          >
                            <MoreVertical size={16} className="text-[#6B7280]" />
                          </button>
                          
                          {actionMenuOpen === item.id && (
                            <div className="absolute right-0 top-8 w-48 bg-white border border-[#E5E7EB] rounded-lg shadow-xl z-10 py-1">
                              {/* Employee: Full control of own requests */}
                              {userRole === 'employee' && (
                                <>
                                  <button
                                    onClick={() => handleViewDetail(item.id)}
                                    className="w-full h-9 px-3 text-left text-sm text-[#374151] hover:bg-[#F3F4F6] flex items-center gap-2"
                                  >
                                    <Eye size={14} />
                                    Xem chi tiết
                                  </button>
                                  {item.status === 'draft' && (
                                    <>
                                      <button className="w-full h-9 px-3 text-left text-sm text-[#374151] hover:bg-[#F3F4F6] flex items-center gap-2">
                                        <Edit size={14} />
                                        Sửa
                                      </button>
                                      <button className="w-full h-9 px-3 text-left text-sm text-[#374151] hover:bg-[#F3F4F6] flex items-center gap-2">
                                        <Send size={14} />
                                        Gửi phê duyệt
                                      </button>
                                      <button className="w-full h-9 px-3 text-left text-sm text-[#DC2626] hover:bg-[#FEE2E2] flex items-center gap-2">
                                        <Trash2 size={14} />
                                        Xoá
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                              
                              {/* Manager: View all department records, edit only own drafts */}
                              {userRole === 'manager' && (
                                <>
                                  <button
                                    onClick={() => handleViewDetail(item.id)}
                                    className="w-full h-9 px-3 text-left text-sm text-[#374151] hover:bg-[#F3F4F6] flex items-center gap-2"
                                  >
                                    <Eye size={14} />
                                    Xem chi tiết
                                  </button>
                                  {item.creator === 'Nguyễn Văn A' && item.status === 'draft' && (
                                    <>
                                      <button className="w-full h-9 px-3 text-left text-sm text-[#374151] hover:bg-[#F3F4F6] flex items-center gap-2">
                                        <Edit size={14} />
                                        Sửa
                                      </button>
                                      <button className="w-full h-9 px-3 text-left text-sm text-[#374151] hover:bg-[#F3F4F6] flex items-center gap-2">
                                        <Send size={14} />
                                        Gửi phê duyệt
                                      </button>
                                      <button className="w-full h-9 px-3 text-left text-sm text-[#DC2626] hover:bg-[#FEE2E2] flex items-center gap-2">
                                        <Trash2 size={14} />
                                        Xoá
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                              
                              {/* Accountant & Director: Approve actions */}
                              {(userRole === 'accountant' || userRole === 'director' || userRole === 'admin') && (
                                <>
                                  <button
                                    onClick={() => handleViewDetail(item.id)}
                                    className="w-full h-9 px-3 text-left text-sm text-[#374151] hover:bg-[#F3F4F6] flex items-center gap-2"
                                  >
                                    <Eye size={14} />
                                    Xem chi tiết
                                  </button>
                                  {item.status === 'pending' && (
                                    <>
                                      <button className="w-full h-9 px-3 text-left text-sm text-[#16A34A] hover:bg-[#D1FAE5] flex items-center gap-2">
                                        <CheckCircle size={14} />
                                        Phê duyệt
                                      </button>
                                      <button className="w-full h-9 px-3 text-left text-sm text-[#DC2626] hover:bg-[#FEE2E2] flex items-center gap-2">
                                        <XCircle size={14} />
                                        Trả lại
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="block md:hidden p-3 space-y-2">
          {invoiceListData.map((item) => (
            <div key={item.id} className="bg-white border border-[#E5E7EB] rounded-lg p-3">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm text-[#EE0033]">{item.id}</span>
                {getStatusBadge(item.status)}
              </div>
              <p className="text-sm text-[#374151] truncate">{item.customer}</p>
              <div className="flex justify-between items-center mt-2 text-xs text-[#6B7280]">
                <span>{formatVND(item.afterVAT)}</span>
                <span>{item.date}</span>
                {getLegalIcon(item.legal)}
              </div>
              <div className="flex gap-2 mt-2 border-t border-[#E5E7EB] pt-2">
                <button
                  onClick={() => handleViewDetail(item.id)}
                  className="text-xs text-[#1D4ED8]"
                >
                  Xem
                </button>
                {canEditRecord(item) && <button className="text-xs text-[#6B7280]">Sửa</button>}
              </div>
            </div>
          ))}
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-t border-[#E5E7EB] gap-2">
          <div className="text-sm text-[#6B7280]">
            Hiển thị <span className="font-medium text-[#374151]">1-{invoiceListData.length}</span> trong tổng số <span className="font-medium text-[#374151]">{invoiceListData.length}</span> đề nghị
          </div>
          <div className="flex items-center gap-2">
            <button className="h-8 w-8 flex items-center justify-center border border-[#D1D5DB] rounded hover:bg-[#F3F4F6] disabled:opacity-50" disabled>
              <ChevronLeft size={16} className="text-[#6B7280]" />
            </button>
            <button className="h-8 px-3 bg-[#EE0033] text-white rounded text-sm font-medium">1</button>
            <button className="h-8 px-3 border border-[#D1D5DB] rounded text-sm hover:bg-[#F3F4F6]">2</button>
            <button className="h-8 px-3 border border-[#D1D5DB] rounded text-sm hover:bg-[#F3F4F6]">3</button>
            <button className="h-8 w-8 flex items-center justify-center border border-[#D1D5DB] rounded hover:bg-[#F3F4F6]">
              <ChevronRight size={16} className="text-[#6B7280]" />
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đề nghị xuất hóa đơn</DialogTitle>
            <DialogDescription>
              {selectedInvoice && `Mã đề nghị: ${selectedInvoice.requestCode}`}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="bg-[#F9FAFB] rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#111827] mb-3">Thông tin cơ bản</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-[#6B7280] mb-1">Mã đề nghị</div>
                    <div className="font-medium text-[#111827]">{selectedInvoice.requestCode}</div>
                  </div>
                  <div>
                    <div className="text-[#6B7280] mb-1">Số hóa đơn</div>
                    <div className="font-medium text-[#111827]">{selectedInvoice.invoiceNo || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[#6B7280] mb-1">Ngày tạo</div>
                    <div className="font-medium text-[#111827]">{selectedInvoice.createdDate}</div>
                  </div>
                  <div>
                    <div className="text-[#6B7280] mb-1">Người tạo</div>
                    <div className="font-medium text-[#111827]">{selectedInvoice.creator}</div>
                  </div>
                  <div>
                    <div className="text-[#6B7280] mb-1">Trung tâm doanh thu</div>
                    <div className="font-medium text-[#111827]">{selectedInvoice.revenueCenter}</div>
                  </div>
                  <div>
                    <div className="text-[#6B7280] mb-1">Trạng thái</div>
                    <div>{getStatusBadge(selectedInvoice.status)}</div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-[#F9FAFB] rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#111827] mb-3">Thông tin khách hàng</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="col-span-2">
                    <div className="text-[#6B7280] mb-1">Tên khách hàng</div>
                    <div className="font-medium text-[#111827]">{selectedInvoice.customer}</div>
                  </div>
                  <div>
                    <div className="text-[#6B7280] mb-1">Mã số thuế</div>
                    <div className="font-medium text-[#111827]">{selectedInvoice.taxCode}</div>
                  </div>
                  <div>
                    <div className="text-[#6B7280] mb-1">Phòng ban</div>
                    <div className="font-medium text-[#111827]">{selectedInvoice.department}</div>
                  </div>
                </div>
              </div>

              {/* Service & Amount */}
              <div className="bg-[#F9FAFB] rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#111827] mb-3">Thông tin dịch vụ & giá trị</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-[#6B7280] mb-1">Loại dịch vụ</div>
                    <div className="font-medium text-[#111827]">{selectedInvoice.serviceType}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-[#6B7280] mb-1">Giá trị trước thuế</div>
                      <div className="font-semibold text-[#111827]">{selectedInvoice.beforeVAT.toLocaleString('vi-VN')} đ</div>
                    </div>
                    <div>
                      <div className="text-[#6B7280] mb-1">Thuế GTGT ({selectedInvoice.taxRate})</div>
                      <div className="font-semibold text-[#111827]">{(selectedInvoice.afterVAT - selectedInvoice.beforeVAT).toLocaleString('vi-VN')} đ</div>
                    </div>
                    <div>
                      <div className="text-[#6B7280] mb-1">Tổng giá trị</div>
                      <div className="font-bold text-[#EE0033] text-base">{selectedInvoice.afterVAT.toLocaleString('vi-VN')} đ</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal Status */}
              <div className="bg-[#F9FAFB] rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#111827] mb-3">Tình trạng pháp lý</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-[#6B7280]">Trạng thái hồ sơ</div>
                    <div>{getLegalIcon(selectedInvoice.legalStatus.status === 'complete' ? 'complete' :
                           selectedInvoice.legalStatus.status === 'insufficient' ? 'missing' :
                           selectedInvoice.legalStatus.status === 'overdue' ? 'overdue' : 'committed')}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[#6B7280] mb-1">Hoàn thành</div>
                      <div className="font-medium text-[#111827]">{selectedInvoice.legalStatus.completed}/{selectedInvoice.legalStatus.total} hồ sơ</div>
                    </div>
                    <div>
                      <div className="text-[#6B7280] mb-1">Tỷ lệ hoàn thành</div>
                      <div className="font-medium text-[#111827]">
                        {Math.round((selectedInvoice.legalStatus.completed / selectedInvoice.legalStatus.total) * 100)}%
                      </div>
                    </div>
                  </div>
                  {selectedInvoice.commitment && (
                    <div className="border-t border-[#E5E7EB] pt-3 mt-3">
                      <div className="text-[#6B7280] mb-2">Cam kết pháp lý:</div>
                      <div className="bg-white rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-[#111827]">{selectedInvoice.commitment.code}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            selectedInvoice.commitment.status === 'active' ? 'bg-[#D1FAE5] text-[#065F46]' :
                            selectedInvoice.commitment.status === 'near-due' ? 'bg-[#FEF3C7] text-[#92400E]' :
                            'bg-[#FEE2E2] text-[#991B1B]'
                          }`}>
                            {selectedInvoice.commitment.status === 'active' ? 'Đang thực hiện' :
                             selectedInvoice.commitment.status === 'near-due' ? 'Gần đến hạn' : 'Quá hạn'}
                          </span>
                        </div>
                        <div className="text-xs text-[#6B7280]">{selectedInvoice.commitment.content}</div>
                        <div className="text-xs text-[#6B7280]">
                          Hạn: {selectedInvoice.commitment.deadline} ({selectedInvoice.commitment.daysRemaining} ngày)
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* S-Invoice Status */}
              {selectedInvoice.sInvoiceStatus && selectedInvoice.sInvoiceStatus !== 'none' && (
                <div className="bg-[#F9FAFB] rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-[#111827] mb-3">Trạng thái S-Invoice</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-[#6B7280] mb-1">Trạng thái xuất</div>
                      <div className="font-medium text-[#111827]">
                        {selectedInvoice.sInvoiceStatus === 'completed' ? 'Đã xuất' :
                         selectedInvoice.sInvoiceStatus === 'sent-to-cqt' ? 'Đã gửi CQT' :
                         selectedInvoice.sInvoiceStatus === 'pending' ? 'Đang xử lý' :
                         selectedInvoice.sInvoiceStatus === 'error' ? 'Lỗi' : 'Chưa xuất'}
                      </div>
                    </div>
                    {selectedInvoice.sInvoiceCode && (
                      <div>
                        <div className="text-[#6B7280] mb-1">Mã S-Invoice</div>
                        <div className="font-medium text-[#111827]">{selectedInvoice.sInvoiceCode}</div>
                      </div>
                    )}
                  </div>
                  {selectedInvoice.sInvoiceError && (
                    <div className="bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg p-3">
                      <div className="text-xs font-medium text-[#991B1B] mb-1">Lỗi:</div>
                      <div className="text-xs text-[#DC2626]">{selectedInvoice.sInvoiceError}</div>
                    </div>
                  )}
                </div>
              )}

              {/* VFS Accounting Status */}
              {selectedInvoice.vfsStatus && selectedInvoice.vfsStatus !== 'none' && (
                <div className="bg-[#F9FAFB] rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-[#111827] mb-3">Trạng thái hạch toán VFS</h3>
                  <div className="text-sm">
                    <div className="text-[#6B7280] mb-1">Trạng thái</div>
                    <div className="font-medium text-[#111827]">
                      {selectedInvoice.vfsStatus === 'completed' ? 'Đã ghi sổ' :
                       selectedInvoice.vfsStatus === 'processing' ? 'Đang xử lý' :
                       selectedInvoice.vfsStatus === 'pending' ? 'Chờ xử lý' : 'Chưa đồng bộ'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}