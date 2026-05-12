import { useState, useEffect, useRef } from 'react';
import {
  ChevronDown, ChevronUp, Upload, Eye, AlertTriangle, FileText,
  Check, X, Clock, Loader, Lock, ArrowLeft, ExternalLink, Copy,
  Edit3, Send, Zap, Filter, Download, Calendar, AlertCircle
} from 'lucide-react';
import { 
  formatNumberInput, 
  parseNumberInput, 
  calculateVAT, 
  calculateTotal,
  getTodayString,
  getMinFutureDateString,
  scrollToError,
  calculateChecklistProgress,
  hasCommitmentItems
} from '../utils/formHelpers';
import { DetailViewHeader, QuickLinksPills } from './NavigationHelpers';

interface CreateInvoiceRoleBasedProps {
  onBack: () => void;
  requestId?: string;
  status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'returned' | 'issued';
  isOwner?: boolean;
  ownerInfo?: {
    name: string;
    department: string;
    date: string;
  };
  rejectionReason?: string;
  returnReason?: string;
  onNavigateToView?: (view: string) => void; // For quick links
  userRole?: 'employee' | 'manager' | 'accountant' | 'director' | 'admin';
}

export default function CreateInvoiceRoleBased({
  onBack,
  requestId = 'DN-2026-00156',
  status = 'draft',
  isOwner = true,
  ownerInfo = {
    name: 'Nguyễn Văn A',
    department: 'P. Kỹ thuật Công nghệ',
    date: '10/03/2026'
  },
  rejectionReason = 'Giá trị hợp đồng không khớp với biên bản nghiệm thu. Vui lòng kiểm tra lại.',
  returnReason = 'Thiếu chữ ký đại diện khách hàng trên Biên bản nghiệm thu',
  onNavigateToView,
  userRole = 'employee'
}: CreateInvoiceRoleBasedProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'checklist' | 'preview' | 'activity'>('info');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    section1: true,
    section2: true,
    section3: true,
    section4: true
  });
  const [invoiceType, setInvoiceType] = useState('new');
  const [hasSignature, setHasSignature] = useState(true);
  
  // LEGAL CHECKLIST STATE - CRITICAL FOR BUSINESS RULE
  const [legalChecklist, setLegalChecklist] = useState({
    '1': true,  // Pre-checked for demo
    '2': true,  // Pre-checked for demo
    '3': false,
    '4': true,  // Pre-checked for demo
    '5': false,
    '6': false,
    '7': false,
    '8': false,
    '9': true,  // Pre-checked for demo
    '10': false,
    '11': false,
  });

  // COMMITMENT STATE - CRITICAL FOR BUSINESS RULE
  const [hasCommitment, setHasCommitment] = useState(false);
  const [commitmentData, setCommitmentData] = useState({
    deadline: '',
    content: 'Tôi cam kết bổ sung đầy đủ hồ sơ pháp lý còn thiếu theo danh mục trên trước ngày [date]. Trong trường hợp không hoàn thành đúng hạn, tôi hoàn toàn chịu trách nhiệm trước Ban Giám đốc Công ty.',
    signed: false
  });
  
  // Form state
  const [formData, setFormData] = useState({
    beforeVAT: '2.450.000.000',
    vatRate: '10',
    vat: '245.000.000',
    afterVAT: '2.695.000.000',
    contractDate: '2026-02-05',
    customer: 'Tập đoàn VNPT',
    taxCode: '0100109106',
    address: '57 Huỳnh Thúc Kháng, Đống Đa, Hà Nội',
    buyerName: 'Nguyễn Văn B',
    buyerEmail: 'nguyen.b@vnpt.vn',
    buyerPhone: '024 3974 0000',
    contractNumber: 'HĐ-VNPT-2026-00125',
    serviceType: 'Lắp đặt', // Changed to "Lắp đặt" for the demo
    serviceContent: 'Tích hợp hệ thống quản lý doanh nghiệp ERP cho VNPT'
  });
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [lastCalculatedField, setLastCalculatedField] = useState<string | null>(null);
  
  const beforeVATRef = useRef<HTMLInputElement>(null);
  const vatRef = useRef<HTMLDivElement>(null);
  const totalRef = useRef<HTMLDivElement>(null);

  // Determine if form should be read-only
  const isReadOnly = !isOwner || (isOwner && status !== 'draft' && status !== 'returned');
  const canEdit = isOwner && (status === 'draft' || status === 'returned');

  // CALCULATE CHECKLIST COMPLETION - CRITICAL
  const totalChecklistItems = 11;
  const checkedCount = Object.values(legalChecklist).filter(Boolean).length;
  const completionPercent = Math.round((checkedCount / totalChecklistItems) * 100);
  const isChecklistComplete = completionPercent === 100;

  // CAN SUBMIT LOGIC - CRITICAL BUSINESS RULE
  const canSubmitForApproval = isChecklistComplete || hasCommitment;
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // LEGAL CHECKLIST GROUPS - 11 items across 4 groups
  const checklistGroups = [
    {
      id: 'contract',
      name: 'Hồ sơ Hợp đồng',
      items: [
        { id: '1', name: 'Hợp đồng đã ký (bản scan)', status: 'complete' },
        { id: '2', name: 'Phụ lục hợp đồng (nếu có)', status: 'complete' },
        { id: '3', name: 'Biên bản đàm phán giá', status: 'pending' },
      ]
    },
    {
      id: 'acceptance',
      name: 'Hồ sơ Nghiệm thu',
      items: [
        { id: '4', name: 'Biên bản nghiệm thu khối lượng', status: 'complete' },
        { id: '5', name: 'Biên bản nghiệm thu hoàn thành', status: 'pending' },
        { id: '6', name: 'Bảng tổng hợp khối lượng nghiệm thu', status: 'pending' },
      ]
    },
    {
      id: 'settlement',
      name: 'Hồ sơ Quyết toán',
      items: [
        { id: '7', name: 'Biên bản quyết toán', status: 'pending' },
        { id: '8', name: 'Bảng tính giá trị quyết toán', status: 'pending' },
        { id: '9', name: 'Xác nhận công nợ', status: 'complete' },
      ]
    },
    {
      id: 'payment',
      name: 'Hồ sơ Thanh toán & Bảo lãnh',
      items: [
        { id: '10', name: 'Đề nghị thanh toán', status: 'pending' },
        { id: '11', name: 'Bảo lãnh thực hiện HĐ / Bảo lãnh bảo hành', status: 'pending' },
      ]
    }
  ];

  // Toggle checklist item
  const toggleChecklistItem = (itemId: string) => {
    if (canEdit) {
      setLegalChecklist(prev => ({
        ...prev,
        [itemId]: !prev[itemId]
      }));
      setHasUnsavedChanges(true);
    }
  };

  // Handle commitment creation
  const handleCreateCommitment = () => {
    if (commitmentData.deadline && commitmentData.content) {
      setHasCommitment(true);
      setCommitmentData(prev => ({ ...prev, signed: true }));
      // In real app, would show toast notification
      alert('Đã tạo cam kết. Đề nghị sẽ chuyển PGĐ duyệt đặc biệt.');
    }
  };

  // Check if commitment form is valid
  const isCommitmentValid = commitmentData.deadline && commitmentData.content;

  // Get page title based on context
  const getPageTitle = () => {
    if (!isOwner) {
      return `Chi tiết đề nghị ${requestId}`;
    }
    if (status === 'draft') {
      return requestId ? 'Sửa đề nghị xuất Hoá đơn' : 'Tạo đề nghị xuất Hoá đơn';
    }
    return `Chi tiết đề nghị ${requestId}`;
  };

  // Status banner component
  const StatusBanner = () => {
    if (!isOwner) {
      // Manager viewing department member's request
      if (userRole === 'manager') {
        return (
          <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FDE68A] flex items-center justify-center text-[#78350F] text-sm font-medium flex-shrink-0">
              {ownerInfo.name.split(' ').pop()?.charAt(0) || 'N'}
            </div>
            <div>
              <div className="text-sm font-medium text-[#78350F]">
                Đề nghị của: {ownerInfo.name} — Chuyên viên — {ownerInfo.department}
              </div>
              <div className="text-xs text-[#92400E] mt-0.5">Ngày tạo: {ownerInfo.date}</div>
            </div>
          </div>
        );
      }
      
      // Accountant/Director/Admin viewing
      return (
        <div className="bg-[#F3F4F6] border border-[#D1D5DB] rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[#374151] text-sm font-medium flex-shrink-0">
            {ownerInfo.name.split(' ').pop()?.charAt(0) || 'N'}
          </div>
          <div>
            <div className="text-sm font-medium text-[#111827]">
              Tạo bởi: {ownerInfo.name} — {ownerInfo.department}
            </div>
            <div className="text-xs text-[#6B7280] mt-0.5">Ngày tạo: {ownerInfo.date}</div>
          </div>
        </div>
      );
    }

    switch (status) {
      case 'pending':
        return (
          <div className="bg-[#FFFBEB] border border-[#F59E0B] rounded-lg p-4 flex items-center gap-3">
            <Clock size={20} className="text-[#F59E0B] flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-[#92400E]">
                Đề nghị đang chờ phê duyệt. Bạn không thể sửa cho đến khi bị trả lại.
              </div>
            </div>
          </div>
        );
      
      case 'approved':
      case 'issued':
        return (
          <div className="bg-[#D1FAE5] border border-[#16A34A] rounded-lg p-4 flex items-center gap-3">
            <Check size={20} className="text-[#16A34A] flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-[#065F46]">
                Đề nghị đã được phê duyệt.
              </div>
              {status === 'issued' && (
                <button className="text-sm text-[#16A34A] underline mt-1 flex items-center gap-1 hover:text-[#065F46]">
                  Xem HĐ trên S-Invoice <ExternalLink size={12} />
                </button>
              )}
            </div>
          </div>
        );
      
      case 'rejected':
        return (
          <div className="bg-[#FEE2E2] border border-[#DC2626] rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <X size={20} className="text-[#DC2626] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-[#991B1B] mb-1">
                  Đề nghị đã bị từ chối
                </div>
                <div className="text-sm text-[#7F1D1D]">
                  Lý do: {rejectionReason}
                </div>
              </div>
            </div>
            <button className="h-9 px-4 bg-[#DC2626] text-white text-sm font-medium rounded-lg hover:bg-[#B91C1C] flex items-center gap-2">
              <Copy size={14} />
              Tạo đề nghị mới từ bản này
            </button>
          </div>
        );
      
      case 'returned':
        return (
          <div className="bg-[#FEF3C7] border border-[#D97706] rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-[#D97706] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-[#92400E] mb-1">
                Đề nghị đã được trả lại
              </div>
              <div className="text-sm text-[#78350F]">
                Lý do: {returnReason}
              </div>
              <div className="text-sm text-[#92400E] mt-2">
                Vui lòng bổ sung thông tin và gửi lại.
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Field wrapper for read-only state
  const InputField = ({ 
    label, 
    value, 
    placeholder, 
    required = false,
    highlighted = false 
  }: { 
    label: string; 
    value?: string; 
    placeholder?: string; 
    required?: boolean;
    highlighted?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-medium text-[#374151] mb-1.5">
        {label}
        {required && <span className="text-[#DC2626] ml-1">*</span>}
      </label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={isReadOnly}
        onChange={() => {}}
        className={`w-full h-10 px-3 text-sm rounded-lg transition-colors ${
          isReadOnly 
            ? 'bg-[#F3F4F6] text-[#6B7280] cursor-not-allowed border-0' 
            : highlighted
            ? 'border-2 border-[#F59E0B] bg-[#FFFBEB] focus:ring-2 focus:ring-[#F59E0B]'
            : 'border border-[#D1D5DB] focus:ring-2 focus:ring-[#EE0033] focus:border-[#EE0033]'
        }`}
      />
    </div>
  );

  const SelectField = ({ 
    label, 
    value, 
    options, 
    required = false 
  }: { 
    label: string; 
    value?: string; 
    options: string[]; 
    required?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-medium text-[#374151] mb-1.5">
        {label}
        {required && <span className="text-[#DC2626] ml-1">*</span>}
      </label>
      <select
        value={value}
        disabled={isReadOnly}
        onChange={() => {}}
        className={`w-full h-10 px-3 text-sm rounded-lg transition-colors ${
          isReadOnly 
            ? 'bg-[#F3F4F6] text-[#6B7280] cursor-not-allowed border-0' 
            : 'border border-[#D1D5DB] focus:ring-2 focus:ring-[#EE0033] focus:border-[#EE0033]'
        }`}
      >
        {options.map(opt => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6 pb-24">
      {/* NAVIGATION HEADER WITH QUICK LINKS */}
      <div className="mb-4">
        <QuickLinksPills
          recordId={requestId}
          links={[
            { 
              id: 'legal', 
              label: 'Pháp lý', 
              count: '8/11',
              status: status === 'returned' ? 'warning' : 'complete',
              onClick: () => {
                // Navigate to legal view filtered to this record
                if (onNavigateToView) onNavigateToView('legal');
              }
            },
            { 
              id: 'sinvoice', 
              label: 'S-Invoice', 
              status: status === 'issued' ? 'complete' : 'pending',
              onClick: () => {
                if (onNavigateToView) onNavigateToView('sinvoice');
              }
            },
            { 
              id: 'vfs', 
              label: 'VFS', 
              status: status === 'issued' ? 'complete' : 'pending',
              onClick: () => {
                if (onNavigateToView) onNavigateToView('accounting');
              }
            },
            { 
              id: 'approval', 
              label: 'Phê duyệt', 
              status: status === 'approved' || status === 'issued' ? 'complete' : status === 'rejected' ? 'error' : 'pending',
              onClick: () => {
                if (onNavigateToView) onNavigateToView('approval');
              }
            }
          ]}
        />
      </div>

      {/* HEADER */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <button 
            onClick={onBack}
            className="p-1 hover:bg-[#F3F4F6] rounded transition-colors"
          >
            <ArrowLeft size={20} className="text-[#6B7280]" />
          </button>
          <h1 className="text-base md:text-2xl font-semibold text-[#111827]">{getPageTitle()}</h1>
        </div>
        <p className="text-xs md:text-sm text-[#6B7280] ml-9">
          {isReadOnly ? 'Xem thông tin chi tiết đề nghị' : 'Điền đầy đủ thông tin để tạo đề nghị xuất hoá đơn'}
        </p>
      </div>

      {/* STATUS BANNER */}
      <StatusBanner />

      {/* SIGNATURE WARNING (only for draft/returned and owner) */}
      {canEdit && !hasSignature && (
        <div className="bg-[#FFFBEB] border border-[#F59E0B] rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-[#F59E0B] flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-[#92400E] mb-1">
              Bạn chưa thiết lập chữ ký số
            </div>
            <div className="text-sm text-[#78350F] mb-3">
              Chữ ký số được yêu cầu để gửi phê duyệt và cam kết hồ sơ pháp lý. Vui lòng thiết lập ngay.
            </div>
            <button className="h-9 px-4 bg-[#F59E0B] text-white text-sm font-medium rounded-lg hover:bg-[#D97706]">
              Thiết lập chữ ký ngay
            </button>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="flex gap-8 px-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-[#EE0033] text-[#EE0033]'
                : 'border-transparent text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            1. Thông tin đề nghị
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'checklist'
                ? 'border-[#EE0033] text-[#EE0033]'
                : 'border-transparent text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            2. Hồ sơ pháp lý
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-[#EE0033] text-[#EE0033]'
                : 'border-transparent text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            3. Xem trước HĐ
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'activity'
                ? 'border-[#EE0033] text-[#EE0033]'
                : 'border-transparent text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            <Clock size={16} className={activeTab === 'activity' ? 'text-[#EE0033]' : 'text-[#6B7280]'} />
            4. Nhật ký
          </button>
        </div>
      </div>

      {/* TAB 1: THÔNG TIN ĐỀ NGHỊ */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          {/* Section 1: Thông tin chung */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('section1')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors"
            >
              <h3 className="text-base font-semibold text-[#111827]">1. Thông tin chung</h3>
              {expandedSections.section1 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.section1 && (
              <div className="px-6 pb-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <SelectField 
                    label="Loại hoá đơn" 
                    value="Hoá đơn mới" 
                    options={['Hoá đơn mới', 'Hoá đơn điều chỉnh', 'Hoá đơn thay thế']}
                    required
                  />
                  <SelectField 
                    label="Trung tâm doanh thu" 
                    value="TT Khu vực 1" 
                    options={['TT Khu vực 1', 'TT Khu vực 2', 'TT Khu vực 3']}
                    required
                  />
                  <InputField label="Ngày xuất HĐ dự kiến" value="15/03/2026" required />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Thông tin khách hàng */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('section2')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors"
            >
              <h3 className="text-base font-semibold text-[#111827]">2. Thông tin khách hàng</h3>
              {expandedSections.section2 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.section2 && (
              <div className="px-6 pb-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Tên khách hàng" value="Tập đoàn VNPT" placeholder="Nhập tên công ty..." required />
                  <InputField label="Mã số thuế" value="0100109106" placeholder="10 số" required />
                </div>
                <InputField label="Địa chỉ" value="57 Huỳnh Thúc Kháng, Đống Đa, Hà Nội" placeholder="Nhập địa chỉ đầy đủ..." required />
                <div className="grid grid-cols-3 gap-4">
                  <InputField label="Người mua hàng" value="Nguyễn Văn B" />
                  <InputField label="Email" value="nguyen.b@vnpt.vn" />
                  <InputField label="Số điện thoại" value="024 3974 0000" />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Thông tin hợp đồng */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('section3')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors"
            >
              <h3 className="text-base font-semibold text-[#111827]">3. Thông tin hợp đồng</h3>
              {expandedSections.section3 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.section3 && (
              <div className="px-6 pb-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <InputField label="Số hợp đồng" value="HĐ-VNPT-2026-00125" placeholder="Nhập số hợp đồng..." required />
                  <InputField label="Ngày ký HĐ" value="05/02/2026" required />
                  <SelectField 
                    label="Loại dịch vụ" 
                    value="Tích hợp hệ thống" 
                    options={['Tích hợp hệ thống', 'Tư vấn CNTT', 'Dịch vụ Cloud', 'Phát triển phần mềm']}
                    required
                  />
                </div>
                <InputField label="Nội dung dịch vụ" value="Tích hợp hệ thống quản lý doanh nghiệp ERP cho VNPT" />
              </div>
            )}
          </div>

          {/* Section 4: Thông tin giá trị */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('section4')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors"
            >
              <h3 className="text-base font-semibold text-[#111827]">4. Thông tin giá trị</h3>
              {expandedSections.section4 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.section4 && (
              <div className="px-6 pb-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <InputField 
                    label="Giá trị trước VAT" 
                    value="2.450.000.000" 
                    placeholder="VNĐ" 
                    required 
                    highlighted={status === 'returned'}
                  />
                  <SelectField 
                    label="Thuế suất VAT" 
                    value="10%" 
                    options={['0%', '5%', '8%', '10%']}
                    required
                  />
                  <InputField label="Giá trị sau VAT" value="2.695.000.000" required />
                </div>
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Tổng giá trị thanh toán:</span>
                    <span className="font-semibold text-[#111827]" style={{ fontVariantNumeric: 'tabular-nums' }}>2.695.000.000 đ</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: HỒ SƠ PHÁT LÝ */}
      {activeTab === 'checklist' && (
        <div className="space-y-6">
          {/* PROGRESS BAR - CRITICAL */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-[#111827]">Tiến độ hồ sơ pháp lý</h3>
              <div className="text-sm font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {checkedCount}/{totalChecklistItems} đã đủ ({completionPercent}%)
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="h-3 bg-[#E5E7EB] rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-[#16A34A] transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              ></div>
            </div>

            {/* Status message */}
            {isChecklistComplete ? (
              <div className="flex items-center gap-2 text-sm text-[#16A34A] font-medium">
                <Check size={16} />
                <span>✓ Đủ hồ sơ pháp lý</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-[#DC2626] font-medium">
                <AlertTriangle size={16} />
                <span>⚠ Chưa đủ hồ sơ — cần bổ sung hoặc tạo cam kết</span>
              </div>
            )}
          </div>

          {/* CHECKLIST GROUPS */}
          {checklistGroups.map((group) => (
            <div key={group.id} className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
              <div className="px-6 py-4 bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-[#111827]">{group.name}</h3>
                  <span className="text-sm text-[#6B7280]">
                    {group.items.filter(item => legalChecklist[item.id]).length}/{group.items.length}
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-3">
                {group.items.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={legalChecklist[item.id]}
                      disabled={!canEdit}
                      onChange={() => toggleChecklistItem(item.id)}
                      className={`mt-1 w-5 h-5 rounded border-[#D1D5DB] text-[#EE0033] focus:ring-[#EE0033] ${
                        !canEdit ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[#111827]">{item.name}</span>
                        {legalChecklist[item.id] ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-[#D1FAE5] text-[#065F46] font-medium">
                            ✓ Đã có
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-[#F3F4F6] text-[#6B7280] font-medium">
                            Chưa có
                          </span>
                        )}
                      </div>
                      {canEdit && !legalChecklist[item.id] && (
                        <button 
                          className="text-xs text-[#EE0033] hover:underline flex items-center gap-1 mt-1"
                        >
                          <Upload size={12} />
                          Tải lên file
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* COMMITMENT SECTION - CRITICAL - ONLY SHOWN WHEN CHECKLIST < 100% */}
          {!isChecklistComplete && canEdit && (
            <div className="bg-[#FEF2F2] border-l-4 border-[#DC2626] rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle size={24} className="text-[#DC2626] flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#DC2626] mb-2">
                    ⚠ Hồ sơ pháp lý chưa đầy đủ
                  </h3>
                  <p className="text-sm text-[#7F1D1D] leading-relaxed">
                    Để xuất hoá đơn khi chưa đủ hồ sơ, bạn phải tạo <strong>Cam kết bổ sung</strong> với thời hạn cụ thể. 
                    Chữ ký xác nhận sẽ được tự động gắn từ tài khoản của bạn.
                  </p>
                </div>
              </div>

              {!hasCommitment ? (
                <div className="space-y-4">
                  {/* Commitment deadline */}
                  <div>
                    <label className="block text-sm font-medium text-[#7F1D1D] mb-1.5">
                      Cam kết bổ sung hồ sơ trước ngày: <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="date"
                      value={commitmentData.deadline}
                      onChange={(e) => setCommitmentData(prev => ({ ...prev, deadline: e.target.value }))}
                      min={getTodayString()}
                      className="w-full h-10 px-3 text-sm rounded-lg border-2 border-[#DC2626] focus:ring-2 focus:ring-[#DC2626] focus:border-[#DC2626]"
                    />
                  </div>

                  {/* Commitment content */}
                  <div>
                    <label className="block text-sm font-medium text-[#7F1D1D] mb-1.5">
                      Nội dung cam kết: <span className="text-[#DC2626]">*</span>
                    </label>
                    <textarea
                      value={commitmentData.content.replace('[date]', commitmentData.deadline || '___________')}
                      onChange={(e) => setCommitmentData(prev => ({ ...prev, content: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 text-sm rounded-lg border-2 border-[#DC2626] focus:ring-2 focus:ring-[#DC2626] focus:border-[#DC2626] resize-none"
                    />
                  </div>

                  {/* Signature preview */}
                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Lock size={16} className="text-[#6B7280] mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-[#111827] mb-1">
                          Người cam kết: {ownerInfo.name}
                        </div>
                        <div className="text-xs text-[#6B7280] mb-1">
                          Chức danh: Chuyên viên — {ownerInfo.department}
                        </div>
                        <div className="text-xs text-[#9CA3AF] flex items-center gap-1">
                          <Lock size={12} />
                          Chữ ký tự động từ tài khoản
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Create commitment button */}
                  <button
                    onClick={handleCreateCommitment}
                    disabled={!isCommitmentValid || !hasSignature}
                    className="w-full h-12 px-6 bg-[#D97706] text-white rounded-lg text-sm font-semibold hover:bg-[#B45309] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {!hasSignature ? (
                      <>
                        <Lock size={16} />
                        Cần thiết lập chữ ký trước
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Tạo cam kết và gửi duyệt đặc biệt
                      </>
                    )}
                  </button>
                </div>
              ) : (
                // Commitment created confirmation
                <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Check size={20} className="text-[#F59E0B]" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-[#92400E]">
                        ✓ Đã tạo cam kết bổ sung hồ sơ
                      </div>
                      <div className="text-xs text-[#78350F] mt-1">
                        Cam kết bổ sung trước: {commitmentData.deadline} — Người cam kết: {ownerInfo.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-[#92400E] bg-[#FFFBEB] border border-[#FDE68A] rounded p-3">
                    {commitmentData.content.replace('[date]', commitmentData.deadline)}
                  </div>
                  <button
                    onClick={() => setHasCommitment(false)}
                    className="mt-3 text-xs text-[#D97706] hover:underline"
                  >
                    Hủy cam kết và chỉnh sửa lại
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Info about commitment */}
          {!isChecklistComplete && canEdit && !hasCommitment && (
            <div className="bg-[#F0F9FF] border border-[#93C5FD] rounded-lg p-4 flex items-start gap-3">
              <AlertCircle size={16} className="text-[#1D4ED8] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[#1E40AF]">
                <strong>Lưu ý:</strong> Cam kết bổ sung hồ sơ sẽ được chuyển đến Phó Giám đốc để duyệt đặc biệt. 
                Bạn cần hoàn thành bổ sung hồ sơ đúng hạn cam kết.
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: XEM TRƯỚC HĐ */}
      {activeTab === 'preview' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#111827] mb-2">HÓA ĐƠN GIÁ TRỊ GIA TĂNG</h2>
              <p className="text-sm text-[#6B7280]">(Bản xem trước)</p>
            </div>
            
            <div className="space-y-6 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-medium text-[#111827] mb-1">Đơn vị bán hàng:</div>
                  <div className="text-[#6B7280]">Công ty Viettel Tech Services</div>
                  <div className="text-[#6B7280]">MST: 0100000000</div>
                </div>
                <div>
                  <div className="font-medium text-[#111827] mb-1">Người mua hàng:</div>
                  <div className="text-[#6B7280]">Tập đoàn VNPT</div>
                  <div className="text-[#6B7280]">MST: 0100109106</div>
                </div>
              </div>

              <table className="w-full border border-[#E5E7EB]">
                <thead>
                  <tr className="bg-[#F3F4F6]">
                    <th className="border border-[#E5E7EB] px-4 py-2 text-left">Tên hàng hóa, dịch vụ</th>
                    <th className="border border-[#E5E7EB] px-4 py-2 text-right">Đơn giá</th>
                    <th className="border border-[#E5E7EB] px-4 py-2 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#E5E7EB] px-4 py-2">Tích hợp hệ thống quản lý doanh nghiệp ERP</td>
                    <td className="border border-[#E5E7EB] px-4 py-2 text-right">2.450.000.000</td>
                    <td className="border border-[#E5E7EB] px-4 py-2 text-right">2.450.000.000</td>
                  </tr>
                  <tr>
                    <td className="border border-[#E5E7EB] px-4 py-2 text-right font-medium" colSpan={2}>Cộng tiền hàng:</td>
                    <td className="border border-[#E5E7EB] px-4 py-2 text-right font-medium">2.450.000.000</td>
                  </tr>
                  <tr>
                    <td className="border border-[#E5E7EB] px-4 py-2 text-right font-medium" colSpan={2}>Thuế GTGT (10%):</td>
                    <td className="border border-[#E5E7EB] px-4 py-2 text-right font-medium">245.000.000</td>
                  </tr>
                  <tr>
                    <td className="border border-[#E5E7EB] px-4 py-2 text-right font-bold" colSpan={2}>Tổng cộng:</td>
                    <td className="border border-[#E5E7EB] px-4 py-2 text-right font-bold">2.695.000.000</td>
                  </tr>
                </tbody>
              </table>

              <div className="text-center text-xs text-[#9CA3AF] pt-4 border-t border-[#E5E7EB]">
                Đây là bản xem trước. Hoá đơn chính thức sẽ được xuất sau khi phê duyệt.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NHẬT KÝ HOẠT ĐỘNG */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          {/* Header with filters */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-[#111827] flex items-center gap-2">
                  <Clock size={20} className="text-[#EE0033]" />
                  Nhật ký hoạt động
                </h2>
                <p className="text-sm text-[#6B7280] mt-1">Theo dõi toàn bộ lịch sử thay đổi và hành động</p>
              </div>
              <button className="h-9 px-4 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F3F4F6] flex items-center gap-2">
                <Download size={14} />
                Xuất nhật ký
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select className="h-9 px-3 pr-8 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] appearance-none bg-white">
                <option>Tất cả hành động</option>
                <option>Tạo mới</option>
                <option>Chỉnh sửa</option>
                <option>Phê duyệt</option>
                <option>Từ chối</option>
              </select>
              <select className="h-9 px-3 pr-8 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] appearance-none bg-white">
                <option>Tất cả người dùng</option>
                <option>Nguyễn Văn A</option>
                <option>Trần Thị B</option>
              </select>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Chọn khoảng thời gian"
                  className="h-9 pl-9 pr-3 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] w-48"
                />
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#E5E7EB]"></div>

              <div className="space-y-0">
                {/* Entry 10: System action */}
                <div className="relative pl-12 pb-6">
                  <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-[#1D4ED8] border-2 border-white"></div>
                  <div>
                    <div className="text-[14px] font-medium text-[#111827] mb-1 flex items-center gap-2">
                      <Zap size={14} className="text-[#1D4ED8]" />
                      Đẩy sang S-Invoice — Hệ thống
                    </div>
                    <p className="text-[13px] text-[#6B7280] mb-1">
                      Tự động chuyển sang S-Invoice sau phê duyệt
                    </p>
                    <div className="text-xs text-[#9CA3AF]">13/03/2026 15:43:00 — IP: Hệ thống</div>
                  </div>
                </div>

                {/* Entry 9: Approval with signature */}
                <div className="relative pl-12 pb-6">
                  <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-[#16A34A] border-2 border-white"></div>
                  <div>
                    <div className="text-[14px] font-medium text-[#111827] mb-1 flex items-center gap-2">
                      <Check size={14} className="text-[#16A34A]" />
                      Duyệt — Trần Thị B
                    </div>
                    <p className="text-[13px] text-[#6B7280] mb-2">
                      Ghi chú: Đã soát xét đầy đủ, chuyển xuất HĐ.
                    </p>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="text-xs text-[#9CA3AF]">13/03/2026 15:42:30 — IP: 10.0.1.45</div>
                      <div className="px-2 py-0.5 bg-[#F3F4F6] border border-[#D1D5DB] rounded text-[9px] text-[#6B7280] font-mono">
                        Trần Thị B
                      </div>
                    </div>
                  </div>
                </div>

                {/* Entry 8: Re-submit */}
                <div className="relative pl-12 pb-6">
                  <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-[#F59E0B] border-2 border-white"></div>
                  <div>
                    <div className="text-[14px] font-medium text-[#111827] mb-1 flex items-center gap-2">
                      <Send size={14} className="text-[#F59E0B]" />
                      Gửi duyệt lại — Nguyễn Văn A
                    </div>
                    <p className="text-[13px] text-[#6B7280] mb-1">
                      Đã bổ sung đầy đủ hồ sơ theo yêu cầu
                    </p>
                    <div className="text-xs text-[#9CA3AF]">12/03/2026 14:30:15 — IP: 10.0.1.102</div>
                  </div>
                </div>

                {/* Entry 7: Upload file */}
                <div className="relative pl-12 pb-6">
                  <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-[#1D4ED8] border-2 border-white"></div>
                  <div>
                    <div className="text-[14px] font-medium text-[#111827] mb-1 flex items-center gap-2">
                      <Upload size={14} className="text-[#1D4ED8]" />
                      Upload "BB nghiệm thu.pdf" — Nguyễn Văn A
                    </div>
                    <p className="text-[13px] text-[#6B7280] mb-1">
                      Tải lên file Biên bản nghiệm thu
                    </p>
                    <div className="text-xs text-[#9CA3AF]">12/03/2026 14:00:42 — IP: 10.0.1.102</div>
                  </div>
                </div>

                {/* Entry 6: Returned */}
                <div className="relative pl-12 pb-6">
                  <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-[#DC2626] border-2 border-white"></div>
                  <div>
                    <div className="text-[14px] font-medium text-[#111827] mb-1 flex items-center gap-2">
                      <AlertTriangle size={14} className="text-[#DC2626]" />
                      Trả lại bổ sung — Trần Thị B
                    </div>
                    <p className="text-[13px] text-[#6B7280] mb-1">
                      Ghi chú: "Thiếu BB nghiệm thu"
                    </p>
                    <div className="text-xs text-[#9CA3AF]">11/03/2026 09:00:20 — IP: 10.0.1.45</div>
                  </div>
                </div>

                {/* Entry 5: View */}
                <div className="relative pl-12 pb-6">
                  <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-[#9CA3AF] border-2 border-white"></div>
                  <div>
                    <div className="text-[14px] font-medium text-[#111827] mb-1 flex items-center gap-2">
                      <Eye size={14} className="text-[#9CA3AF]" />
                      Xem bởi Trần Thị B (Kế toán)
                    </div>
                    <p className="text-[13px] text-[#6B7280] mb-1">
                      Đã xem chi tiết đề nghị
                    </p>
                    <div className="text-xs text-[#9CA3AF]">11/03/2026 08:30:10 — IP: 10.0.1.45</div>
                  </div>
                </div>

                {/* Entry 4: Submit for approval */}
                <div className="relative pl-12 pb-6">
                  <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-[#F59E0B] border-2 border-white"></div>
                  <div>
                    <div className="text-[14px] font-medium text-[#111827] mb-1 flex items-center gap-2">
                      <Send size={14} className="text-[#F59E0B]" />
                      Gửi duyệt — Nguyễn Văn A
                    </div>
                    <p className="text-[13px] text-[#6B7280] mb-1">
                      Chuyển đề nghị sang trạng thái chờ phê duyệt
                    </p>
                    <div className="text-xs text-[#9CA3AF]">10/03/2026 14:15:30 — IP: 10.0.1.102</div>
                  </div>
                </div>

                {/* Entry 3: Upload contract */}
                <div className="relative pl-12 pb-6">
                  <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-[#1D4ED8] border-2 border-white"></div>
                  <div>
                    <div className="text-[14px] font-medium text-[#111827] mb-1 flex items-center gap-2">
                      <Upload size={14} className="text-[#1D4ED8]" />
                      Upload "Hợp đồng đã ký.pdf" — Nguyễn Văn A
                    </div>
                    <p className="text-[13px] text-[#6B7280] mb-1">
                      Tải lên file Hợp đồng đã ký
                    </p>
                    <div className="text-xs text-[#9CA3AF]">10/03/2026 10:20:15 — IP: 10.0.1.102</div>
                  </div>
                </div>

                {/* Entry 2: Update settlement info */}
                <div className="relative pl-12 pb-6">
                  <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-[#1D4ED8] border-2 border-white"></div>
                  <div>
                    <div className="text-[14px] font-medium text-[#111827] mb-1 flex items-center gap-2">
                      <Edit3 size={14} className="text-[#1D4ED8]" />
                      Cập nhật thông tin quyết toán — Nguyễn Văn A
                    </div>
                    <p className="text-[13px] text-[#6B7280] mb-1">
                      Sửa giá trị quyết toán và thông tin VAT
                    </p>
                    <div className="text-xs text-[#9CA3AF]">10/03/2026 10:15:20 — IP: 10.0.1.102</div>
                  </div>
                </div>

                {/* Entry 1: Created */}
                <div className="relative pl-12">
                  <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-[#16A34A] border-2 border-white"></div>
                  <div>
                    <div className="text-[14px] font-medium text-[#111827] mb-1 flex items-center gap-2">
                      <Check size={14} className="text-[#16A34A]" />
                      Tạo đề nghị — Nguyễn Văn A
                    </div>
                    <p className="text-[13px] text-[#6B7280] mb-1">
                      Khởi tạo đề nghị xuất hoá đơn {requestId}
                    </p>
                    <div className="text-xs text-[#9CA3AF]">10/03/2026 09:30:00 — IP: 10.0.1.102</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM ACTION BAR - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] px-6 py-4 z-20">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          {canEdit ? (
            <>
              <button 
                onClick={onBack}
                className="h-10 px-6 text-sm font-medium text-[#6B7280] hover:text-[#374151] transition-colors"
              >
                Hủy
              </button>
              <div className="flex gap-3">
                <button className="h-10 px-6 bg-white text-[#374151] border border-[#D1D5DB] rounded-lg text-sm font-medium hover:bg-[#F3F4F6] transition-colors">
                  Lưu nháp
                </button>
                
                {/* CRITICAL: THREE STATES FOR SUBMIT BUTTON */}
                {isChecklistComplete ? (
                  // STATE A: Checklist 100% - Normal submit (Red)
                  <button 
                    disabled={!hasSignature}
                    className="h-10 px-6 bg-[#EE0033] text-white rounded-lg text-sm font-semibold hover:bg-[#CC002B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title={!hasSignature ? "Cần thiết lập chữ ký trước" : "Gửi phê duyệt"}
                  >
                    {!hasSignature && <Lock size={16} />}
                    Gửi phê duyệt
                  </button>
                ) : hasCommitment ? (
                  // STATE C: Checklist < 100% AND has commitment - Special submit (Amber)
                  <button 
                    disabled={!hasSignature}
                    className="h-10 px-6 bg-[#D97706] text-white rounded-lg text-sm font-semibold hover:bg-[#B45309] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title={!hasSignature ? "Cần thiết lập chữ ký trước" : "Gửi phê duyệt đặc biệt với cam kết"}
                  >
                    {!hasSignature ? <Lock size={16} /> : <Send size={16} />}
                    Gửi duyệt đặc biệt (có cam kết)
                  </button>
                ) : (
                  // STATE B: Checklist < 100% AND no commitment - DISABLED (Gray)
                  <button 
                    disabled
                    className="h-10 px-6 bg-[#9CA3AF] text-white rounded-lg text-sm font-semibold cursor-not-allowed flex items-center gap-2"
                    title="Cần đủ hồ sơ hoặc tạo cam kết bổ sung"
                  >
                    <Lock size={16} />
                    Gửi phê duyệt
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <button 
                onClick={onBack}
                className="h-10 px-6 bg-white text-[#374151] border border-[#D1D5DB] rounded-lg text-sm font-medium hover:bg-[#F3F4F6] transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Quay lại
              </button>
              {status === 'rejected' && isOwner && (
                <button className="h-10 px-6 bg-[#EE0033] text-white rounded-lg text-sm font-medium hover:bg-[#CC002B] transition-colors flex items-center gap-2">
                  <Copy size={16} />
                  Tạo đề nghị mới từ bản này
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}