import { useState } from 'react';
import {
  AlertTriangle, ChevronDown, ChevronUp, Upload, CheckCircle,
  Clock, X, User, FileCheck, Lock,
  Search, Filter, Download, ExternalLink,
  XCircle, MinusCircle, Activity, Shield, Settings,
  UserCheck, Send, RotateCcw, Info
} from 'lucide-react';
import { MASTER_INVOICE_DATA, getCommitmentRecords } from '../data/masterInvoiceData';

type UserRole = 'employee' | 'manager' | 'accountant' | 'director' | 'admin';

interface LegalTrackingProps {
  userRole: UserRole;
}

// Role permission helper
const getRolePermissions = (role: UserRole) => ({
  // Data scope
  viewAll: role !== 'employee', // Manager sees department data, others see all
  viewOwn: true,

  // Tab access
  canViewStatus: true,
  canViewCommitments: role !== 'employee',
  canViewCompliance: role !== 'employee',

  // Actions - Status tab
  canUploadDocument: true, // All roles can upload
  canRequestSupplement: role === 'accountant' || role === 'director' || role === 'admin',
  canExportExcel: role !== 'employee',
  canFilter: true,

  // Actions - Commitments tab
  canExtendDeadline: role === 'director' || role === 'admin',
  canApproveCommitment: role === 'director' || role === 'admin',
  canCreateCommitment: role === 'accountant' || role === 'director' || role === 'admin',
  canRejectCommitment: role === 'director' || role === 'admin',

  // Actions - Compliance tab
  canApproveCompliance: role === 'director' || role === 'admin',
  canExportComplianceReport: role === 'accountant' || role === 'director' || role === 'admin',

  // System config
  canConfigSystem: role === 'admin',
  canManageDocTypes: role === 'admin',
  canSetDeadlineRules: role === 'admin',
});

// Role labels for UI
const getRoleLabel = (role: UserRole) => {
  const labels: Record<UserRole, { label: string; bg: string; text: string; icon: any }> = {
    employee: { label: 'Nhân viên', bg: '#F3F4F6', text: '#4B5563', icon: User },
    manager: { label: 'Quản lý', bg: '#FED7AA', text: '#C2410C', icon: UserCheck },
    accountant: { label: 'Kế toán', bg: '#DBEAFE', text: '#1D4ED8', icon: FileCheck },
    director: { label: 'Giám đốc', bg: '#FFF1F3', text: '#EE0033', icon: Shield },
    admin: { label: 'Quản trị viên', bg: '#F3E8FF', text: '#7C3AED', icon: Settings },
  };
  return labels[role];
};

export default function LegalTracking({ userRole }: LegalTrackingProps) {
  const permissions = getRolePermissions(userRole);
  const roleInfo = getRoleLabel(userRole);

  // Tab state - default to 'status', employee can only see status
  const availableTabs = [
    { key: 'status' as const, label: userRole === 'employee' ? 'Hồ sơ pháp lý của tôi' : 'Tình trạng pháp lý', show: permissions.canViewStatus },
    { key: 'commitments' as const, label: 'Cam kết bổ sung', show: permissions.canViewCommitments },
    { key: 'compliance' as const, label: 'Báo cáo tuân thủ', show: permissions.canViewCompliance },
  ].filter(t => t.show);

  const [activeTab, setActiveTab] = useState<'status' | 'commitments' | 'compliance'>('status');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  const toggleRow = (id: string) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Data filtering based on role
  const CURRENT_USER = 'Nguyễn Văn A';
  const MANAGER_DEPARTMENT = 'KV3'; // Manager oversees department KV3
  
  const filteredData = userRole === 'employee'
    ? MASTER_INVOICE_DATA.filter(r => r.creator === CURRENT_USER)
    : userRole === 'manager'
    ? MASTER_INVOICE_DATA.filter(r => r.revenueCenter === MANAGER_DEPARTMENT)
    : MASTER_INVOICE_DATA;

  // Get stats from filtered data
  const completeList = filteredData.filter(r => r.legalStatus.status === 'complete');
  const supplementingList = filteredData.filter(r => r.legalStatus.status === 'supplementing');
  const insufficientList = filteredData.filter(r => r.legalStatus.status === 'insufficient');
  const overdueList = filteredData.filter(r => r.legalStatus.status === 'overdue');

  const totalTracking = filteredData.length;
  const completeCount = completeList.length;
  const supplementingCount = supplementingList.length;
  const insufficientCount = insufficientList.length;
  const overdueCount = overdueList.length;
  const completePercentage = totalTracking > 0 ? Math.round((completeCount / totalTracking) * 100) : 0;

  const commitmentRecords = userRole === 'employee'
    ? getCommitmentRecords().filter(r => r.creator === CURRENT_USER)
    : userRole === 'manager'
    ? getCommitmentRecords().filter(r => r.revenueCenter === MANAGER_DEPARTMENT)
    : getCommitmentRecords();

  const getLegalStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string; icon: any }> = {
      complete: { bg: '#ECFDF5', text: '#065F46', label: 'Đủ hồ sơ', icon: CheckCircle },
      supplementing: { bg: '#FEF3C7', text: '#92400E', label: 'Đang bổ sung', icon: Clock },
      insufficient: { bg: '#F3F4F6', text: '#6B7280', label: 'Thiếu hồ sơ', icon: MinusCircle },
      overdue: { bg: '#FEE2E2', text: '#991B1B', label: 'Quá hạn', icon: AlertTriangle }
    };
    const s = statusMap[status];
    if (!s) {
      return (
        <span className="inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">
          {status}
        </span>
      );
    }
    const Icon = s.icon;
    return (
      <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-medium" style={{ backgroundColor: s.bg, color: s.text }}>
        <Icon size={12} />
        {s.label}
      </span>
    );
  };

  const getRequestStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      draft: { bg: '#F3F4F6', text: '#6B7280', label: 'Nháp' },
      pending: { bg: '#FEF3C7', text: '#92400E', label: 'Đề nghị duyệt' },
      'pending-vpgd': { bg: '#FFF7ED', text: '#C2410C', label: 'Chờ duyệt VPGĐ' },
      approved: { bg: '#DBEAFE', text: '#1E40AF', label: 'Đã duyệt' },
      issued: { bg: '#D1FAE5', text: '#065F46', label: 'Đã xuất HĐ' },
      accounted: { bg: '#064E3B', text: '#FFFFFF', label: 'Đã hạch toán' },
      rejected: { bg: '#FEE2E2', text: '#991B1B', label: 'Từ chối' },
      returned: { bg: '#FEF3C7', text: '#92400E', label: 'Trả lại bổ sung' },
    };
    const s = statusMap[status];
    if (!s) {
      return (
        <span className="inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium" style={{ backgroundColor: s.bg, color: s.text }}>
        {s.label}
      </span>
    );
  };

  const RoleIcon = roleInfo.icon;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">
            {userRole === 'employee' ? 'Hồ sơ pháp lý của tôi' : 'Quản lý pháp lý'}
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {userRole === 'employee'
              ? 'Theo dõi tình trạng hồ sơ pháp lý các đề nghị của bạn'
              : userRole === 'manager'
              ? 'Theo dõi tình trạng hồ sơ pháp lý của TT Khu vực 3'
              : 'Theo dõi tình trạng hồ sơ pháp lý của toàn bộ đề nghị xuất hoá đơn'}
          </p>
        </div>

        {/* Role badge + actions */}
        <div className="flex items-center gap-3">
          {/* Role badge */}
          <span
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium"
            style={{ backgroundColor: roleInfo.bg, color: roleInfo.text }}
          >
            <RoleIcon size={14} />
            {roleInfo.label}
          </span>

          {/* Admin config button */}
          {permissions.canConfigSystem && (
            <button
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              className="h-9 px-4 bg-[#F3E8FF] border border-[#DDD6FE] rounded-lg text-sm font-medium text-[#7C3AED] hover:bg-[#EDE9FE] flex items-center gap-2"
            >
              <Settings size={16} />
              Cấu hình
            </button>
          )}
        </div>
      </div>

      {/* Admin Config Panel */}
      {permissions.canConfigSystem && showConfigPanel && (
        <div className="bg-[#F3E8FF] border border-[#DDD6FE] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings size={18} className="text-[#7C3AED]" />
            <h3 className="text-sm font-semibold text-[#7C3AED]">Cấu hình hệ thống pháp lý (Admin)</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-[#E5E7EB]">
              <div className="text-xs font-medium text-[#6B7280] uppercase mb-2">Loại hồ sơ bắt buộc</div>
              <div className="space-y-2">
                {['Hợp đồng', 'BB Nghiệm thu', 'BB Quyết toán', 'Đề nghị thanh toán', 'Bảo lãnh'].map((doc, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-[#374151]">{doc}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-[#D1D5DB] peer-checked:bg-[#7C3AED] rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-[#E5E7EB]">
              <div className="text-xs font-medium text-[#6B7280] uppercase mb-2">Hạn bổ sung mặc định</div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#6B7280]">Thời gian cam kết tối đa</label>
                  <select className="w-full h-9 px-3 mt-1 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] bg-white">
                    <option>15 ngày</option>
                    <option>30 ngày</option>
                    <option>45 ngày</option>
                    <option>60 ngày</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#6B7280]">Số lần gia hạn tối đa</label>
                  <select className="w-full h-9 px-3 mt-1 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] bg-white">
                    <option>1 lần</option>
                    <option>2 lần</option>
                    <option>3 lần</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-[#E5E7EB]">
              <div className="text-xs font-medium text-[#6B7280] uppercase mb-2">Cảnh báo tự động</div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#6B7280]">Nhắc nhở trước hạn</label>
                  <select className="w-full h-9 px-3 mt-1 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] bg-white">
                    <option>3 ngày</option>
                    <option>5 ngày</option>
                    <option>7 ngày</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#374151]">Email tự động</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-[#D1D5DB] peer-checked:bg-[#7C3AED] rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOP: STAT CARDS */}
      <div className={`grid gap-2 md:gap-4 ${userRole === 'employee' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-5'}`}>
        {/* Card 1 */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 md:p-5">
          <div className="text-[10px] md:text-xs font-medium text-[#6B7280] uppercase mb-2">
            {userRole === 'employee' ? 'Đề nghị của tôi' : userRole === 'manager' ? 'Đề nghị phòng ban' : 'Tổng đề nghị đang theo dõi'}
          </div>
          <div className="text-2xl md:text-3xl font-bold text-[#DC2626]" style={{ fontVariantNumeric: 'tabular-nums' }}>{totalTracking}</div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 md:p-5">
          <div className="text-[10px] md:text-xs font-medium text-[#6B7280] uppercase mb-2">Đủ hồ sơ</div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl md:text-3xl font-bold text-[#16A34A]" style={{ fontVariantNumeric: 'tabular-nums' }}>{completeCount}</div>
            <div className="text-xs md:text-sm font-medium text-[#16A34A]">{completePercentage}%</div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 md:p-5">
          <div className="text-[10px] md:text-xs font-medium text-[#6B7280] uppercase mb-2">Đang bổ sung</div>
          <div className="text-2xl md:text-3xl font-bold text-[#D97706]" style={{ fontVariantNumeric: 'tabular-nums' }}>{supplementingCount}</div>
        </div>

        {/* Card 4 - Employee: combined thiếu + quá hạn */}
        {userRole === 'employee' ? (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 md:p-5 relative overflow-hidden">
            <div className="text-[10px] md:text-xs font-medium text-[#6B7280] uppercase mb-2">Cần xử lý</div>
            <div className="text-2xl md:text-3xl font-bold text-[#DC2626]" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {insufficientCount + overdueCount}
            </div>
            {(insufficientCount + overdueCount) > 0 && (
              <div className="absolute inset-0 bg-[#FEE2E2] opacity-20 animate-pulse"></div>
            )}
          </div>
        ) : (
          <>
            {/* Card 4 */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 md:p-5">
              <div className="text-[10px] md:text-xs font-medium text-[#6B7280] uppercase mb-2">Thiếu hồ sơ</div>
              <div className="text-2xl md:text-3xl font-bold text-[#6B7280]" style={{ fontVariantNumeric: 'tabular-nums' }}>{insufficientCount}</div>
            </div>

            {/* Card 5 */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 md:p-5 relative overflow-hidden col-span-2 md:col-span-1">
              <div className="text-[10px] md:text-xs font-medium text-[#6B7280] uppercase mb-2">Quá hạn bổ sung</div>
              <div className="text-2xl md:text-3xl font-bold text-[#DC2626]" style={{ fontVariantNumeric: 'tabular-nums' }}>{overdueCount}</div>
              {overdueCount > 0 && (
                <div className="absolute inset-0 bg-[#FEE2E2] opacity-30 animate-pulse"></div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ALERT BANNER */}
      {overdueCount > 0 && (
        <div className="bg-[#FEF2F2] border-l-4 border-[#DC2626] rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-[#DC2626] flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-[#991B1B]">
              {userRole === 'employee'
                ? `⚠ Bạn có ${overdueCount} hồ sơ quá hạn bổ sung`
                : `⚠ Có ${overdueCount} hồ sơ quá hạn bổ sung tại 3 trung tâm`}
            </div>
            <div className="text-xs text-[#B91C1C] mt-1">
              {userRole === 'employee'
                ? 'Vui lòng bổ sung hồ sơ ngay để tránh ảnh hưởng đến quy trình duyệt'
                : 'Cần xử lý gấp để tránh ảnh hưởng đến quy trình xuất hoá đơn'}
            </div>
          </div>
        </div>
      )}

      {/* EMPLOYEE: Quick action guide */}
      {userRole === 'employee' && (insufficientCount + overdueCount + supplementingCount) > 0 && (
        <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl p-4 flex items-start gap-3">
          <Info size={20} className="text-[#1E40AF] flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-[#1E40AF]">Hướng dẫn bổ sung hồ sơ</div>
            <div className="text-xs text-[#3B82F6] mt-1 space-y-1">
              <p>1. Nhấn vào dòng đề nghị để xem chi tiết hồ sơ còn thiếu</p>
              <p>2. Nhấn nút <strong>"Tải lên"</strong> để upload hồ sơ bổ sung</p>
              <p>3. Hồ sơ sẽ được kế toán kiểm tra và cập nhật trạng thái</p>
            </div>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl">
        {/* Tab Headers */}
        <div className="border-b border-[#E5E7EB] flex overflow-x-auto whitespace-nowrap">
          {availableTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 md:px-6 py-4 text-xs md:text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-[#EE0033] text-[#EE0033]'
                  : 'border-transparent text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* TAB 1: TÌNH TRẠNG PHÁT LÝ */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-[#6B7280]" />
                  <span className="text-sm font-medium text-[#374151]">Bộ lọc:</span>
                </div>

                {/* Employee: simplified filters */}
                {userRole === 'employee' ? (
                  <>
                    <select className="h-9 px-3 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] bg-white">
                      <option>Trạng thái PL: Tất cả</option>
                      <option>Đủ hồ sơ</option>
                      <option>Thiếu hồ sơ</option>
                      <option>Quá hạn</option>
                      <option>Đang bổ sung</option>
                    </select>
                    <select className="h-9 px-3 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] bg-white">
                      <option>Tháng này</option>
                      <option>7 ngày qua</option>
                      <option>30 ngày qua</option>
                      <option>90 ngày qua</option>
                    </select>
                  </>
                ) : (
                  <>
                    <select className="h-9 px-3 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] bg-white">
                      <option>TT Doanh thu: Tất cả</option>
                      <option>Đã xác nhận</option>
                      <option>Chờ xác nhận</option>
                      <option>Chưa xác nhận</option>
                    </select>

                    <select className="h-9 px-3 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] bg-white">
                      <option>Trạng thái PL: Tất cả</option>
                      <option>Đủ hồ sơ</option>
                      <option>Thiếu hồ sơ</option>
                      <option>Quá hạn</option>
                      <option>Có cam kết</option>
                    </select>

                    <select className="h-9 px-3 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] bg-white">
                      <option>Loại DV: Tất cả</option>
                      <option>Tích hợp hệ thống</option>
                      <option>Tư vấn CNTT</option>
                      <option>Dịch vụ Cloud</option>
                      <option>Bảo trì hệ thống</option>
                      <option>Phát triển phần mềm</option>
                    </select>

                    <select className="h-9 px-3 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] bg-white">
                      <option>Người tạo: Tất cả</option>
                      <option>Nguyễn Văn A</option>
                      <option>Trần Thị B</option>
                      <option>Lê Văn C</option>
                    </select>

                    <select className="h-9 px-3 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] bg-white">
                      <option>Tháng này</option>
                      <option>7 ngày qua</option>
                      <option>30 ngày qua</option>
                      <option>90 ngày qua</option>
                      <option>Tùy chỉnh</option>
                    </select>
                  </>
                )}

                <div className="flex-1"></div>

                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="text"
                    placeholder={userRole === 'employee' ? 'Tìm mã ĐN, số HĐ...' : 'Tìm mã ĐN, số HĐ, CĐT...'}
                    className="h-9 pl-9 pr-3 border border-[#D1D5DB] rounded-lg text-sm w-64"
                  />
                </div>

                {permissions.canExportExcel && (
                  <button className="h-9 px-4 bg-[#F3F4F6] border border-[#D1D5DB] rounded-lg text-sm font-medium text-[#374151] hover:bg-[#E5E7EB] flex items-center gap-2">
                    <Download size={16} />
                    Xuất Excel
                  </button>
                )}
              </div>

              {/* Table */}
              <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">Mã đề nghị</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">Số HĐ</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">CĐT</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">Loại DV</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-[#6B7280] uppercase">Giá trị</th>
                        {permissions.viewAll && (
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">Người tạo</th>
                        )}
                        {permissions.viewAll && (
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">TT DT</th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">Pháp lý</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">TT ĐN</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">Cam kết</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-[#6B7280] uppercase w-28">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {filteredData.map((item) => (
                        <tr key={item.id} className="hover:bg-[#F9FAFB] cursor-pointer" onClick={() => toggleRow(item.requestCode)}>
                          <td className="px-4 py-3 text-sm font-medium text-[#EE0033]">{item.requestCode}</td>
                          <td className="px-4 py-3 text-sm text-[#374151]">{item.invoiceNo || '—'}</td>
                          <td className="px-4 py-3 text-sm text-[#374151]">{item.customer}</td>
                          <td className="px-4 py-3 text-sm text-[#6B7280]">{item.serviceType}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-[#111827]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {item.afterVAT.toLocaleString('vi-VN')} ₫
                          </td>
                          {permissions.viewAll && (
                            <td className="px-4 py-3 text-sm text-[#374151]">{item.creator}</td>
                          )}
                          {permissions.viewAll && (
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex items-center h-6 px-2 rounded text-xs font-medium bg-[#D1FAE5] text-[#065F46]">
                                {item.revenueCenter}
                              </span>
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 min-w-[80px]">
                                <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${(item.legalStatus.completed / item.legalStatus.total) * 100}%`,
                                      backgroundColor: item.legalStatus.status === 'complete' ? '#16A34A' :
                                        item.legalStatus.status === 'overdue' ? '#DC2626' :
                                        item.legalStatus.status === 'supplementing' ? '#D97706' : '#9CA3AF'
                                    }}
                                  ></div>
                                </div>
                              </div>
                              <div className="text-xs font-medium text-[#6B7280] whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                {item.legalStatus.completed}/{item.legalStatus.total}
                              </div>
                              {getLegalStatusBadge(item.legalStatus.status)}
                            </div>
                          </td>
                          <td className="px-4 py-3">{getRequestStatusBadge(item.status)}</td>
                          <td className="px-4 py-3 text-sm">
                            {item.commitment ? (
                              item.commitment.status === 'overdue' ? (
                                <span className="text-xs font-medium text-[#DC2626]">Quá hạn {Math.abs(item.commitment.daysRemaining)} ngày</span>
                              ) : (
                                <span className="text-xs font-medium text-[#D97706]">Có — hạn {item.commitment.deadline}</span>
                              )
                            ) : (
                              <span className="text-xs text-[#9CA3AF]">Không</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              {/* Employee: Upload button for incomplete items */}
                              {permissions.canUploadDocument && item.legalStatus.status !== 'complete' && (
                                <button
                                  onClick={() => setShowUploadModal(true)}
                                  className="h-7 px-2 text-xs font-medium text-[#1D4ED8] bg-[#EFF6FF] hover:bg-[#DBEAFE] rounded transition-colors flex items-center gap-1"
                                  title="Tải lên hồ sơ"
                                >
                                  <Upload size={12} />
                                  {userRole === 'employee' && <span>Tải lên</span>}
                                </button>
                              )}

                              {/* Accountant: Request supplement */}
                              {permissions.canRequestSupplement && item.legalStatus.status !== 'complete' && (
                                <button
                                  className="h-7 px-2 text-xs font-medium text-[#D97706] bg-[#FFFBEB] hover:bg-[#FEF3C7] rounded transition-colors flex items-center gap-1"
                                  title="Yêu cầu bổ sung"
                                >
                                  <Send size={12} />
                                </button>
                              )}

                              {/* Director/Admin: Approve legal override */}
                              {permissions.canApproveCommitment && item.legalStatus.status === 'supplementing' && (
                                <button
                                  className="h-7 px-2 text-xs font-medium text-[#065F46] bg-[#ECFDF5] hover:bg-[#D1FAE5] rounded transition-colors flex items-center gap-1"
                                  title="Duyệt pháp lý"
                                >
                                  <CheckCircle size={12} />
                                </button>
                              )}

                              {/* Expand toggle */}
                              <button
                                onClick={() => toggleRow(item.requestCode)}
                                className="h-7 w-7 flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] rounded"
                              >
                                {expandedRows.includes(item.requestCode) ? (
                                  <ChevronUp size={14} />
                                ) : (
                                  <ChevronDown size={14} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-[#6B7280]">
                  Hiển thị 1-{filteredData.length} trong tổng số {totalTracking} đề nghị
                  {userRole === 'employee' && <span className="text-[#9CA3AF] ml-1">(dữ liệu cá nhân)</span>}
                </div>
                <div className="flex gap-2">
                  <button className="h-9 px-3 border border-[#D1D5DB] rounded-lg text-sm font-medium text-[#6B7280] hover:bg-[#F3F4F6]">
                    Trước
                  </button>
                  <button className="h-9 px-3 bg-[#EE0033] border border-[#EE0033] rounded-lg text-sm font-medium text-white">
                    1
                  </button>
                  {filteredData.length > 10 && (
                    <button className="h-9 px-3 border border-[#D1D5DB] rounded-lg text-sm font-medium text-[#374151] hover:bg-[#F3F4F6]">
                      2
                    </button>
                  )}
                  <button className="h-9 px-3 border border-[#D1D5DB] rounded-lg text-sm font-medium text-[#374151] hover:bg-[#F3F4F6]">
                    Sau
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CAM KẾT BỔ SUNG */}
          {activeTab === 'commitments' && permissions.canViewCommitments && (
            <div className="space-y-4">
              {/* Role-specific action bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-[#111827]">Danh sách cam kết bổ sung</h3>
                  {permissions.canCreateCommitment && (
                    <span className="text-xs text-[#6B7280]">
                      {userRole === 'accountant' ? '(Xem & theo dõi)' : '(Quản lý & phê duyệt)'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {permissions.canExportExcel && (
                    <button className="h-8 px-3 bg-[#F3F4F6] border border-[#D1D5DB] rounded-lg text-xs font-medium text-[#374151] hover:bg-[#E5E7EB] flex items-center gap-1.5">
                      <Download size={14} />
                      Xuất báo cáo
                    </button>
                  )}
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg p-4">
                  <div className="text-xs font-medium text-[#1E40AF] uppercase mb-1">Đang theo dõi</div>
                  <div className="text-2xl font-bold text-[#1E40AF]">{commitmentRecords.length}</div>
                </div>
                <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-lg p-4">
                  <div className="text-xs font-medium text-[#92400E] uppercase mb-1">Sắp đến hạn</div>
                  <div className="text-2xl font-bold text-[#D97706]">
                    {commitmentRecords.filter(r => r.commitment?.status === 'near-due').length}
                  </div>
                </div>
                <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-lg p-4">
                  <div className="text-xs font-medium text-[#991B1B] uppercase mb-1">Quá hạn</div>
                  <div className="text-2xl font-bold text-[#DC2626]">
                    {commitmentRecords.filter(r => r.commitment?.status === 'overdue').length}
                  </div>
                </div>
                <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-4">
                  <div className="text-xs font-medium text-[#065F46] uppercase mb-1">Đã hoàn thành</div>
                  <div className="text-2xl font-bold text-[#16A34A]">45</div>
                </div>
              </div>

              {/* Commitments Table */}
              <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">Mã CK</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">Mã ĐN</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">Người CK</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">Phòng</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">HS thiếu</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">Hạn</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">TT</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">Còn lại</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-[#6B7280] uppercase w-40">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {commitmentRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-[#F9FAFB]">
                          <td className="px-4 py-3 text-sm font-medium text-[#EE0033]">{record.commitment?.code}</td>
                          <td className="px-4 py-3 text-sm font-medium text-[#374151]">{record.requestCode}</td>
                          <td className="px-4 py-3 text-sm text-[#374151]">{record.creator}</td>
                          <td className="px-4 py-3 text-sm text-[#6B7280]">{record.department}</td>
                          <td className="px-4 py-3">
                            <div className="text-xs text-[#6B7280]">
                              {record.legalStatus.completed}/{record.legalStatus.total} hồ sơ
                              <div className="text-[#9CA3AF] mt-1">Đang bổ sung</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#374151]">{record.commitment?.deadline}</td>
                          <td className="px-4 py-3">
                            {record.commitment?.status === 'overdue' ? (
                              <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-medium bg-[#FEE2E2] text-[#991B1B]">
                                <AlertTriangle size={12} />
                                Quá hạn
                              </span>
                            ) : record.commitment?.status === 'near-due' ? (
                              <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#92400E]">
                                <Clock size={12} />
                                Sắp hạn
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-medium bg-[#DBEAFE] text-[#1E40AF]">
                                <Activity size={12} />
                                Theo dõi
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-medium ${
                              (record.commitment?.daysRemaining || 0) < 0 ? 'text-[#DC2626]' :
                              (record.commitment?.daysRemaining || 0) <= 5 ? 'text-[#D97706]' :
                              'text-[#6B7280]'
                            }`}>
                              {(record.commitment?.daysRemaining || 0) < 0 ? `Quá ${Math.abs(record.commitment?.daysRemaining || 0)} ngày` : `${record.commitment?.daysRemaining} ngày`}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {/* View details - all roles */}
                              <button className="h-7 px-2 text-xs font-medium text-[#EE0033] hover:bg-[#FFF1F3] rounded transition-colors">
                                Chi tiết
                              </button>

                              {/* Accountant: Send reminder */}
                              {userRole === 'accountant' && (
                                <button
                                  className="h-7 px-2 text-xs font-medium text-[#D97706] bg-[#FFFBEB] hover:bg-[#FEF3C7] rounded transition-colors flex items-center gap-1"
                                  title="Nhắc nhở bổ sung"
                                >
                                  <Send size={12} />
                                </button>
                              )}

                              {/* Director/Admin: Extend deadline */}
                              {permissions.canExtendDeadline && (
                                <button
                                  onClick={() => setShowExtendModal(true)}
                                  className="h-7 px-2 text-xs font-medium text-[#1D4ED8] bg-[#EFF6FF] hover:bg-[#DBEAFE] rounded transition-colors flex items-center gap-1"
                                  title="Gia hạn"
                                >
                                  <RotateCcw size={12} />
                                </button>
                              )}

                              {/* Director/Admin: Approve/Reject */}
                              {permissions.canApproveCommitment && record.commitment?.status === 'overdue' && (
                                <>
                                  <button
                                    className="h-7 px-2 text-xs font-medium text-[#065F46] bg-[#ECFDF5] hover:bg-[#D1FAE5] rounded transition-colors"
                                    title="Chấp nhận"
                                  >
                                    <CheckCircle size={12} />
                                  </button>
                                  <button
                                    className="h-7 px-2 text-xs font-medium text-[#991B1B] bg-[#FEF2F2] hover:bg-[#FEE2E2] rounded transition-colors"
                                    title="Từ chối"
                                  >
                                    <XCircle size={12} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Accountant note */}
              {userRole === 'accountant' && (
                <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg p-3 flex items-center gap-2">
                  <Info size={16} className="text-[#1E40AF] flex-shrink-0" />
                  <span className="text-xs text-[#1E40AF]">
                    Bạn có quyền theo dõi và nhắc nhở bổ sung hồ sơ. Để gia hạn cam kết hoặc phê duyệt, vui lòng liên hệ Giám đốc.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BÁO CÁO TUÂN THỦ */}
          {activeTab === 'compliance' && permissions.canViewCompliance && (
            <div className="space-y-6">
              {/* Director/Admin: Approval actions */}
              {permissions.canApproveCompliance && (
                <div className="flex items-center justify-between bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <UserCheck size={20} className="text-[#EE0033]" />
                    <div>
                      <div className="text-sm font-medium text-[#111827]">Phê duyệt báo cáo tuân thủ</div>
                      <div className="text-xs text-[#6B7280]">Báo cáo tháng 03/2026 đang chờ phê duyệt</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="h-9 px-4 bg-white border border-[#D1D5DB] rounded-lg text-sm font-medium text-[#374151] hover:bg-[#F3F4F6]">
                      Xem trước
                    </button>
                    <button className="h-9 px-4 bg-[#EE0033] rounded-lg text-sm font-medium text-white hover:bg-[#CC002B]">
                      Phê duyệt
                    </button>
                  </div>
                </div>
              )}

              {/* Compliance Gauge */}
              <div className="bg-gradient-to-br from-[#FFF1F3] to-white border border-[#E5E7EB] rounded-xl p-8 text-center">
                <div className="text-sm font-medium text-[#6B7280] uppercase mb-2">Tỷ lệ tuân thủ hồ sơ pháp lý</div>
                <div className="text-6xl font-bold text-[#EE0033] mb-2">{completePercentage}%</div>
                <div className="text-sm text-[#6B7280]">{completeCount}/{totalTracking} đề nghị đã đủ hồ sơ</div>
                <div className="mt-6 h-3 bg-[#E5E7EB] rounded-full overflow-hidden max-w-md mx-auto">
                  <div className="h-full bg-gradient-to-r from-[#DC2626] via-[#D97706] to-[#16A34A] rounded-full" style={{ width: `${completePercentage}%` }}></div>
                </div>
              </div>

              {/* Center Breakdown */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-[#111827]">Tuân thủ theo Trung tâm</h3>
                  {permissions.canExportComplianceReport && (
                    <button className="h-8 px-3 bg-[#F3F4F6] border border-[#D1D5DB] rounded-lg text-xs font-medium text-[#374151] hover:bg-[#E5E7EB] flex items-center gap-1.5">
                      <Download size={14} />
                      Xuất báo cáo
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'TT Khu vực 1', compliance: 92, total: 12, complete: 11 },
                    { name: 'TT Khu vực 2', compliance: 85, total: 13, complete: 11 },
                    { name: 'TT Khu vực 3', compliance: 78, total: 9, complete: 7 },
                    { name: 'TT Khu vực 4', compliance: 80, total: 5, complete: 4 },
                    { name: 'TT Khu vực 5', compliance: 67, total: 3, complete: 2 },
                    { name: 'TT Khu vực 6', compliance: 100, total: 2, complete: 2 },
                    { name: 'TT Khu vực 7', compliance: 75, total: 2, complete: 1 },
                    { name: 'TT Khu vực 8', compliance: 50, total: 2, complete: 1 }
                  ].map((center, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium text-[#374151]">{center.name}</div>
                      <div className="flex-1">
                        <div className="h-8 bg-[#F3F4F6] rounded-lg overflow-hidden relative">
                          <div
                            className="h-full transition-all rounded-lg"
                            style={{
                              width: `${center.compliance}%`,
                              backgroundColor: center.compliance >= 90 ? '#16A34A' :
                                center.compliance >= 75 ? '#D97706' : '#DC2626'
                            }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-[#111827]">
                            {center.compliance}% ({center.complete}/{center.total})
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Link to Full Report */}
              <div className="text-center">
                <button className="inline-flex items-center gap-2 h-10 px-6 bg-[#EE0033] rounded-lg text-sm font-medium text-white hover:bg-[#CC002B]">
                  Xem báo cáo đầy đủ
                  <ExternalLink size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PERMISSION SUMMARY FOOTER */}
      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Shield size={14} className="text-[#6B7280]" />
            <span className="text-xs font-medium text-[#6B7280]">Quyền hạn:</span>
          </div>
          {[
            { label: 'Xem dữ liệu', active: true },
            { label: permissions.viewAll ? 'Toàn công ty' : 'Cá nhân', active: true },
            { label: 'Tải lên hồ sơ', active: permissions.canUploadDocument },
            { label: 'Yêu cầu bổ sung', active: permissions.canRequestSupplement },
            { label: 'Gia hạn cam kết', active: permissions.canExtendDeadline },
            { label: 'Phê duyệt PL', active: permissions.canApproveCommitment },
            { label: 'Xuất Excel', active: permissions.canExportExcel },
            { label: 'Cấu hình', active: permissions.canConfigSystem },
          ].map((perm, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-medium ${
                perm.active
                  ? 'bg-[#D1FAE5] text-[#065F46]'
                  : 'bg-[#F3F4F6] text-[#9CA3AF] line-through'
              }`}
            >
              {perm.active ? <CheckCircle size={10} /> : <Lock size={10} />}
              {perm.label}
            </span>
          ))}
        </div>
      </div>

      {/* Upload Modal (simple placeholder) */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowUploadModal(false)}>
          <div className="bg-white rounded-xl w-[480px] max-w-[90vw] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#111827]">Tải lên hồ sơ bổ sung</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-[#6B7280] hover:text-[#374151]">
                <X size={20} />
              </button>
            </div>
            <div className="border-2 border-dashed border-[#D1D5DB] rounded-xl p-8 text-center mb-4">
              <Upload size={32} className="text-[#9CA3AF] mx-auto mb-3" />
              <div className="text-sm text-[#6B7280]">Kéo thả file vào đây hoặc</div>
              <button className="mt-2 h-9 px-4 bg-[#EE0033] rounded-lg text-sm font-medium text-white hover:bg-[#CC002B]">
                Chọn file
              </button>
              <div className="text-xs text-[#9CA3AF] mt-2">PDF, DOC, XLS, JPG (tối đa 10MB)</div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-sm text-[#6B7280] hover:text-[#374151]">
                Huỷ
              </button>
              <button className="px-4 py-2 bg-[#EE0033] rounded-lg text-sm font-medium text-white hover:bg-[#CC002B]">
                Tải lên
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Deadline Modal (Director/Admin only) */}
      {showExtendModal && permissions.canExtendDeadline && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowExtendModal(false)}>
          <div className="bg-white rounded-xl w-[480px] max-w-[90vw] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#111827]">Gia hạn cam kết bổ sung</h3>
              <button onClick={() => setShowExtendModal(false)} className="text-[#6B7280] hover:text-[#374151]">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#374151]">Số ngày gia hạn</label>
                <select className="w-full h-10 px-3 mt-1.5 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] bg-white">
                  <option>7 ngày</option>
                  <option>15 ngày</option>
                  <option>30 ngày</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#374151]">Lý do gia hạn</label>
                <textarea
                  className="w-full h-20 px-3 py-2 mt-1.5 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] resize-none"
                  placeholder="Nhập lý do gia hạn..."
                />
              </div>
              <div className="bg-[#FEF3C7] rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle size={16} className="text-[#D97706] flex-shrink-0 mt-0.5" />
                <span className="text-xs text-[#92400E]">
                  Gia hạn cam kết sẽ được ghi nhận trong lịch sử và thông báo cho nhân viên liên quan.
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setShowExtendModal(false)} className="px-4 py-2 text-sm text-[#6B7280] hover:text-[#374151]">
                Huỷ
              </button>
              <button
                onClick={() => setShowExtendModal(false)}
                className="px-4 py-2 bg-[#EE0033] rounded-lg text-sm font-medium text-white hover:bg-[#CC002B]"
              >
                Xác nhận gia hạn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}