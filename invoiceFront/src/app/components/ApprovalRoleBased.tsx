import { useState, Fragment } from 'react';
import { 
  ChevronLeft, CheckCircle, X, AlertTriangle, FileText, User, 
  Check, ArrowLeft, Eye, XCircle, RotateCcw, Calendar, Clock,
  FileCheck, Building2, DollarSign, Send, ShieldCheck, Lock, ChevronDown, ChevronUp
} from 'lucide-react';
import { getInvoiceStatusBadge, getLegalStatusIcon } from './StatusBadges';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { Button } from './ui/button';
import { useMasterInvoiceData } from '../data/masterInvoiceData';
import {
  useApproveInvoiceRequest,
  useRejectInvoiceRequest,
  useReturnInvoiceRequest,
  useSignature,
} from '../../lib/api/queries';
import { ApiError } from '../../lib/api/errors';

interface ApprovalRoleBasedProps {
  userRole: 'employee' | 'manager' | 'accountant' | 'director' | 'admin';
}

export default function ApprovalRoleBased({ userRole }: ApprovalRoleBasedProps) {
  const { MASTER_INVOICE_DATA } = useMasterInvoiceData();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'overview'>('pending');
  const [view, setView] = useState<'queue' | 'detail'>('queue');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [hasSignature] = useState(true); // legacy fallback; replaced below by real signature check
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionTargetId, setActionTargetId] = useState<string | number>('');
  const [showCommitmentApproveModal, setShowCommitmentApproveModal] = useState(false);
  const [commitmentAcknowledged, setCommitmentAcknowledged] = useState(false);
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const [showLegalDetailModal, setShowLegalDetailModal] = useState(false);
  const [legalDetailTargetId, setLegalDetailTargetId] = useState<string | number>('');

  // --- Real backend mutations ---
  const approveMut = useApproveInvoiceRequest();
  const rejectMut = useRejectInvoiceRequest();
  const returnMut = useReturnInvoiceRequest();
  const { data: sig } = useSignature();
  const hasRealSignature = !!(sig as any)?.signature_image_url || !!(sig as any)?.has_signature;
  const isSignatureReady = hasRealSignature || hasSignature;

  const [returnReason, setReturnReason] = useState('');
  const [approveComment] = useState<string | undefined>(undefined);
  const [actionError, setActionError] = useState<string | null>(null);
  const isActing = approveMut.isPending || rejectMut.isPending || returnMut.isPending;

  function handleApiActionError(e: unknown) {
    if (e instanceof ApiError) {
      if (e.isSignatureRequired()) {
        setActionError('Cần thiết lập chữ ký điện tử trước khi duyệt.');
        return;
      }
      if (e.isConflict()) {
        setActionError(e.message || 'Trạng thái đề nghị không cho phép thao tác này.');
        return;
      }
      setActionError(e.message);
      return;
    }
    setActionError('Có lỗi xảy ra. Vui lòng thử lại.');
  }

  async function doApprove() {
    if (!actionTargetId) return;
    setActionError(null);
    try {
      await approveMut.mutateAsync({ id: actionTargetId, payload: { comment: approveComment } });
      setShowApproveModal(false);
    } catch (e) {
      handleApiActionError(e);
    }
  }

  async function doReturn() {
    if (!actionTargetId) return;
    if (!returnReason.trim()) {
      setActionError('Vui lòng nhập lý do trả lại.');
      return;
    }
    setActionError(null);
    try {
      await returnMut.mutateAsync({ id: actionTargetId, payload: { reason: returnReason.trim() } });
      setShowRejectModal(false);
      setReturnReason('');
    } catch (e) {
      handleApiActionError(e);
    }
  }

  async function doApproveWithCommitment() {
    if (!actionTargetId) return;
    setActionError(null);
    try {
      await approveMut.mutateAsync({
        id: actionTargetId,
        payload: { comment: 'Duyệt với cam kết bổ sung hồ sơ pháp lý' },
      });
      setShowCommitmentApproveModal(false);
      setCommitmentAcknowledged(false);
      setRiskAcknowledged(false);
    } catch (e) {
      handleApiActionError(e);
    }
  }

  // === LEGAL CHECKLIST TEMPLATE (11 items, 4 groups) ===
  const LEGAL_GROUPS = [
    {
      name: 'Hồ sơ Hợp đồng',
      items: [
        { id: 'L1', name: 'Hợp đồng đã ký (bản scan)' },
        { id: 'L2', name: 'Phụ lục hợp đồng (nếu có)' },
        { id: 'L3', name: 'Biên bản đàm phán giá' },
      ]
    },
    {
      name: 'Hồ sơ Nghiệm thu',
      items: [
        { id: 'L4', name: 'Biên bản nghiệm thu khối lượng' },
        { id: 'L5', name: 'Biên bản nghiệm thu hoàn thành' },
        { id: 'L6', name: 'Bảng tổng hợp khối lượng nghiệm thu' },
      ]
    },
    {
      name: 'Hồ sơ Quyết toán',
      items: [
        { id: 'L7', name: 'Biên bản quyết toán' },
        { id: 'L8', name: 'Bảng tính giá trị quyết toán' },
        { id: 'L9', name: 'Xác nhận công nợ' },
      ]
    },
    {
      name: 'Hồ sơ Thanh toán & Bảo lãnh',
      items: [
        { id: 'L10', name: 'Đề nghị thanh toán' },
        { id: 'L11', name: 'Bảo lãnh thực hiện HĐ / Bảo lãnh bảo hành' },
      ]
    }
  ];

  // Helper: all 11 items complete
  const ALL_COMPLETE: Record<string,string> = { L1:'complete',L2:'complete',L3:'complete',L4:'complete',L5:'complete',L6:'complete',L7:'complete',L8:'complete',L9:'complete',L10:'complete',L11:'complete' };

  // Sample approval queue data
  const allApprovalRequests = [
    // Normal approvals — some with missing legal docs for KT to review
    { id: 'DN-2026-00156', type: 'normal', customer: 'Tập đoàn VNPT', amount: '2.695.000.000', serviceType: 'Tích hợp hệ thống', creator: 'Nguyễn Văn A', revenueStatus: 'Đã xác nhận', date: '13/03/2026 14:30', legal: 'complete', status: 'pending', currentHandler: 'Lê Thị Kế toán', note: '',
      legalDocs: { ...ALL_COMPLETE } },
    { id: 'DN-2026-00155', type: 'normal', customer: 'Viettel Construction JSC', amount: '6.402.000.000', serviceType: 'Tư vấn CNTT', creator: 'Trần Thị B', revenueStatus: 'Đã xác nhận', date: '13/03/2026 10:15', legal: 'missing', status: 'pending', currentHandler: 'Nguyễn Văn KT', note: 'Thiếu HS nghiệm thu',
      legalDocs: { ...ALL_COMPLETE, L5:'missing', L6:'missing' } },
    { id: 'DN-2026-00153', type: 'normal', customer: 'Viettel Telecom', amount: '9.790.000.000', serviceType: 'Bảo trì hệ thống', creator: 'Phạm Thị D', revenueStatus: 'Đã xác nhận', date: '12/03/2026 16:45', legal: 'complete', status: 'approved', currentHandler: 'Trần Thị KT', note: '',
      legalDocs: { ...ALL_COMPLETE } },
    { id: 'DN-2026-00151', type: 'normal', customer: 'Viettel Global Investment', amount: '13.640.000.000', serviceType: 'Phát triển phần mềm', creator: 'Đỗ Thị F', revenueStatus: 'Đã xác nhận', date: '11/03/2026 09:20', legal: 'missing', status: 'pending', currentHandler: 'Lê Thị Kế toán', note: 'Thiếu HS quyết toán',
      legalDocs: { ...ALL_COMPLETE, L7:'missing', L8:'missing', L9:'missing' } },
    { id: 'DN-2026-00149', type: 'normal', customer: 'VNPT Technology', amount: '6.820.000.000', serviceType: 'Dịch vụ Cloud', creator: 'Bùi Thị H', revenueStatus: 'Đã xác nhận', date: '10/03/2026 11:30', legal: 'complete', status: 'approved', currentHandler: 'Nguyễn Văn KT', note: '',
      legalDocs: { ...ALL_COMPLETE } },
    { id: 'DN-2026-00148', type: 'normal', customer: 'Viettel Networks', amount: '3.179.000.000', serviceType: 'Bảo trì hệ thống', creator: 'Nguyễn Văn A', revenueStatus: 'Đã xác nhận', date: '09/03/2026 15:10', legal: 'complete', status: 'pending', currentHandler: 'Lê Thị Kế toán', note: '',
      legalDocs: { ...ALL_COMPLETE } },
    { id: 'DN-2026-00147', type: 'normal', customer: 'Tập đoàn Bưu chính VN', amount: '8.415.000.000', serviceType: 'Tích hợp hệ thống', creator: 'Phan Thị J', revenueStatus: 'Đã xác nhận', date: '09/03/2026 08:45', legal: 'complete', status: 'rejected', currentHandler: 'Trần Thị KT', note: 'Giá trị hợp đồng không khớp',
      legalDocs: { ...ALL_COMPLETE } },
    
    // Special approvals with commitments (for Director)
    { id: 'DN-2026-00154', type: 'special', customer: 'Công ty CP Bưu chính VN', amount: '1.375.000.000', serviceType: 'Dịch vụ Cloud', creator: 'Lê Văn C', revenueStatus: 'Chờ xác nhận', date: '12/03/2026 13:20', legal: 'missing', status: 'pending', currentHandler: 'Nguyễn Giám đốc', note: 'Đã cam kết bổ sung HS',
      legalDocs: { ...ALL_COMPLETE, L4:'missing', L5:'missing' },
      commitment: { deadline: '20/03/2026', content: 'Cam kết bổ sung Biên bản nghiệm thu và Báo cáo kết quả thực hiện trước ngày 20/03/2026', signer: 'Lê Văn C', signedDate: '12/03/2026 13:15' } },
    { id: 'DN-2026-00152', type: 'special', customer: 'VNPT Vinaphone', amount: '3.465.000.000', serviceType: 'Tích hợp hệ thống', creator: 'Hoàng Văn E', revenueStatus: 'Đã xác nhận', date: '11/03/2026 14:50', legal: 'overdue', status: 'pending', currentHandler: 'Nguyễn Giám đốc', note: 'Có HS quá hạn, đã cam kết',
      legalDocs: { ...ALL_COMPLETE, L5:'overdue', L9:'overdue' },
      commitment: { deadline: '18/03/2026', content: 'Cam kết bổ sung Báo cáo kết quả thực hiện (đã quá hạn 5 ngày) và Xác nhận công nợ trước ngày 18/03/2026', signer: 'Hoàng Văn E', signedDate: '11/03/2026 14:45' } },
    { id: 'DN-2026-00150', type: 'special', customer: 'Viettel High Tech', amount: '5.225.000.000', serviceType: 'Tư vấn CNTT', creator: 'Vũ Văn G', revenueStatus: 'Chưa xác nhận', date: '10/03/2026 10:30', legal: 'missing', status: 'approved', currentHandler: 'Nguyễn Giám đốc', note: 'Đã duyệt với cam kết',
      legalDocs: { ...ALL_COMPLETE, L3:'missing', L10:'missing', L11:'missing' },
      commitment: { deadline: '25/03/2026', content: 'Cam kết bổ sung Biên bản thỏa thuận giá, Chứng từ thanh toán, và Xác nhận thanh toán trước ngày 25/03/2026', signer: 'Vũ Văn G', signedDate: '10/03/2026 10:25' } },

    // Personal employee data (Nguyễn Văn A)
    { id: 'DN-2026-00145', type: 'normal', customer: 'VNPT Hà Nội', amount: '4.752.000.000', serviceType: 'Dịch vụ Cloud', creator: 'Nguyễn Văn A', revenueStatus: 'Đã xác nhận', date: '08/03/2026 10:20', legal: 'complete', status: 'approved', currentHandler: 'Lê Thị Kế toán', note: '',
      legalDocs: { ...ALL_COMPLETE } },
    { id: 'DN-2026-00138', type: 'normal', customer: 'Công ty TNHH ABC', amount: '3.520.000.000', serviceType: 'Tích hợp hệ thống', creator: 'Nguyễn Văn A', revenueStatus: 'Đã xác nhận', date: '05/03/2026 09:15', legal: 'complete', status: 'approved', currentHandler: 'Nguyễn Văn KT', note: '',
      legalDocs: { ...ALL_COMPLETE } },
    { id: 'DN-2026-00135', type: 'normal', customer: 'VNPT Digital', amount: '4.510.000.000', serviceType: 'Tư vấn CNTT', creator: 'Nguyễn Văn A', revenueStatus: 'Đã xác nhận', date: '03/03/2026 14:30', legal: 'complete', status: 'pending', currentHandler: 'Lê Thị Kế toán', note: '',
      legalDocs: { ...ALL_COMPLETE } },
  ];

  // Helper to count missing/overdue docs
  const getLegalDocStats = (legalDocs: Record<string, string>) => {
    const total = Object.keys(legalDocs).length;
    const complete = Object.values(legalDocs).filter(s => s === 'complete').length;
    const missing = Object.values(legalDocs).filter(s => s === 'missing').length;
    const overdue = Object.values(legalDocs).filter(s => s === 'overdue').length;
    return { total, complete, missing, overdue };
  };

  // Filter data based on role
  const getFilteredRequests = () => {
    if (userRole === 'employee') {
      // Employee: Only their own requests in approval pipeline
      return allApprovalRequests.filter(r => r.creator === 'Nguyễn Văn A' && r.status !== 'draft');
    } else if (userRole === 'manager') {
      // Manager: Department tracking view - all requests from KV3 in approval pipeline
      return MASTER_INVOICE_DATA
        .filter(r => 
          r.revenueCenter === 'KV3' && 
          ['pending', 'pending-vpgd', 'approved', 'rejected'].includes(r.status)
        )
        .map(r => ({
          id: r.requestCode,
          type: r.commitment ? 'special' : 'normal',
          customer: r.customer,
          amount: r.afterVAT.toLocaleString('vi-VN'),
          serviceType: r.serviceType,
          creator: r.creator,
          revenueStatus: r.status === 'approved' ? 'Đã xác nhận' : 'Chờ xác nhận',
          date: r.createdDate,
          legal: r.legalStatus.status === 'complete' ? 'complete' : r.legalStatus.status === 'overdue' ? 'overdue' : 'missing',
          status: r.status === 'pending-vpgd' ? 'pending' : r.status,
          currentHandler: r.status === 'pending' ? 'Lê Thị Kế toán' : r.status === 'pending-vpgd' ? 'Nguyễn Giám đốc' : r.status === 'approved' ? 'Đã duyệt' : 'Từ chối',
          note: r.commitment ? 'Có cam kết bổ sung' : r.legalStatus.status === 'insufficient' ? 'Thiếu hồ sơ pháp lý' : '',
          legalDocs: { ...ALL_COMPLETE },
          commitment: r.commitment ? {
            deadline: r.commitment.deadline,
            content: r.commitment.content,
            signer: r.commitment.createdBy,
            signedDate: r.commitment.createdDate
          } : undefined
        }));
    } else if (userRole === 'accountant') {
      // Accountant: Only normal approvals
      return allApprovalRequests.filter(r => r.type === 'normal');
    } else if (userRole === 'director') {
      // Director: Only special approvals
      return allApprovalRequests.filter(r => r.type === 'special');
    }
    return allApprovalRequests;
  };

  const filteredRequests = getFilteredRequests();

  // Further filter by tab
  const getTabRequests = () => {
    if (activeTab === 'overview') {
      return filteredRequests;
    }
    return filteredRequests.filter(r => r.status === activeTab);
  };

  const displayRequests = getTabRequests();

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  // Get page title and description based on role
  const getPageContent = () => {
    if (userRole === 'employee') {
      return {
        title: 'Theo dõi trạng thái phê duyệt',
        description: 'Theo dõi tiến độ phê duyệt các đề nghị của bạn'
      };
    } else if (userRole === 'manager') {
      return {
        title: 'Theo dõi phê duyệt — TT Khu vực 3',
        description: 'Theo dõi tiến độ phê duyệt các đề nghị của phòng ban'
      };
    } else if (userRole === 'accountant') {
      return {
        title: 'Phê duyệt đề nghị xuất Hoá đơn',
        description: 'Xử lý các đề nghị xuất hoá đơn (thường và đặc biệt)'
      };
    } else if (userRole === 'director') {
      return {
        title: 'Phê duyệt đề nghị đặc biệt',
        description: 'Xử lý các đề nghị có cam kết bổ sung hồ sơ pháp lý'
      };
    }
    return {
      title: 'Phê duyệt đề nghị xuất Hoá đơn',
      description: 'Quản lý và xử lý tất cả các đề nghị (Admin)'
    };
  };

  const pageContent = getPageContent();

  // Approval Timeline Component
  const ApprovalTimeline = ({ requestId }: { requestId: string }) => {
    const timeline = [
      { step: 1, label: 'Gửi đề nghị', user: 'Nguyễn Văn A', date: '13/03/2026 14:30', status: 'completed' },
      { step: 2, label: 'Kế toán duyệt', user: 'Lê Thị Kế toán', date: '13/03/2026 15:45', status: 'completed' },
      { step: 3, label: 'Chuyển S-Invoice', user: 'Hệ thống', date: '13/03/2026 15:50', status: 'current' },
      { step: 4, label: 'Xuất hoá đơn', user: '', date: '', status: 'pending' }
    ];

    return (
      <div className="bg-[#F9FAFB] p-4 rounded-lg">
        <h4 className="text-sm font-medium text-[#374151] mb-3">Tiến độ phê duyệt</h4>
        <div className="space-y-3">
          {timeline.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="flex flex-col items-center flex-shrink-0">
                {item.status === 'completed' ? (
                  <div className="w-6 h-6 rounded-full bg-[#16A34A] flex items-center justify-center">
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </div>
                ) : item.status === 'current' ? (
                  <div className="w-6 h-6 rounded-full bg-[#F59E0B] flex items-center justify-center">
                    <Clock size={14} className="text-white" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#E5E7EB] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#9CA3AF]"></div>
                  </div>
                )}
                {idx < timeline.length - 1 && (
                  <div className={`w-0.5 h-8 ${item.status === 'completed' ? 'bg-[#16A34A]' : 'bg-[#E5E7EB]'}`}></div>
                )}
              </div>
              <div className="flex-1 pt-0.5">
                <div className="text-sm font-medium text-[#111827]">{item.label}</div>
                {item.user && (
                  <div className="text-xs text-[#6B7280] mt-0.5">{item.user}</div>
                )}
                {item.date && (
                  <div className="text-xs text-[#9CA3AF] mt-0.5">{item.date}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // EMPLOYEE VIEW - Tracking only
  if (userRole === 'employee') {
    return (
      <div className="space-y-4">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">{pageContent.title}</h1>
          <p className="text-sm text-[#6B7280] mt-1">{pageContent.description}</p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
            <div className="text-xs font-medium text-[#6B7280] uppercase mb-1">Chờ duyệt</div>
            <div className="text-2xl font-semibold text-[#F59E0B]">
              {filteredRequests.filter(r => r.status === 'pending').length}
            </div>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
            <div className="text-xs font-medium text-[#6B7280] uppercase mb-1">Đã duyệt</div>
            <div className="text-2xl font-semibold text-[#16A34A]">
              {filteredRequests.filter(r => r.status === 'approved').length}
            </div>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
            <div className="text-xs font-medium text-[#6B7280] uppercase mb-1">Từ chối</div>
            <div className="text-2xl font-semibold text-[#DC2626]">
              {filteredRequests.filter(r => r.status === 'rejected').length}
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-[#F3F4F6] border-b border-[#E5E7EB]">
                  <th className="w-10 px-4 py-3"></th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Mã đề nghị</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Khách hàng</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Giá trị</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Ngày gửi</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Người đang xử lý</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {displayRequests.map((request) => (
                  <Fragment key={request.id}>
                    <tr className="border-b border-[#E5E7EB] hover:bg-[#FFF1F3] transition-colors">
                      <td className="px-4 py-4">
                        <button 
                          onClick={() => toggleRow(request.id)}
                          className="p-1 hover:bg-[#F3F4F6] rounded"
                        >
                          {expandedRows.includes(request.id) ? (
                            <ChevronUp size={16} className="text-[#6B7280]" />
                          ) : (
                            <ChevronDown size={16} className="text-[#6B7280]" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-[#EE0033]">{request.id}</td>
                      <td className="px-4 py-4 text-sm text-[#374151]">{request.customer}</td>
                      <td className="px-4 py-4 text-sm text-[#374151] text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {request.amount} đ
                      </td>
                      <td className="px-4 py-4 text-sm text-[#6B7280]">{request.date}</td>
                      <td className="px-4 py-4">{getInvoiceStatusBadge(request.status)}</td>
                      <td className="px-4 py-4 text-sm text-[#6B7280]">{request.currentHandler}</td>
                      <td className="px-4 py-4 text-sm text-[#6B7280]">{request.note || '—'}</td>
                    </tr>
                    {expandedRows.includes(request.id) && (
                      <tr>
                        <td colSpan={8} className="px-4 py-4 bg-[#FAFBFC]">
                          <ApprovalTimeline requestId={request.id} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // MANAGER VIEW - Department Tracking (read-only)
  if (userRole === 'manager') {
    const currentMonth = new Date().getMonth() + 1;
    const approvedThisMonth = filteredRequests.filter(r => r.status === 'approved' && r.date.includes('/03/2026')).length;
    
    return (
      <div className="space-y-4">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">{pageContent.title}</h1>
          <p className="text-sm text-[#6B7280] mt-1">{pageContent.description}</p>
        </div>

        {/* DEPARTMENT SUMMARY STATS */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 size={20} className="text-[#C2410C]" />
              <h3 className="text-sm font-semibold text-[#111827]">Tổng quan phòng ban</h3>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-lg p-4">
              <div className="text-xs font-medium text-[#92400E] uppercase mb-1">Đang chờ duyệt</div>
              <div className="text-2xl font-semibold text-[#F59E0B]">
                {filteredRequests.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-xs text-[#78350F] mt-1">Đề nghị của phòng ban</div>
            </div>
            <div className="bg-[#D1FAE5] border border-[#16A34A] rounded-lg p-4">
              <div className="text-xs font-medium text-[#065F46] uppercase mb-1">Đã duyệt tháng này</div>
              <div className="text-2xl font-semibold text-[#16A34A]">
                {approvedThisMonth}
              </div>
              <div className="text-xs text-[#047857] mt-1">Tháng 3/2026</div>
            </div>
            <div className="bg-[#FEE2E2] border border-[#DC2626] rounded-lg p-4">
              <div className="text-xs font-medium text-[#991B1B] uppercase mb-1">Bị từ chối</div>
              <div className="text-2xl font-semibold text-[#DC2626]">
                {filteredRequests.filter(r => r.status === 'rejected').length}
              </div>
              <div className="text-xs text-[#7F1D1D] mt-1">Cần xử lý lại</div>
            </div>
          </div>
        </div>

        {/* TABLE - Manager tracking view with creator column */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-[#F3F4F6] border-b border-[#E5E7EB]">
                  <th className="w-10 px-4 py-3"></th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Mã ĐN</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Người tạo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Khách hàng</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Giá trị</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Ngày gửi</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Người đang xử lý</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Pháp lý</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-[#6B7280]">
                      Không có đề nghị nào trong hệ thống phê duyệt
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <Fragment key={request.id}>
                      <tr className="border-b border-[#E5E7EB] hover:bg-[#FEF3C7] transition-colors">
                        <td className="px-4 py-4">
                          <button 
                            onClick={() => toggleRow(request.id)}
                            className="p-1 hover:bg-[#F3F4F6] rounded"
                          >
                            {expandedRows.includes(request.id) ? (
                              <ChevronUp size={16} className="text-[#6B7280]" />
                            ) : (
                              <ChevronDown size={16} className="text-[#6B7280]" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-[#EE0033]">{request.id}</td>
                        <td className="px-4 py-4 text-sm text-[#374151] font-medium">{request.creator}</td>
                        <td className="px-4 py-4 text-sm text-[#374151]">{request.customer}</td>
                        <td className="px-4 py-4 text-sm text-[#374151] text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {request.amount} đ
                        </td>
                        <td className="px-4 py-4 text-sm text-[#6B7280]">{request.date}</td>
                        <td className="px-4 py-4">{getInvoiceStatusBadge(request.status)}</td>
                        <td className="px-4 py-4 text-sm text-[#6B7280]">{request.currentHandler}</td>
                        <td className="px-4 py-4">{getLegalStatusIcon(request.legal)}</td>
                      </tr>
                      {expandedRows.includes(request.id) && (
                        <tr>
                          <td colSpan={9} className="px-4 py-4 bg-[#FAFBFC]">
                            <ApprovalTimeline requestId={request.id} />
                            {request.commitment && (
                              <div className="mt-4 bg-[#FEF3C7] border border-[#F59E0B] rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <AlertTriangle size={16} className="text-[#F59E0B] mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <div className="text-sm font-semibold text-[#92400E] mb-1">
                                      Cam kết bổ sung hồ sơ pháp lý
                                    </div>
                                    <div className="text-sm text-[#78350F] mb-2">
                                      Hạn: {request.commitment.deadline} — Người cam kết: {request.commitment.signer}
                                    </div>
                                    <div className="text-xs text-[#92400E] bg-[#FFFBEB] border border-[#FDE68A] rounded p-2">
                                      {request.commitment.content}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info note */}
        <div className="bg-[#F0F9FF] border border-[#93C5FD] rounded-lg p-4 flex items-start gap-3">
          <Eye size={16} className="text-[#1D4ED8] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#1E40AF]">
            <strong>Lưu ý:</strong> Bạn chỉ có thể theo dõi trạng thái phê duyệt của các đề nghị trong phòng ban. 
            Quyền phê duyệt thuộc về Kế toán và Giám đốc.
          </div>
        </div>
      </div>
    );
  }

  // ACCOUNTANT / DIRECTOR VIEW - Approval Queue
  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">{pageContent.title}</h1>
        <p className="text-sm text-[#6B7280] mt-1">{pageContent.description}</p>
      </div>

      {/* TABS */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex overflow-x-auto md:overflow-visible whitespace-nowrap border-b border-[#E5E7EB]">
          {userRole === 'director' && (
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 h-12 text-xs md:text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-[#EE0033] text-[#EE0033] bg-[#FFF1F3]'
                  : 'border-transparent text-[#6B7280] hover:text-[#374151] hover:bg-[#F9FAFB]'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileCheck size={16} />
                <span>Tổng quan duyệt</span>
              </div>
            </button>
          )}
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 h-12 text-xs md:text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-[#EE0033] text-[#EE0033] bg-[#FFF1F3]'
                : 'border-transparent text-[#6B7280] hover:text-[#374151] hover:bg-[#F9FAFB]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock size={16} />
              <span>Chờ phê duyệt</span>
              <span className="px-2 py-0.5 rounded-full bg-[#F59E0B] text-white text-[10px] md:text-xs font-semibold">
                {filteredRequests.filter(r => r.status === 'pending').length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`flex-1 h-12 text-xs md:text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'approved'
                ? 'border-[#EE0033] text-[#EE0033] bg-[#FFF1F3]'
                : 'border-transparent text-[#6B7280] hover:text-[#374151] hover:bg-[#F9FAFB]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle size={16} />
              <span>Đã duyệt</span>
              <span className="text-[10px] md:text-xs text-[#6B7280]">({filteredRequests.filter(r => r.status === 'approved').length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex-1 h-12 text-xs md:text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'rejected'
                ? 'border-[#EE0033] text-[#EE0033] bg-[#FFF1F3]'
                : 'border-transparent text-[#6B7280] hover:text-[#374151] hover:bg-[#F9FAFB]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <XCircle size={16} />
              <span>Từ chối</span>
              <span className="text-[10px] md:text-xs text-[#6B7280]">({filteredRequests.filter(r => r.status === 'rejected').length})</span>
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Signature Warning */}
          {!hasSignature && activeTab === 'pending' && (
            <div className="bg-[#FFFBEB] border border-[#F59E0B] rounded-lg p-4 flex items-start gap-3 mb-4">
              <AlertTriangle size={20} className="text-[#F59E0B] flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-[#92400E] mb-1">
                  Bạn chưa thiết lập chữ ký số
                </div>
                <div className="text-sm text-[#78350F] mb-3">
                  Chữ ký số được yêu cầu để phê duyệt đề nghị. Vui lòng thiết lập ngay.
                </div>
                <button className="h-9 px-4 bg-[#F59E0B] text-white text-sm font-medium rounded-lg hover:bg-[#D97706]">
                  Thiết lập chữ ký ngay
                </button>
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#F9FAFB] rounded-lg p-4">
              <div className="text-xs font-medium text-[#6B7280] uppercase mb-1">Tổng đề nghị</div>
              <div className="text-xl font-semibold text-[#111827]">{displayRequests.length}</div>
            </div>
            <div className="bg-[#F9FAFB] rounded-lg p-4">
              <div className="text-xs font-medium text-[#6B7280] uppercase mb-1">Tổng giá trị</div>
              <div className="text-xl font-semibold text-[#111827]">
                {(displayRequests.reduce((sum, r) => sum + parseFloat(r.amount.replace(/\./g, '')), 0) / 1000000000).toFixed(1)}B ₫
              </div>
            </div>
            <div className="bg-[#F9FAFB] rounded-lg p-4">
              <div className="text-xs font-medium text-[#6B7280] uppercase mb-1">HS đầy đủ</div>
              <div className="text-xl font-semibold text-[#16A34A]">
                {displayRequests.filter(r => r.legal === 'complete').length}
              </div>
            </div>
            <div className="bg-[#F9FAFB] rounded-lg p-4">
              <div className="text-xs font-medium text-[#6B7280] uppercase mb-1">HS thiếu/quá hạn</div>
              <div className="text-xl font-semibold text-[#DC2626]">
                {displayRequests.filter(r => r.legal !== 'complete').length}
              </div>
            </div>
          </div>

          {/* Requests Table */}
          <div className="border border-[#E5E7EB] rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-[#F3F4F6] border-b border-[#E5E7EB]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Mã đề nghị</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Khách hàng</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Loại DV</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Giá trị</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Người tạo</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Pháp lý</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Ngày gửi</th>
                  {activeTab === 'pending' && (
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase w-32">Thao tác</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {displayRequests.map((request) => {
                  const isLegalIssue = request.legal !== 'complete';
                  const isOverdue = request.legal === 'overdue';
                  const stats = getLegalDocStats(request.legalDocs);
                  const rowBg = isOverdue
                    ? 'bg-[#FEF2F2] border-l-4 border-l-[#DC2626]'
                    : isLegalIssue
                    ? 'bg-[#FFFBEB] border-l-4 border-l-[#F59E0B]'
                    : '';
                  const rowHover = isOverdue
                    ? 'hover:bg-[#FEE2E2]'
                    : isLegalIssue
                    ? 'hover:bg-[#FEF3C7]'
                    : 'hover:bg-[#FFF1F3]';
                  return (
                  <tr key={request.id} className={`border-b border-[#E5E7EB] transition-colors ${rowBg} ${rowHover}`}>
                    <td className="px-4 py-4 text-sm font-medium text-[#EE0033]">{request.id}</td>
                    <td className="px-4 py-4 text-sm text-[#374151]">{request.customer}</td>
                    <td className="px-4 py-4 text-sm text-[#6B7280]">{request.serviceType}</td>
                    <td className="px-4 py-4 text-sm text-[#374151] text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {request.amount} đ
                    </td>
                    <td className="px-4 py-4 text-sm text-[#6B7280]">{request.creator}</td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => {
                          setLegalDetailTargetId(request.id);
                          setShowLegalDetailModal(true);
                        }}
                        className={`flex items-center justify-center gap-1.5 mx-auto px-2 py-1 rounded-md transition-colors ${
                          isLegalIssue
                            ? 'hover:bg-white/70 cursor-pointer'
                            : 'hover:bg-[#F3F4F6] cursor-pointer'
                        }`}
                        title="Xem chi tiết hồ sơ pháp lý"
                      >
                        {getLegalStatusIcon(request.legal)}
                        <span className={`text-[10px] font-medium ${
                          isOverdue ? 'text-[#DC2626]' : isLegalIssue ? 'text-[#D97706]' : 'text-[#6B7280]'
                        }`}>
                          {stats.complete}/{stats.total}
                        </span>
                        <Eye size={10} className="text-[#9CA3AF]" />
                      </button>
                    </td>
                    <td className="px-4 py-4 text-sm text-[#6B7280]">{request.date}</td>
                    {activeTab === 'pending' && (
                      <td className="px-4 py-4">
                        <div className="flex gap-2 justify-center">
                          {/* APPROVE BUTTON - varies by legal status */}
                          {request.legal === 'complete' ? (
                            /* HS đầy đủ → Duyệt bình thường (xanh) */
                            <button 
                              disabled={!hasSignature}
                              className="h-8 px-3 bg-[#16A34A] text-white text-xs font-medium rounded-lg hover:bg-[#15803D] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                              onClick={() => {
                                setActionTargetId(request.id);
                                setShowApproveModal(true);
                              }}
                            >
                              <Check size={12} />
                              Duyệt
                            </button>
                          ) : (request as any).commitment ? (
                            /* HS thiếu/quá hạn + CÓ cam kết → "Duyệt có CK" (amber) */
                            <button 
                              disabled={!hasSignature}
                              className="h-8 px-3 bg-[#D97706] text-white text-xs font-medium rounded-lg hover:bg-[#B45309] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                              onClick={() => {
                                setActionTargetId(request.id);
                                setCommitmentAcknowledged(false);
                                setRiskAcknowledged(false);
                                setShowCommitmentApproveModal(true);
                              }}
                            >
                              <AlertTriangle size={12} />
                              Duyệt có CK
                            </button>
                          ) : (
                            /* HS thiếu/quá hạn + KHÔNG cam kết → Disabled */
                            <div className="relative group">
                              <button 
                                disabled
                                className="h-8 px-3 bg-[#E5E7EB] text-[#9CA3AF] text-xs font-medium rounded-lg cursor-not-allowed flex items-center gap-1.5"
                              >
                                <Lock size={12} />
                                Duyệt
                              </button>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#1F2937] text-white text-[10px] rounded-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 text-center">
                                Thiếu hồ sơ pháp lý. Cần có cam kết bổ sung trước khi duyệt.
                              </div>
                            </div>
                          )}
                          <button 
                            className="h-8 px-3 bg-white text-[#DC2626] border border-[#DC2626] text-xs font-medium rounded-lg hover:bg-[#FEE2E2] flex items-center gap-1.5"
                            onClick={() => {
                              setActionTargetId(request.id);
                              setShowRejectModal(true);
                            }}
                          >
                            <X size={12} />
                            Trả lại
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {displayRequests.length === 0 && (
            <div className="text-center py-12">
              <FileText size={48} className="text-[#D1D5DB] mx-auto mb-3" />
              <p className="text-sm text-[#6B7280]">Không có đề nghị nào trong trạng thái này</p>
            </div>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent className="md:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6 text-green-600" />
            </div>
            <DialogTitle className="text-center">Xác nhận phê duyệt</DialogTitle>
            <DialogDescription className="text-center">
              Đề nghị xuất hoá đơn mã {actionTargetId}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-700">
              Tôi xác nhận đã soát xét đầy đủ hồ sơ đề nghị xuất hoá đơn và đồng ý phê duyệt.
            </p>

            {/* Signature auto-preview from account */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row gap-3">
              <div className="w-40 h-12 bg-white border border-gray-200 rounded flex items-center justify-center text-xs text-gray-400 italic">
                [Chữ ký từ tài khoản]
              </div>
              <div className="flex-1 space-y-0.5">
                <p className="text-sm font-medium">Trần Thị B</p>
                <p className="text-xs text-gray-500">Kế toán thanh toán — P. Tài chính</p>
                <p className="text-xs text-gray-400">14/03/2026 15:42:30</p>
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Chữ ký lấy từ tài khoản cá nhân
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Huỷ</Button>
            </DialogClose>
            <Button
              className="bg-[#EE0033] hover:bg-[#CC002B] text-white disabled:opacity-50"
              disabled={isActing}
              onClick={doApprove}
            >
              {approveMut.isPending ? 'Đang duyệt...' : 'Xác nhận duyệt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="md:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Từ chối đề nghị</DialogTitle>
            <DialogDescription className="text-center">
              Đề nghị xuất hoá đơn mã {actionTargetId}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Lý do từ chối / trả lại *</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm min-h-[100px] focus:ring-2 focus:ring-[#EE0033] focus:border-[#EE0033] outline-none"
                placeholder="Nhập lý do..."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
              />
              {actionError && (
                <div className="mt-2 text-xs text-[#DC2626]">{actionError}</div>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Huỷ</Button>
            </DialogClose>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              disabled={isActing || !returnReason.trim()}
              onClick={doReturn}
            >
              {returnMut.isPending ? 'Đang trả lại...' : 'Xác nhận trả lại'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Commitment Approve Modal */}
      <Dialog open={showCommitmentApproveModal} onOpenChange={(open) => {
        setShowCommitmentApproveModal(open);
        if (!open) { setCommitmentAcknowledged(false); setRiskAcknowledged(false); }
      }}>
        <DialogContent className="md:max-w-[560px]">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 text-[#D97706]" />
            </div>
            <DialogTitle className="text-center">Duyệt đề nghị có cam kết bổ sung</DialogTitle>
            <DialogDescription className="text-center">
              Đề nghị <span className="font-semibold text-[#EE0033]">{actionTargetId}</span> — Hồ sơ pháp lý chưa đầy đủ
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
            {/* Legal Status Warning Banner */}
            {(() => {
              const targetReq = allApprovalRequests.find(r => r.id === actionTargetId);
              const isOverdue = targetReq?.legal === 'overdue';
              return (
                <div className={`rounded-lg p-3 flex items-start gap-2.5 ${isOverdue ? 'bg-[#FEE2E2] border border-[#FCA5A5]' : 'bg-[#FEF3C7] border border-[#FCD34D]'}`}>
                  <AlertTriangle size={16} className={`flex-shrink-0 mt-0.5 ${isOverdue ? 'text-[#DC2626]' : 'text-[#D97706]'}`} />
                  <div>
                    <div className={`text-sm font-semibold ${isOverdue ? 'text-[#991B1B]' : 'text-[#92400E]'}`}>
                      {isOverdue ? 'Hồ sơ pháp lý QUÁ HẠN' : 'Hồ sơ pháp lý THIẾU'}
                    </div>
                    <div className={`text-xs mt-0.5 ${isOverdue ? 'text-[#991B1B]' : 'text-[#78350F]'}`}>
                      {isOverdue
                        ? 'Đề nghị này có hồ sơ pháp lý đã quá hạn bổ sung. Việc duyệt sẽ chịu rủi ro pháp lý cao.'
                        : 'Đề nghị này chưa đủ hồ sơ pháp lý theo quy định. Người tạo đã ký cam kết bổ sung.'}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Request Summary */}
            {(() => {
              const targetReq = allApprovalRequests.find(r => r.id === actionTargetId);
              if (!targetReq) return null;
              return (
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
                  <div className="text-xs font-semibold text-[#6B7280] uppercase mb-2">Thông tin đề nghị</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="text-xs text-[#6B7280]">Khách hàng:</div>
                    <div className="text-xs text-[#111827] font-medium">{targetReq.customer}</div>
                    <div className="text-xs text-[#6B7280]">Giá trị:</div>
                    <div className="text-xs text-[#111827] font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>{targetReq.amount} đ</div>
                    <div className="text-xs text-[#6B7280]">Loại DV:</div>
                    <div className="text-xs text-[#111827] font-medium">{targetReq.serviceType}</div>
                    <div className="text-xs text-[#6B7280]">Người tạo:</div>
                    <div className="text-xs text-[#111827] font-medium">{targetReq.creator}</div>
                    <div className="text-xs text-[#6B7280]">Xác nhận DT:</div>
                    <div className="text-xs font-medium">
                      {targetReq.revenueStatus === 'Đã xác nhận' ? (
                        <span className="text-[#16A34A]">{targetReq.revenueStatus}</span>
                      ) : (
                        <span className="text-[#D97706]">{targetReq.revenueStatus}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Commitment Details */}
            {(() => {
              const targetReq = allApprovalRequests.find(r => r.id === actionTargetId) as any;
              if (!targetReq?.commitment) return null;
              return (
                <div className="bg-white border-2 border-[#D97706] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileCheck size={16} className="text-[#D97706]" />
                    <div className="text-sm font-semibold text-[#92400E]">Cam kết bổ sung hồ sơ</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-[#6B7280] w-20 flex-shrink-0">Nội dung:</span>
                      <span className="text-xs text-[#111827]">{targetReq.commitment.content}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#6B7280] w-20 flex-shrink-0">Hạn bổ sung:</span>
                      <span className="text-xs font-semibold text-[#DC2626]">{targetReq.commitment.deadline}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#6B7280] w-20 flex-shrink-0">Người ký:</span>
                      <span className="text-xs text-[#111827] font-medium">{targetReq.commitment.signer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#6B7280] w-20 flex-shrink-0">Ngày ký:</span>
                      <span className="text-xs text-[#6B7280]">{targetReq.commitment.signedDate}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Missing Documents List */}
            {(() => {
              const targetReq = allApprovalRequests.find(r => r.id === actionTargetId);
              if (!targetReq) return null;
              
              // Get all missing/overdue items grouped
              const missingGroups = LEGAL_GROUPS.map(group => {
                const missingItems = group.items.filter(item => 
                  targetReq.legalDocs[item.id] === 'missing' || targetReq.legalDocs[item.id] === 'overdue'
                ).map(item => ({
                  ...item,
                  status: targetReq.legalDocs[item.id]
                }));
                return missingItems.length > 0 ? { ...group, missingItems } : null;
              }).filter(Boolean);

              if (missingGroups.length === 0) return null;

              return (
                <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={16} className="text-[#DC2626]" />
                    <div className="text-sm font-semibold text-[#111827]">Danh sách Giấy tờ thiếu</div>
                  </div>
                  <div className="space-y-3">
                    {missingGroups.map((group: any) => (
                      <div key={group.name}>
                        <div className="text-xs font-medium text-[#6B7280] mb-1.5">{group.name}</div>
                        <ul className="space-y-1.5">
                          {group.missingItems.map((item: any) => (
                            <li key={item.id} className="flex items-center gap-2 text-xs">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                item.status === 'overdue' ? 'bg-[#DC2626]' : 'bg-[#F59E0B]'
                              }`}></div>
                              <span className="text-[#374151]">{item.name}</span>
                              <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-medium ${
                                item.status === 'overdue' 
                                  ? 'bg-[#FEE2E2] text-[#991B1B]' 
                                  : 'bg-[#FEF3C7] text-[#92400E]'
                              }`}>
                                {item.status === 'overdue' ? 'Quá hạn' : 'Thiếu'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Risk Level Indicator */}
            {(() => {
              const targetReq = allApprovalRequests.find(r => r.id === actionTargetId);
              const isOverdue = targetReq?.legal === 'overdue';
              return (
                <div className="flex items-center gap-3 p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                  <div className="text-xs font-medium text-[#6B7280]">Mức độ rủi ro:</div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${isOverdue ? 'bg-[#DC2626]' : 'bg-[#F59E0B]'}`}></div>
                    <span className={`text-xs font-semibold ${isOverdue ? 'text-[#DC2626]' : 'text-[#D97706]'}`}>
                      {isOverdue ? 'CAO — HS quá hạn' : 'TRUNG BÌNH — HS thiếu, có cam kết'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Director Signature Preview */}
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 flex flex-col sm:flex-row gap-3">
              <div className="w-40 h-12 bg-white border border-[#E5E7EB] rounded flex items-center justify-center text-xs text-[#9CA3AF] italic">
                [Chữ ký từ tài khoản]
              </div>
              <div className="flex-1 space-y-0.5">
                <p className="text-sm font-medium text-[#111827]">Nguyễn Văn Giám đốc</p>
                <p className="text-xs text-[#6B7280]">Giám đốc Trung tâm — VTK</p>
                <p className="text-xs text-[#9CA3AF]">14/03/2026 {new Date().toLocaleTimeString('vi-VN')}</p>
                <p className="text-[10px] text-[#9CA3AF] flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Chữ ký lấy từ tài khoản cá nhân
                </p>
              </div>
            </div>

            {/* Mandatory Checkboxes */}
            <div className="space-y-3 pt-2 border-t border-[#E5E7EB]">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-[#D1D5DB] text-[#EE0033] focus:ring-[#EE0033]"
                  checked={commitmentAcknowledged}
                  onChange={() => setCommitmentAcknowledged(!commitmentAcknowledged)}
                />
                <span className="text-xs text-[#374151] group-hover:text-[#111827]">
                  Tôi đã xem xét <strong>cam kết bổ sung hồ sơ pháp lý</strong> và xác nhận người tạo đề nghị đã ký cam kết hợp lệ với hạn bổ sung rõ ràng.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-[#D1D5DB] text-[#EE0033] focus:ring-[#EE0033]"
                  checked={riskAcknowledged}
                  onChange={() => setRiskAcknowledged(!riskAcknowledged)}
                />
                <span className="text-xs text-[#374151] group-hover:text-[#111827]">
                  Tôi hiểu rằng việc phê duyệt đề nghị <strong>khi chưa đủ hồ sơ pháp lý</strong> sẽ được ghi nhận vào nhật ký kiểm toán và tôi chịu trách nhiệm về quyết định này.
                </span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Huỷ</Button>
            </DialogClose>
            <Button
              className="bg-[#D97706] hover:bg-[#B45309] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={doApproveWithCommitment}
              disabled={isActing || !commitmentAcknowledged || !riskAcknowledged}
            >
              <AlertTriangle size={14} className="mr-1.5" />
              {approveMut.isPending ? 'Đang duyệt...' : 'Duyệt có cam kết'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Legal Detail Modal — shared for KT and GĐ */}
      <Dialog open={showLegalDetailModal} onOpenChange={setShowLegalDetailModal}>
        <DialogContent className="md:max-w-[520px]">
          {(() => {
            const targetReq = allApprovalRequests.find(r => r.id === legalDetailTargetId);
            if (!targetReq) return null;
            const stats = getLegalDocStats(targetReq.legalDocs);
            const isComplete = targetReq.legal === 'complete';
            const isOverdue = targetReq.legal === 'overdue';
            return (
              <>
                <DialogHeader>
                  <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                    isComplete ? 'bg-[#D1FAE5]' : isOverdue ? 'bg-[#FEE2E2]' : 'bg-[#FEF3C7]'
                  }`}>
                    {isComplete ? (
                      <CheckCircle className="w-6 h-6 text-[#065F46]" />
                    ) : isOverdue ? (
                      <XCircle className="w-6 h-6 text-[#DC2626]" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-[#D97706]" />
                    )}
                  </div>
                  <DialogTitle className="text-center">Chi tiết hồ sơ pháp lý</DialogTitle>
                  <DialogDescription className="text-center">
                    <span className="font-semibold text-[#EE0033]">{targetReq.id}</span> — {targetReq.customer}
                  </DialogDescription>
                </DialogHeader>

                <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                  {/* Summary Bar */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB]">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-[#16A34A]">{stats.complete}</div>
                        <div className="text-[10px] text-[#6B7280]">Đầy đủ</div>
                      </div>
                      {stats.missing > 0 && (
                        <div className="text-center">
                          <div className="text-lg font-semibold text-[#D97706]">{stats.missing}</div>
                          <div className="text-[10px] text-[#6B7280]">Thiếu</div>
                        </div>
                      )}
                      {stats.overdue > 0 && (
                        <div className="text-center">
                          <div className="text-lg font-semibold text-[#DC2626]">{stats.overdue}</div>
                          <div className="text-[10px] text-[#6B7280]">Quá hạn</div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#6B7280]">Hoàn thành</div>
                      <div className={`text-sm font-semibold ${isComplete ? 'text-[#16A34A]' : 'text-[#D97706]'}`}>
                        {stats.complete}/{stats.total} ({Math.round((stats.complete / stats.total) * 100)}%)
                      </div>
                      {/* Progress bar */}
                      <div className="w-24 h-1.5 bg-[#E5E7EB] rounded-full mt-1">
                        <div
                          className={`h-full rounded-full ${isComplete ? 'bg-[#16A34A]' : isOverdue ? 'bg-[#DC2626]' : 'bg-[#D97706]'}`}
                          style={{ width: `${(stats.complete / stats.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Grouped Checklist */}
                  <div className="space-y-3">
                    {LEGAL_GROUPS.map((group) => {
                      const groupHasIssue = group.items.some(item => targetReq.legalDocs[item.id] !== 'complete');
                      return (
                        <div key={group.name} className={`rounded-lg border ${groupHasIssue ? 'border-[#FCD34D] bg-[#FFFBEB]' : 'border-[#E5E7EB] bg-white'}`}>
                          <div className={`px-3 py-2 text-xs font-semibold flex items-center justify-between rounded-t-lg ${
                            groupHasIssue ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#F3F4F6] text-[#374151]'
                          }`}>
                            <span>{group.name}</span>
                            <span className="text-[10px] font-medium text-[#6B7280]">
                              {group.items.filter(i => targetReq.legalDocs[i.id] === 'complete').length}/{group.items.length}
                            </span>
                          </div>
                          <div className="divide-y divide-[#E5E7EB]">
                            {group.items.map((item) => {
                              const docStatus = targetReq.legalDocs[item.id];
                              return (
                                <div key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                                  {docStatus === 'complete' ? (
                                    <div className="w-5 h-5 rounded-full bg-[#D1FAE5] flex items-center justify-center flex-shrink-0">
                                      <Check size={12} className="text-[#065F46]" strokeWidth={3} />
                                    </div>
                                  ) : docStatus === 'overdue' ? (
                                    <div className="w-5 h-5 rounded-full bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
                                      <XCircle size={12} className="text-[#DC2626]" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
                                      <AlertTriangle size={10} className="text-[#D97706]" />
                                    </div>
                                  )}
                                  <span className={`text-xs flex-1 ${docStatus === 'complete' ? 'text-[#374151]' : 'text-[#111827] font-medium'}`}>
                                    {item.name}
                                  </span>
                                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                    docStatus === 'complete'
                                      ? 'bg-[#D1FAE5] text-[#065F46]'
                                      : docStatus === 'overdue'
                                      ? 'bg-[#FEE2E2] text-[#991B1B]'
                                      : 'bg-[#FEF3C7] text-[#92400E]'
                                  }`}>
                                    {docStatus === 'complete' ? 'Đã có' : docStatus === 'overdue' ? 'Quá hạn' : 'Thiếu'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Commitment info if exists */}
                  {(targetReq as any).commitment && (
                    <div className="bg-[#FFFBEB] border border-[#FCD34D] rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FileCheck size={14} className="text-[#D97706]" />
                        <span className="text-xs font-semibold text-[#92400E]">Cam kết bổ sung</span>
                      </div>
                      <div className="text-xs text-[#78350F]">{(targetReq as any).commitment.content}</div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] text-[#92400E]">Hạn: <strong>{(targetReq as any).commitment.deadline}</strong></span>
                        <span className="text-[10px] text-[#92400E]">Người ký: <strong>{(targetReq as any).commitment.signer}</strong></span>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Đóng</Button>
                  </DialogClose>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}