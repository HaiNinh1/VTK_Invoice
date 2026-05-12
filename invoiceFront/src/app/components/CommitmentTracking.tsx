import { useState } from 'react';
import {
  AlertTriangle, ChevronDown, ChevronUp, Upload, Eye, CheckCircle,
  Clock, FileText, X, Calendar, User, Building2, FileCheck, Lock
} from 'lucide-react';
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { Button } from './ui/button';

export default function CommitmentTracking() {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState<any>(null);

  const toggleRow = (id: string) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const commitments = [
    {
      id: 'CK-2026-00012',
      requestId: 'DN-2026-00154',
      person: 'Lê Văn C',
      department: 'Phòng Kế toán',
      missingDocs: ['Biên bản nghiệm thu', 'Báo cáo kết quả thực hiện'],
      deadline: '20/03/2026',
      commitmentDate: '12/03/2026',
      status: 'tracking',
      daysRemaining: 7,
      customer: 'Công ty CP Bưu chính VN',
      amount: '1.375.000.000'
    },
    {
      id: 'CK-2026-00011',
      requestId: 'DN-2026-00152',
      person: 'Hoàng Văn E',
      department: 'Phòng Kinh doanh',
      missingDocs: ['Báo cáo kết quả thực hiện', 'Xác nhận công nợ'],
      deadline: '18/03/2026',
      commitmentDate: '11/03/2026',
      status: 'overdue',
      daysRemaining: -5,
      customer: 'VNPT Vinaphone',
      amount: '3.465.000.000'
    },
    {
      id: 'CK-2026-00010',
      requestId: 'DN-2026-00150',
      person: 'Vũ Văn G',
      department: 'Phòng Kỹ thuật',
      missingDocs: ['Biên bản thỏa thuận giá', 'Chứng từ thanh toán', 'Xác nhận thanh toán'],
      deadline: '25/03/2026',
      commitmentDate: '10/03/2026',
      status: 'tracking',
      daysRemaining: 12,
      customer: 'Viettel High Tech',
      amount: '5.225.000.000'
    },
    {
      id: 'CK-2026-00009',
      requestId: 'DN-2026-00148',
      person: 'Ngô Văn I',
      department: 'Phòng Kế toán',
      missingDocs: ['Chứng từ giao nhận'],
      deadline: '16/03/2026',
      commitmentDate: '09/03/2026',
      status: 'upcoming',
      daysRemaining: 3,
      customer: 'Viettel Networks',
      amount: '3.179.000.000'
    },
    {
      id: 'CK-2026-00008',
      requestId: 'DN-2026-00146',
      person: 'Lý Văn K',
      department: 'Phòng Kinh doanh',
      missingDocs: ['Biên bản nghiệm thu', 'Bảng kê chi tiết', 'Chứng từ thanh toán'],
      deadline: '22/03/2026',
      commitmentDate: '08/03/2026',
      status: 'tracking',
      daysRemaining: 9,
      customer: 'Viettel Aerospace',
      amount: '16.720.000.000'
    },
    {
      id: 'CK-2026-00007',
      requestId: 'DN-2026-00143',
      person: 'Mai Thị N',
      department: 'Phòng Kế toán',
      missingDocs: ['Báo cáo kết quả thực hiện'],
      deadline: '15/03/2026',
      commitmentDate: '07/03/2026',
      status: 'overdue',
      daysRemaining: -2,
      customer: 'VNPT VinaPhone South',
      amount: '3.795.000.000'
    },
    {
      id: 'CK-2026-00006',
      requestId: 'DN-2026-00141',
      person: 'Phan Thị J',
      department: 'Phòng Kỹ thuật',
      missingDocs: ['Chứng từ giao nhận', 'Xác nhận công nợ'],
      deadline: '21/03/2026',
      commitmentDate: '06/03/2026',
      status: 'tracking',
      daysRemaining: 8,
      customer: 'Tập đoàn Bưu chính VN',
      amount: '8.415.000.000'
    },
    {
      id: 'CK-2026-00005',
      requestId: 'DN-2026-00139',
      person: 'Trịnh Văn M',
      department: 'Phòng Kinh doanh',
      missingDocs: ['Biên bản thỏa thuận giá'],
      deadline: '19/03/2026',
      commitmentDate: '05/03/2026',
      status: 'tracking',
      daysRemaining: 6,
      customer: 'Viettel IDC',
      amount: '10.857.000.000'
    },
    {
      id: 'CK-2026-00004',
      requestId: 'DN-2026-00137',
      person: 'Đặng Thị L',
      department: 'Phòng Kế toán',
      missingDocs: ['Bảng kê chi tiết', 'Chứng từ thanh toán'],
      deadline: '17/03/2026',
      commitmentDate: '04/03/2026',
      status: 'upcoming',
      daysRemaining: 4,
      customer: 'VNPT Hà Nội',
      amount: '4.752.000.000'
    },
    {
      id: 'CK-2026-00003',
      requestId: 'DN-2026-00135',
      person: 'Hồ Văn O',
      department: 'Phòng Kỹ thuật',
      missingDocs: ['Biên bản nghiệm thu'],
      deadline: '24/03/2026',
      commitmentDate: '03/03/2026',
      status: 'tracking',
      daysRemaining: 11,
      customer: 'Viettel Solutions',
      amount: '12.320.000.000'
    },
    {
      id: 'CK-2026-00002',
      requestId: 'DN-2026-00133',
      person: 'Nguyễn Thị P',
      department: 'Phòng Kinh doanh',
      missingDocs: ['Xác nhận công nợ'],
      deadline: '23/03/2026',
      commitmentDate: '02/03/2026',
      status: 'tracking',
      daysRemaining: 10,
      customer: 'VNPT Technology',
      amount: '7.560.000.000'
    },
    {
      id: 'CK-2026-00001',
      requestId: 'DN-2026-00131',
      person: 'Trần Văn Q',
      department: 'Phòng Kế toán',
      missingDocs: ['Chứng từ giao nhận', 'Giấy bảo lãnh thực hiện'],
      deadline: '16/03/2026',
      commitmentDate: '01/03/2026',
      status: 'upcoming',
      daysRemaining: 3,
      customer: 'Viettel Telecom',
      amount: '9.240.000.000'
    }
  ];

  const stats = {
    tracking: commitments.filter(c => c.status === 'tracking').length,
    upcoming: commitments.filter(c => c.status === 'upcoming').length,
    overdue: commitments.filter(c => c.status === 'overdue').length,
    completed: 45
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      tracking: { bg: '#DBEAFE', text: '#1E40AF', label: 'Đang theo dõi' },
      upcoming: { bg: '#FEF3C7', text: '#92400E', label: 'Sắp đến hạn' },
      overdue: { bg: '#FEE2E2', text: '#991B1B', label: 'Quá hạn' },
      completed: { bg: '#D1FAE5', text: '#065F46', label: 'Đã hoàn thành' }
    };
    const s = statusMap[status];
    if (!s) {
      return (
        <span className="inline-flex items-center h-6 px-3 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">
          {status}
        </span>
      );
    }
    return (
      <span 
        className={`inline-flex items-center h-6 px-3 rounded-full text-xs font-medium ${status === 'overdue' ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: s.bg, color: s.text }}
      >
        {s.label}
      </span>
    );
  };

  const getRemainingDisplay = (days: number) => {
    if (days < 0) {
      return (
        <span className="text-sm font-bold text-[#DC2626]">
          Quá hạn {Math.abs(days)} ngày
        </span>
      );
    } else if (days <= 3) {
      return (
        <span className="text-sm font-semibold text-[#D97706]">
          {days} ngày
        </span>
      );
    } else {
      return (
        <span className="text-sm text-[#16A34A]">
          {days} ngày
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <div className="text-sm text-[#6B7280] mb-2">
          Quản lý pháp lý <span className="text-[#D1D5DB]">›</span> Danh sách theo dõi
        </div>
        <h1 className="text-2xl font-semibold text-[#111827]">Danh sách cam kết bổ sung</h1>
        <p className="text-sm text-[#6B7280] mt-1">Theo dõi các cam kết bổ sung hồ sơ pháp lý</p>
      </div>

      {/* ALERT BANNER */}
      {stats.overdue > 0 && (
        <div className="bg-[#FEE2E2] border border-[#DC2626] rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#DC2626] flex items-center justify-center animate-pulse">
              <AlertTriangle size={20} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#991B1B]">
                ⚠ Có {stats.overdue} cam kết quá hạn
              </div>
              <div className="text-xs text-[#991B1B] mt-0.5">
                Cần xử lý ngay để đảm bảo tiến độ xuất hoá đơn
              </div>
            </div>
          </div>
          <button className="h-9 px-4 bg-[#DC2626] text-white rounded-lg text-sm font-medium hover:bg-[#B91C1C]">
            Xem chi tiết
          </button>
        </div>
      )}

      {/* STATS CARDS */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#FFF1F3] flex items-center justify-center">
              <Clock size={20} className="text-[#EE0033]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#EE0033]" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {stats.tracking}
          </div>
          <div className="text-sm text-[#6B7280] mt-1">Đang theo dõi</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center">
              <AlertTriangle size={20} className="text-[#D97706]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#D97706]" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {stats.upcoming}
          </div>
          <div className="text-sm text-[#6B7280] mt-1">Sắp đến hạn</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center animate-pulse">
              <X size={20} className="text-[#DC2626]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#DC2626]" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {stats.overdue}
          </div>
          <div className="text-sm text-[#6B7280] mt-1">Quá hạn</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#D1FAE5] flex items-center justify-center">
              <CheckCircle size={20} className="text-[#16A34A]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#16A34A]" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {stats.completed}
          </div>
          <div className="text-sm text-[#6B7280] mt-1">Đã hoàn thành</div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F3F4F6]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap w-8"></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Mã CK</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Mã ĐN</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Người cam kết</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Phòng ban</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Hồ sơ còn thiếu</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Hạn bổ sung</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Ngày cam kết</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Trạng thái</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Còn lại</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {commitments.map((commitment) => (
                <React.Fragment key={commitment.id}>
                  <tr
                    className={`border-b border-[#E5E7EB] hover:bg-[#FFF1F3] transition-colors ${
                      commitment.status === 'overdue' ? 'border-l-4 border-l-[#DC2626] bg-[#FEF2F2]' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleRow(commitment.id)}
                        className="p-1 hover:bg-[#F3F4F6] rounded"
                      >
                        {expandedRows.includes(commitment.id) ? (
                          <ChevronUp size={16} className="text-[#6B7280]" />
                        ) : (
                          <ChevronDown size={16} className="text-[#6B7280]" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[#EE0033] whitespace-nowrap">
                      {commitment.id}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[#EE0033] whitespace-nowrap">
                      {commitment.requestId}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#374151] whitespace-nowrap">
                      {commitment.person}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#374151] whitespace-nowrap">
                      {commitment.department}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#374151]">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center h-6 px-2.5 bg-[#FEE2E2] text-[#991B1B] text-xs font-medium rounded">
                          {commitment.missingDocs.length} hồ sơ
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#374151] whitespace-nowrap">
                      {commitment.deadline}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6B7280] whitespace-nowrap">
                      {commitment.commitmentDate}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(commitment.status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getRemainingDisplay(commitment.daysRemaining)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedCommitment(commitment);
                            setShowUpdateModal(true);
                          }}
                          className="h-8 px-3 bg-[#EE0033] text-white rounded text-xs font-medium hover:bg-[#CC002B] flex items-center gap-1.5"
                        >
                          <Upload size={14} />
                          Cập nhật
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCommitment(commitment);
                            setShowViewModal(true);
                          }}
                          className="h-8 px-3 bg-white border border-[#D1D5DB] text-[#374151] rounded text-xs font-medium hover:bg-[#F3F4F6] flex items-center gap-1.5"
                        >
                          <Eye size={14} />
                          Xem
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* EXPANDED ROW */}
                  {expandedRows.includes(commitment.id) && (
                    <tr className={commitment.status === 'overdue' ? 'border-l-4 border-l-[#DC2626] bg-[#FEF2F2]' : ''}>
                      <td colSpan={11} className="px-4 py-4 bg-[#F9FAFB]">
                        <div className="ml-8 space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-[#6B7280]">Chủ đầu tư:</span>
                              <span className="ml-2 text-[#111827] font-medium">{commitment.customer}</span>
                            </div>
                            <div>
                              <span className="text-[#6B7280]">Giá trị:</span>
                              <span className="ml-2 text-[#111827] font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                {commitment.amount} đ
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[#374151] mb-2">Hồ sơ còn thiếu:</div>
                            <div className="space-y-2">
                              {commitment.missingDocs.map((doc, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                  <div className="w-5 h-5 rounded-full border-2 border-[#DC2626] flex items-center justify-center">
                                    <X size={12} className="text-[#DC2626]" />
                                  </div>
                                  <span className="text-[#374151]">{doc}</span>
                                  <span className="text-xs text-[#DC2626]">Chưa bổ sung</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* UPDATE MODAL */}
      {showUpdateModal && selectedCommitment && (
        <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
          <DialogContent className="w-[640px] max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Cập nhật cam kết</DialogTitle>
              <DialogDescription>{selectedCommitment.id} - {selectedCommitment.requestId}</DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Commitment Info */}
                <div className="bg-[#F9FAFB] rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-[#6B7280]">Người cam kết:</span>
                      <span className="ml-2 text-[#111827] font-medium">{selectedCommitment.person}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Hạn bổ sung:</span>
                      <span className="ml-2 text-[#111827] font-semibold">{selectedCommitment.deadline}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Phòng ban:</span>
                      <span className="ml-2 text-[#111827]">{selectedCommitment.department}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Còn lại:</span>
                      <span className="ml-2">{getRemainingDisplay(selectedCommitment.daysRemaining)}</span>
                    </div>
                  </div>
                </div>

                {/* Missing Documents Checklist */}
                <div>
                  <h4 className="text-sm font-semibold text-[#111827] mb-3">Hồ sơ cần bổ sung</h4>
                  <div className="space-y-3">
                    {selectedCommitment.missingDocs.map((doc: string, index: number) => (
                      <div key={index} className="bg-white border border-[#E5E7EB] rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-5 h-5 mt-0.5 rounded border-2 border-[#D1D5DB]"></div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-[#374151]">{doc}</div>
                              <div className="text-xs text-[#6B7280] mt-1">Chưa bổ sung</div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-8">
                          <label className="block text-xs font-medium text-[#374151] mb-2">Tải lên hồ sơ</label>
                          <div className="border-2 border-dashed border-[#D1D5DB] rounded-lg p-4 text-center hover:border-[#EE0033] transition-colors cursor-pointer">
                            <Upload size={24} className="mx-auto text-[#9CA3AF] mb-2" />
                            <p className="text-xs text-[#6B7280]">
                              Kéo thả file hoặc <span className="text-[#EE0033] font-medium">chọn file</span>
                            </p>
                            <p className="text-[10px] text-[#9CA3AF] mt-1">PDF, DOC, JPG (tối đa 10MB)</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">Ghi chú</label>
                  <textarea
                    rows={3}
                    placeholder="Nhập ghi chú (không bắt buộc)"
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] focus:border-transparent resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            <DialogFooter>
              <DialogClose className="flex-1 h-10 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F3F4F6]">
                Hủy
              </DialogClose>
              <Button
                onClick={() => {
                  setShowUpdateModal(false);
                  alert('Đã cập nhật cam kết thành công!');
                }}
                className="flex-1 h-10 bg-[#EE0033] text-white rounded-lg text-sm font-medium hover:bg-[#CC002B] flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                Lưu và cập nhật
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* VIEW COMMITMENT MODAL */}
      {showViewModal && selectedCommitment && (
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Xem cam kết</DialogTitle>
              <DialogDescription>{selectedCommitment.id}</DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Commitment Letter Display */}
              <div className="bg-white border-2 border-[#E5E7EB] rounded-lg p-8 space-y-6">
                {/* Header */}
                <div className="text-center border-b-2 border-[#E5E7EB] pb-6">
                  <div className="text-xs text-[#6B7280] uppercase tracking-wide mb-2">Công ty Cổ phần Viettel VTK</div>
                  <h2 className="text-xl font-bold text-[#EE0033] uppercase">Cam kết bổ sung hồ sơ</h2>
                  <div className="text-sm text-[#6B7280] mt-2">Số: {selectedCommitment.id}</div>
                </div>

                {/* Content */}
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <User size={18} className="text-[#6B7280] mt-0.5" />
                    <div>
                      <div className="text-[#6B7280] text-xs mb-1">Người cam kết</div>
                      <div className="text-[#111827] font-semibold">{selectedCommitment.person}</div>
                      <div className="text-[#6B7280] text-xs mt-0.5">{selectedCommitment.department}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText size={18} className="text-[#6B7280] mt-0.5" />
                    <div>
                      <div className="text-[#6B7280] text-xs mb-1">Liên quan đến đề nghị</div>
                      <div className="text-[#EE0033] font-semibold">{selectedCommitment.requestId}</div>
                      <div className="text-[#374151] mt-0.5">{selectedCommitment.customer}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar size={18} className="text-[#6B7280] mt-0.5" />
                    <div>
                      <div className="text-[#6B7280] text-xs mb-1">Hạn bổ sung</div>
                      <div className="text-[#111827] font-semibold">{selectedCommitment.deadline}</div>
                    </div>
                  </div>

                  <div className="bg-[#F9FAFB] rounded-lg p-4 mt-4">
                    <div className="text-xs font-semibold text-[#374151] mb-2 uppercase">Nội dung cam kết</div>
                    <p className="text-sm text-[#374151] leading-relaxed">
                      Tôi cam kết sẽ bổ sung đầy đủ các hồ sơ pháp lý còn thiếu cho đề nghị xuất hoá đơn số {selectedCommitment.requestId} trước ngày <span className="font-semibold">{selectedCommitment.deadline}</span>. 
                      Tôi hiểu rằng việc không hoàn thành cam kết này sẽ ảnh hưởng đến tiến độ xuất hoá đơn và các quy trình liên quan.
                    </p>
                  </div>

                  <div className="bg-[#FEF2F2] rounded-lg p-4">
                    <div className="text-xs font-semibold text-[#991B1B] mb-2 uppercase">Hồ sơ cần bổ sung</div>
                    <ul className="space-y-1.5">
                      {selectedCommitment.missingDocs.map((doc: string, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-[#374151]">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></div>
                          {doc}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Signature Section - AUTO FROM ACCOUNT */}
                  <div className="pt-6 border-t border-[#E5E7EB]">
                    <div className="text-xs font-semibold text-[#374151] mb-3 uppercase">Chữ ký xác nhận</div>
                    <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
                      <div className="flex gap-4">
                        {/* Signature Image */}
                        <div className="w-[200px] h-[60px] bg-white border border-[#D1D5DB] rounded flex items-center justify-center flex-shrink-0">
                          <div className="text-[#374151] font-serif italic text-base">{selectedCommitment.person}</div>
                        </div>

                        {/* Signer Info */}
                        <div className="flex-1 space-y-1">
                          <div className="text-sm font-medium text-[#374151]">{selectedCommitment.person}</div>
                          <div className="text-xs text-[#6B7280]">Chuyên viên — {selectedCommitment.department}</div>
                          <div className="text-xs text-[#9CA3AF]">Ký lúc: {selectedCommitment.commitmentDate} 10:15:42</div>
                          <div className="flex items-center gap-1 text-[10px] text-[#9CA3AF] mt-2">
                            <Lock size={10} />
                            <span>Chữ ký lấy từ tài khoản tại thời điểm tạo cam kết</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <DialogClose className="flex-1 h-10 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F3F4F6]">
                Đóng
              </DialogClose>
              <Button className="flex-1 h-10 bg-[#EE0033] text-white rounded-lg text-sm font-medium hover:bg-[#CC002B] flex items-center justify-center gap-2">
                <FileText size={16} />
                Tải xuất PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}