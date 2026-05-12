import { useState, useEffect } from 'react';
import {
  LayoutDashboard, FileText, CheckSquare, Calendar, FileSpreadsheet,
  Users, Settings as SettingsIcon, Bell, HelpCircle, LogOut, User,
  ChevronDown, X, CheckCircle, XCircle, AlertTriangle, Menu, Shield,
  Zap, Database, Home, Sun, Moon, BarChart3, MoreHorizontal, ShieldCheck, Eye, XIcon, Download, Layers, FileSignature
} from 'lucide-react';
import { useIsMobile } from './components/ui/use-mobile';
import InvoiceListRoleBased from './components/InvoiceListRoleBased';
import DashboardCompany from './components/DashboardCompany';
import DashboardEmployee from './components/DashboardEmployee';
import DashboardManager from './components/DashboardManager';
import AccountingVFS from './components/AccountingVFS';
import CreateInvoiceRoleBased from './components/CreateInvoiceRoleBased';
import CreateInvoiceForm from './components/CreateInvoiceForm';
import Approval from './components/Approval';
import LegalTracking from './components/LegalTracking';
import Settings from './components/Settings';
import UserProfile from './components/UserProfile';
import FirstTimeSignatureSetup from './components/FirstTimeSignatureSetup';
import FirstTimeSignatureSetupDemo from './components/FirstTimeSignatureSetupDemo';
import { useMasterInvoiceData } from './data/masterInvoiceData';
import { getInvoiceStatusBadge, getLegalStatusIcon } from './components/StatusBadges';
import Monitoring from './components/Monitoring';
import Reports from './components/Reports';
import NotificationCenter from './components/NotificationCenter';
import SignatureShowcase from './components/SignatureShowcase';
import WireframeNavigation from './components/WireframeNavigation';
import ScreenMap from './components/ScreenMap';
import InvoiceExport from './components/InvoiceExport';
import InvoiceTypeManagement from './components/InvoiceTypeManagement';
import ContractManagement from './components/ContractManagement';
import { useAuth } from '../lib/auth/AuthProvider';
import { useNotifications, useUnreadNotificationCount } from '../lib/api/queries';
import { useActiveNav } from './useActiveNav';

// Demo role switcher is hidden in real auth flows; enable via VITE_ENABLE_DEMO_ROLE_SWITCHER=true
const SHOW_DEMO_ROLE_SWITCHER = import.meta.env.VITE_ENABLE_DEMO_ROLE_SWITCHER === 'true';

function NotificationDropdown({ isOpen, onClose, notifications, onViewAll }: any) {
  if (!isOpen) return null;
  
  return (
    <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-[#E5E7EB] rounded-xl shadow-xl z-50 max-h-[500px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#E5E7EB]">
        <h3 className="text-sm font-semibold text-[#111827]">Thông báo</h3>
      </div>
      
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {notifications.slice(0, 5).map((notif: any) => (
          <div key={notif.id} className="p-4 border-b border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer">
            <div className="text-sm font-medium text-[#111827]">{notif.title}</div>
            <div className="text-xs text-[#6B7280] mt-1">{notif.message}</div>
            <div className="text-xs text-[#9CA3AF] mt-1">{notif.time}</div>
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-[#E5E7EB]">
        <button 
          onClick={onViewAll}
          className="w-full text-sm text-[#EE0033] font-medium hover:underline"
        >
          Xem tất cả thông báo
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { MASTER_INVOICE_DATA, getPendingApprovals } = useMasterInvoiceData();
  const { data: notificationData } = useNotifications({ per_page: 10 });
  const { count: unreadNotificationCount } = useUnreadNotificationCount();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeNav, setActiveNav] = useActiveNav();
  const [filterExpanded, setFilterExpanded] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [showWireframeNav, setShowWireframeNav] = useState(true); // Show wireframe navigation by default

  // Form state testing
  const [formStatus, setFormStatus] = useState<'draft' | 'pending' | 'approved' | 'rejected' | 'returned' | 'issued'>('draft');
  const [formIsOwner, setFormIsOwner] = useState(true);

  // Auth wiring — user/role come from backend (no more hardcoded values)
  const auth = useAuth();

  // User role and data scope state — initialized from auth, kept in local state for the demo role switcher
  const [userRole, setUserRole] = useState<'employee' | 'manager' | 'accountant' | 'director' | 'admin'>(auth.primaryRole);
  const [dataFilter, setDataFilter] = useState<string>('company-wide');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  // Sync local userRole with backend role when auth.user changes (login / refresh)
  useEffect(() => {
    setUserRole(auth.primaryRole);
  }, [auth.primaryRole]);

  // Current user derived from backend user payload
  const currentUser = {
    name: auth.user?.name ?? '—',
    role: userRole,
    department: auth.user?.department?.name ?? auth.user?.revenue_center?.name ?? '—',
    title: auth.user?.department?.name ?? auth.user?.revenue_center?.name ?? '—',
  };
  
  // Calculate dynamic badge counts from master data
  const pendingRequestsCount = getPendingApprovals().length; // Count of "Đề nghị duyệt" status
  const pendingApprovalsCount = getPendingApprovals().length; // Same for now (would filter by user's role in real app)

  // Notifications & unread badge — driven by backend

  // Get breadcrumb based on active navigation
  const getBreadcrumb = () => {
    const breadcrumbMap: { [key: string]: string[] } = {
      'dashboard': ['Trang chủ', 'Tổng quan'],
      'invoices': currentRecordId ? ['Trang chủ', 'Đề nghị xuất HĐ', currentRecordId] : ['Trang chủ', 'Đề nghị xuất HĐ'],
      'export-invoices': ['Trang chủ', 'Xuất hóa đơn'],
      'contracts': ['Trang chủ', 'Quản lý Hợp đồng'],
      'invoice-types': ['Trang chủ', 'Quản lý Loại hóa đơn'],
      'approval': ['Trang chủ', 'Phê duyệt'],
      'legal': ['Trang chủ', 'Quản lý pháp lý'],
      'sinvoice': ['Trang chủ', 'S-Invoice'],
      'accounting': ['Trang chủ', 'Hạch toán VFS'],
      'reports': ['Trang chủ', 'Báo cáo'],
      'settings': ['Trang chủ', 'Cài đặt'],
      'profile': ['Trang chủ', 'Hồ sơ cá nhân'],
      'notifications': ['Trang chủ', 'Thông báo'],
      'screen-map': ['Trang chủ', 'Bản đồ màn hình'],
      'wireframe-nav': ['Trang chủ', 'Điều hướng Wireframe'],
    };
    return breadcrumbMap[activeNav] || ['Trang chủ'];
  };

  const breadcrumb = getBreadcrumb();

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = (index: number) => {
    if (index === 0) {
      setActiveNav('dashboard');
      setCurrentRecordId(null);
      setShowCreateInvoice(false);
    } else if (index === 1 && breadcrumb.length > 2) {
      // Navigate back to list view
      setCurrentRecordId(null);
      setShowCreateInvoice(false);
    }
  };

  // RBAC: Check if user has access to a page
  const hasAccess = (page: string): boolean => {
    const accessControl: Record<string, string[]> = {
      'dashboard': ['employee', 'manager', 'accountant', 'director', 'admin'],
      'invoices': ['employee', 'manager', 'accountant', 'director', 'admin'],
      'export-invoices': ['employee', 'manager', 'accountant', 'director', 'admin'],
      'contracts': ['employee', 'manager', 'accountant', 'director', 'admin'],
      'invoice-types': ['director', 'admin'],
      'approval': ['employee', 'manager', 'accountant', 'director', 'admin'],
      'legal': ['employee', 'manager', 'accountant', 'director', 'admin'],
      'sinvoice': ['accountant', 'director', 'admin'],
      'accounting': ['accountant', 'director', 'admin'],
      'reports': ['manager', 'accountant', 'director', 'admin'],
      'settings': ['director', 'admin'],
      'profile': ['employee', 'manager', 'accountant', 'director', 'admin'],
      'notifications': ['employee', 'manager', 'accountant', 'director', 'admin'],
      'screen-map': ['employee', 'manager', 'accountant', 'director', 'admin'],
      'wireframe-nav': ['employee', 'manager', 'accountant', 'director', 'admin'],
      'signature-showcase': ['employee', 'manager', 'accountant', 'director', 'admin'],
      'more': ['employee', 'manager', 'accountant', 'director', 'admin'],
    };

    return accessControl[page]?.includes(userRole) ?? true;
  };

  // RBAC: Redirect if user loses access when role changes
  useEffect(() => {
    if (!hasAccess(activeNav)) {
      setActiveNav('dashboard');
      setShowCreateInvoice(false);
      setCurrentRecordId(null);
    }
  }, [userRole]);

  // Role configurations
  const roleConfig = {
    employee: {
      label: 'Nhân viên',
      bgColor: '#F3F4F6',
      textColor: '#4B5563',
      dataScope: 'Cá nhân'
    },
    manager: {
      label: 'Quản lý',
      bgColor: '#FED7AA',
      textColor: '#C2410C',
      dataScope: currentUser.department
    },
    accountant: {
      label: 'Kế toán',
      bgColor: '#DBEAFE',
      textColor: '#1D4ED8',
      dataScope: 'Toàn công ty'
    },
    director: {
      label: 'Giám đốc',
      bgColor: '#FFF1F3',
      textColor: '#EE0033',
      dataScope: 'Toàn công ty'
    },
    admin: {
      label: 'Quản trị viên',
      bgColor: '#F3E8FF',
      textColor: '#7C3AED',
      dataScope: 'Toàn công ty'
    }
  };

  // Responsive breakpoint simulation
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Invoice list data
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

  // Chart data
  const barChartData = [
    { month: 'T8/2025', xuatHD: 35.2, dangXuLy: 8.5, choPheDuyet: 2.3, khac: 1.8 },
    { month: 'T9/2025', xuatHD: 38.7, dangXuLy: 6.2, choPheDuyet: 3.1, khac: 2.0 },
    { month: 'T10/2025', xuatHD: 42.1, dangXuLy: 7.8, choPheDuyet: 2.8, khac: 1.5 },
    { month: 'T11/2025', xuatHD: 39.5, dangXuLy: 9.2, choPheDuyet: 3.5, khac: 2.2 },
    { month: 'T12/2025', xuatHD: 44.8, dangXuLy: 6.9, choPheDuyet: 2.1, khac: 1.7 },
    { month: 'T1/2026', xuatHD: 45.2, dangXuLy: 8.3, choPheDuyet: 2.9, khac: 1.9 }
  ];

  const donutChartData = [
    { name: 'Đạt chuẩn', value: 62, color: '#16A34A' },
    { name: 'Thiếu 1-2 HS', value: 15, color: '#D97706' },
    { name: 'Đang xử lý', value: 13, color: '#94A3B8' },
    { name: 'Quá hạn', value: 10, color: '#DC2626' }
  ];

  // Recent requests data for dashboard
  const recentRequests = [
    { id: 'DN-2026-00145', customer: 'VNPT Hà Nội', amount: '2.450.000.000', creator: 'Nguyễn Văn A', status: 'pending', legal: 'complete', date: '13/03/2026' },
    { id: 'DN-2026-00144', customer: 'Viettel Construction', amount: '5.820.000.000', creator: 'Trần Thị B', status: 'approved', legal: 'complete', date: '13/03/2026' },
    { id: 'DN-2026-00143', customer: 'Tập đoàn Bưu chính', amount: '1.250.000.000', creator: 'Lê Văn C', status: 'issued', legal: 'missing', date: '12/03/2026' },
    { id: 'DN-2026-00142', customer: 'Viettel Telecom', amount: '8.900.000.000', creator: 'Phạm Thị D', status: 'approved', legal: 'complete', date: '12/03/2026' },
    { id: 'DN-2026-00141', customer: 'VNPT Vinaphone', amount: '3.150.000.000', creator: 'Hoàng Văn E', status: 'pending', legal: 'overdue', date: '11/03/2026' },
    { id: 'DN-2026-00140', customer: 'Viettel Global', amount: '12.400.000.000', creator: 'Đỗ Thị F', status: 'issued', legal: 'complete', date: '11/03/2026' },
    { id: 'DN-2026-00139', customer: 'Viettel High Tech', amount: '4.750.000.000', creator: 'Vũ Văn G', status: 'rejected', legal: 'missing', date: '10/03/2026' },
    { id: 'DN-2026-00138', customer: 'VNPT Technology', amount: '6.200.000.000', creator: 'Bùi Thị H', status: 'approved', legal: 'complete', date: '10/03/2026' }
  ];

  // Map backend notifications to the legacy shape consumed by NotificationDropdown
  const notifications = (notificationData?.data ?? []).map((n: any) => {
    const title =
      (typeof n.data === 'object' && (n.data.title || n.data.message)) ||
      n.type ||
      'Thông báo';
    const message =
      (typeof n.data === 'object' && (n.data.message || n.data.body || n.data.invoice_request_code)) ||
      '';
    return {
      id: n.id,
      type: (n.type?.toLowerCase().includes('approv')
        ? 'approval'
        : n.type?.toLowerCase().includes('legal')
          ? 'legal'
          : 'system') as 'approval' | 'legal' | 'system',
      title,
      message,
      time: n.created_at
        ? new Date(n.created_at).toLocaleString('vi-VN')
        : '',
      read: !!n.read_at,
    };
  });

  // Show onboarding screen if activeNav is 'onboarding'
  if (activeNav === 'onboarding') {
    return <FirstTimeSignatureSetup />;
  }

  return (
    <div className="h-screen overflow-hidden bg-[#F9FAFB]" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* DESKTOP & TABLET LAYOUT */}
      {viewport !== 'mobile' && (
        <div className="flex h-full">
          {/* LEFT SIDEBAR */}
          <aside 
            className={`hidden md:flex bg-white border-r border-[#E5E7EB] flex-col transition-all duration-300 ${
              viewport === 'tablet' || !sidebarExpanded ? 'w-16' : 'w-[260px]'
            }`}
          >
            {/* LOGO SECTION */}
            <div className="h-20 border-b border-[#E5E7EB] flex items-center px-6">
              {(viewport === 'desktop' && sidebarExpanded) ? (
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#EE0033] rounded flex items-center justify-center">
                      <span className="text-white font-bold text-sm">V</span>
                    </div>
                    <span className="font-semibold text-[#111827]">VTK</span>
                  </div>
                  <div className="text-[11px] text-[#6B7280] mt-1">Viettel Tech Services</div>
                </div>
              ) : (
                <div className="w-8 h-8 bg-[#EE0033] rounded flex items-center justify-center mx-auto">
                  <span className="text-white font-bold text-sm">V</span>
                </div>
              )}
            </div>

            {/* NAVIGATION */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
              <div className="space-y-1">
                {/* Tổng quan */}
                <button
                  onClick={() => setActiveNav('dashboard')}
                  className={`w-full h-12 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all ${
                    activeNav === 'dashboard'
                      ? 'bg-[#FFF1F3] text-[#EE0033] border-l-3 border-[#EE0033]'
                      : 'text-[#374151] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <LayoutDashboard size={20} className={activeNav === 'dashboard' ? 'text-[#EE0033]' : 'text-[#6B7280]'} />
                  {(viewport === 'desktop' && sidebarExpanded) && <span>Tổng quan</span>}
                </button>

                {/* Đề nghị xuất HĐ */}
                <button
                  onClick={() => setActiveNav('invoices')}
                  className={`w-full h-12 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all ${
                    activeNav === 'invoices'
                      ? 'bg-[#FFF1F3] text-[#EE0033] border-l-3 border-[#EE0033]'
                      : 'text-[#374151] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <FileText size={20} className={activeNav === 'invoices' ? 'text-[#EE0033]' : 'text-[#6B7280]'} />
                  {(viewport === 'desktop' && sidebarExpanded) && (
                    <>
                      <span className="flex-1 text-left">Đề nghị xuất HĐ</span>
                      <span className="w-5 h-5 rounded-full bg-[#EE0033] text-white text-[11px] font-semibold flex items-center justify-center">{pendingRequestsCount}</span>
                    </>
                  )}
                </button>

                {/* Xuất hóa đơn */}
                <button
                  onClick={() => setActiveNav('export-invoices')}
                  className={`w-full h-12 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all ${
                    activeNav === 'export-invoices'
                      ? 'bg-[#FFF1F3] text-[#EE0033] border-l-3 border-[#EE0033]'
                      : 'text-[#374151] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <Download size={20} className={activeNav === 'export-invoices' ? 'text-[#EE0033]' : 'text-[#6B7280]'} />
                  {(viewport === 'desktop' && sidebarExpanded) && <span>Xuất hóa đơn</span>}
                </button>

                {/* Quản lý Hợp đồng */}
                <button
                  onClick={() => setActiveNav('contracts')}
                  className={`w-full h-12 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all ${
                    activeNav === 'contracts'
                      ? 'bg-[#FFF1F3] text-[#EE0033] border-l-3 border-[#EE0033]'
                      : 'text-[#374151] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <FileSignature size={20} className={activeNav === 'contracts' ? 'text-[#EE0033]' : 'text-[#6B7280]'} />
                  {(viewport === 'desktop' && sidebarExpanded) && <span>Quản lý Hợp đồng</span>}
                </button>

                {/* Quản lý pháp lý - FLAT NAV ITEM */}
                {hasAccess('legal') && (
                <button
                  onClick={() => setActiveNav('legal')}
                  className={`w-full h-12 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all ${
                    activeNav === 'legal'
                      ? 'bg-[#FFF1F3] text-[#EE0033] border-l-3 border-[#EE0033]'
                      : 'text-[#374151] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <ShieldCheck size={20} className={activeNav === 'legal' ? 'text-[#EE0033]' : 'text-[#6B7280]'} />
                  {(viewport === 'desktop' && sidebarExpanded) && <span>{userRole === 'employee' ? 'Hồ sơ pháp lý của tôi' : 'Quản lý pháp lý'}</span>}
                </button>
                )}

                {/* Phê duyệt / Theo dõi duyệt phòng ban / Theo dõi duyệt */}
                {(userRole === 'accountant' || userRole === 'director' || userRole === 'admin') && (
                  <button
                    onClick={() => setActiveNav('approval')}
                    className={`w-full h-12 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all ${
                      activeNav === 'approval'
                        ? 'bg-[#FFF1F3] text-[#EE0033] border-l-3 border-[#EE0033]'
                        : 'text-[#374151] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    <CheckSquare size={20} className={activeNav === 'approval' ? 'text-[#EE0033]' : 'text-[#6B7280]'} />
                    {(viewport === 'desktop' && sidebarExpanded) && (
                      <>
                        <span className="flex-1 text-left">Phê duyệt</span>
                        <span className="w-5 h-5 rounded-full bg-[#EE0033] text-white text-[11px] font-semibold flex items-center justify-center">{pendingApprovalsCount}</span>
                      </>
                    )}
                  </button>
                )}

                {/* Manager: Department tracking view */}
                {userRole === 'manager' && (
                  <button
                    onClick={() => setActiveNav('approval')}
                    className={`w-full h-12 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all ${
                      activeNav === 'approval'
                        ? 'bg-[#FFF1F3] text-[#EE0033] border-l-3 border-[#EE0033]'
                        : 'text-[#374151] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    <Eye size={20} className={activeNav === 'approval' ? 'text-[#EE0033]' : 'text-[#6B7280]'} />
                    {(viewport === 'desktop' && sidebarExpanded) && (
                      <span className="flex-1 text-left">Theo dõi duyệt phòng ban</span>
                    )}
                  </button>
                )}

                {/* Employee: Tracking view only */}
                {userRole === 'employee' && (
                  <button
                    onClick={() => setActiveNav('approval')}
                    className={`w-full h-12 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all ${
                      activeNav === 'approval'
                        ? 'bg-[#FFF1F3] text-[#EE0033] border-l-3 border-[#EE0033]'
                        : 'text-[#374151] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    <Eye size={20} className={activeNav === 'approval' ? 'text-[#EE0033]' : 'text-[#6B7280]'} />
                    {(viewport === 'desktop' && sidebarExpanded) && (
                      <span className="flex-1 text-left">Theo dõi duyệt</span>
                    )}
                  </button>
                )}

                {/* S-Invoice */}
                {hasAccess('sinvoice') && (
                <button
                  onClick={() => setActiveNav('sinvoice')}
                  className={`w-full h-12 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all ${
                    activeNav === 'sinvoice'
                      ? 'bg-[#FFF1F3] text-[#EE0033] border-l-3 border-[#EE0033]'
                      : 'text-[#374151] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <Zap size={20} className={activeNav === 'sinvoice' ? 'text-[#EE0033]' : 'text-[#6B7280]'} />
                  {(viewport === 'desktop' && sidebarExpanded) && <span>S-Invoice</span>}
                </button>
                )}

                {/* Hạch toán VFS */}
                {hasAccess('accounting') && (
                <button
                  onClick={() => setActiveNav('accounting')}
                  className={`w-full h-12 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all ${
                    activeNav === 'accounting'
                      ? 'bg-[#FFF1F3] text-[#EE0033] border-l-3 border-[#EE0033]'
                      : 'text-[#374151] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <Database size={20} className={activeNav === 'accounting' ? 'text-[#EE0033]' : 'text-[#6B7280]'} />
                  {(viewport === 'desktop' && sidebarExpanded) && <span>Hạch toán VFS</span>}
                </button>
                )}

                {/* Báo cáo */}
                {hasAccess('reports') && (
                <button
                  onClick={() => setActiveNav('reports')}
                  className={`w-full h-12 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all ${
                    activeNav === 'reports'
                      ? 'bg-[#FFF1F3] text-[#EE0033] border-l-3 border-[#EE0033]'
                      : 'text-[#374151] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <BarChart3 size={20} className={activeNav === 'reports' ? 'text-[#EE0033]' : 'text-[#6B7280]'} />
                  {(viewport === 'desktop' && sidebarExpanded) && <span>Báo cáo</span>}
                </button>
                )}

                {/* DIVIDER */}
                <div className="h-px bg-[#E5E7EB] my-2"></div>

                {/* Quản lý Loại hóa đơn */}
                {hasAccess('invoice-types') && (
                <button
                  onClick={() => setActiveNav('invoice-types')}
                  className={`w-full h-12 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all ${
                    activeNav === 'invoice-types'
                      ? 'bg-[#FFF1F3] text-[#EE0033] border-l-3 border-[#EE0033]'
                      : 'text-[#374151] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <Layers size={20} className={activeNav === 'invoice-types' ? 'text-[#EE0033]' : 'text-[#6B7280]'} />
                  {(viewport === 'desktop' && sidebarExpanded) && <span>Quản lý Loại HĐ</span>}
                </button>
                )}

                {/* Cài đặt */}
                {hasAccess('settings') && (
                <button
                  onClick={() => setActiveNav('settings')}
                  className={`w-full h-12 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all ${
                    activeNav === 'settings'
                      ? 'bg-[#FFF1F3] text-[#EE0033] border-l-3 border-[#EE0033]'
                      : 'text-[#374151] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <SettingsIcon size={20} className={activeNav === 'settings' ? 'text-[#EE0033]' : 'text-[#6B7280]'} />
                  {(viewport === 'desktop' && sidebarExpanded) && <span>Cài đặt</span>}
                </button>
                )}
              </div>
            </nav>

            {/* USER SECTION */}
            {(viewport === 'desktop' && sidebarExpanded) ? (
              <button 
                onClick={() => setActiveNav('profile')}
                className="border-t border-[#E5E7EB] p-4 hover:bg-[#F9FAFB] transition-colors w-full text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#D1D5DB] flex items-center justify-center text-[#374151] text-sm font-medium flex-shrink-0">
                    {(currentUser.name || '?').trim().split(/\s+/).slice(-2).map(s => s[0]).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#111827] mb-1">{currentUser.name}</div>
                    <div 
                      className="inline-flex items-center h-5 px-2 rounded text-xs font-medium mb-1"
                      style={{ 
                        backgroundColor: roleConfig[userRole].bgColor, 
                        color: roleConfig[userRole].textColor 
                      }}
                    >
                      {roleConfig[userRole].label}
                    </div>
                    <div className="text-xs text-[#9CA3AF]">{currentUser.department}</div>
                  </div>
                </div>
              </button>
            ) : (
              <button 
                onClick={() => setActiveNav('profile')}
                className="border-t border-[#E5E7EB] p-2 flex justify-center hover:bg-[#F9FAFB] transition-colors w-full"
              >
                <div className="w-9 h-9 rounded-full bg-[#D1D5DB] flex items-center justify-center text-[#374151] text-sm font-medium">
                  NV
                </div>
              </button>
            )}

            {/* FOOTER */}
            <div className="border-t border-[#E5E7EB] px-4 py-3">
              {(viewport === 'desktop' && sidebarExpanded) ? (
                <div className="text-[11px] text-[#9CA3AF] text-center">
                  © 2026 Viettel VTK
                </div>
              ) : (
                <div className="text-[9px] text-[#9CA3AF] text-center">
                  2026
                </div>
              )}
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* TOP HEADER */}
            <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6">
              {/* Left: Breadcrumb */}
              <div className="flex items-center gap-3">
                {viewport === 'tablet' && (
                  <button 
                    onClick={() => setSidebarExpanded(!sidebarExpanded)}
                    className="p-2 hover:bg-[#F3F4F6] rounded-lg"
                  >
                    <Menu size={20} className="text-[#6B7280]" />
                  </button>
                )}
                <div className="hidden md:flex items-center gap-2 text-sm">
                  <Home size={16} className="text-[#6B7280]" />
                  <span className="text-[#9CA3AF]">/</span>
                  {breadcrumb.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span 
                        className={`${
                          index < breadcrumb.length - 1 
                            ? 'text-[#6B7280] cursor-pointer hover:text-[#EE0033] transition-colors' 
                            : 'text-[#374151] font-medium'
                        }`} 
                        onClick={() => index < breadcrumb.length - 1 ? handleBreadcrumbClick(index) : undefined}
                      >
                        {item}
                      </span>
                      {index < breadcrumb.length - 1 && <span className="text-[#9CA3AF]">/</span>}
                    </div>
                  ))}
                </div>
                {/* Mobile: Just logo */}
                <div className="flex md:hidden items-center gap-2">
                  <div className="w-6 h-6 bg-[#EE0033] rounded flex items-center justify-center">
                    <span className="text-white font-bold text-xs">V</span>
                  </div>
                  <span className="font-semibold text-[#111827] text-sm">VTK</span>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-4">
                {/* Data Scope Indicator */}
                <div className="hidden md:flex text-xs text-[#9CA3AF] items-center gap-1.5">
                  <Database size={14} className="text-[#9CA3AF]" />
                  <span>Dữ liệu: {roleConfig[userRole].dataScope}</span>
                </div>

                {/* Theme Toggle */}
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className="hidden md:block p-2 hover:bg-[#F3F4F6] rounded-lg transition-all duration-200"
                  title={darkMode ? "Chế độ sáng" : "Chế độ tối"}
                >
                  {darkMode ? (
                    <Sun size={20} className="text-[#6B7280] transition-all duration-200" />
                  ) : (
                    <Moon size={20} className="text-[#6B7280] transition-all duration-200" />
                  )}
                </button>

                {/* Notifications */}
                <div className="relative">
                  <button 
                    onClick={() => setNotificationOpen(!notificationOpen)}
                    className="p-2 hover:bg-[#F3F4F6] rounded-lg relative transition-colors"
                  >
                    <Bell size={20} className="text-[#6B7280]" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-[#EE0033] text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                        {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                      </span>
                    )}
                  </button>
                  <NotificationDropdown 
                    isOpen={notificationOpen}
                    onClose={() => setNotificationOpen(false)}
                    notifications={notifications}
                    onViewAll={() => setActiveNav('notifications')}
                  />
                </div>

                {/* User Avatar with Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="hidden md:flex items-center gap-2 hover:bg-[#F3F4F6] rounded-lg px-2 py-1.5 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#D1D5DB] flex items-center justify-center text-[#374151] text-xs font-medium">
                      {(currentUser.name || '?').trim().split(/\s+/).slice(-2).map(s => s[0]).join('').toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-[#374151]">{currentUser.name}</span>
                    <ChevronDown size={16} className={`text-[#6B7280] transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Mobile: Just avatar */}
                  <button 
                    onClick={() => setActiveNav('profile')}
                    className="flex md:hidden"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#D1D5DB] flex items-center justify-center text-[#374151] text-xs font-medium">
                      NV
                    </div>
                  </button>
                  
                  {/* User Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-[#E5E7EB] rounded-xl shadow-xl z-50">
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setActiveNav('profile');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#374151] hover:bg-[#F9FAFB] rounded-lg transition-colors"
                        >
                          <User size={16} className="text-[#6B7280]" />
                          <span>Hồ sơ cá nhân</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveNav('settings');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#374151] hover:bg-[#F9FAFB] rounded-lg transition-colors"
                        >
                          <FileText size={16} className="text-[#6B7280]" />
                          <span>Chữ ký của tôi</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveNav('settings');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#374151] hover:bg-[#F9FAFB] rounded-lg transition-colors"
                        >
                          <Bell size={16} className="text-[#6B7280]" />
                          <span>Cài đặt thông báo</span>
                        </button>
                        <div className="h-px bg-[#E5E7EB] my-1"></div>
                        <button
                        onClick={async () => {
                          setUserDropdownOpen(false);
                          await auth.logout();
                        }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#EE0033] hover:bg-[#FFF1F3] rounded-lg transition-colors"
                        >
                          <LogOut size={16} className="text-[#EE0033]" />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Viewport Switcher (Demo) */}
                <div className="ml-4 flex gap-1 border-l pl-4 border-[#E5E7EB]">
                  <button
                    onClick={() => setViewport('desktop')}
                    className={`px-2 py-1 text-xs rounded ${viewport === 'desktop' ? 'bg-[#EE0033] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}
                  >
                    Desktop
                  </button>
                  <button
                    onClick={() => setViewport('tablet')}
                    className={`px-2 py-1 text-xs rounded ${viewport === 'tablet' ? 'bg-[#EE0033] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}
                  >
                    Tablet
                  </button>
                  <button
                    onClick={() => setViewport('mobile')}
                    className={`px-2 py-1 text-xs rounded ${viewport === 'mobile' ? 'bg-[#EE0033] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}
                  >
                    Mobile
                  </button>
                </div>

                {/* Role Switcher (Demo) — gated by VITE_ENABLE_DEMO_ROLE_SWITCHER */}
                {SHOW_DEMO_ROLE_SWITCHER && (
                <div className="ml-4 flex gap-1 border-l pl-4 border-[#E5E7EB]">
                  <button
                    onClick={() => setUserRole('employee')}
                    className={`px-2 py-1 text-xs rounded ${userRole === 'employee' ? 'bg-[#4B5563] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}
                    title="Nhân viên - Dữ liệu Cá nhân"
                  >
                    NV
                  </button>
                  <button
                    onClick={() => setUserRole('manager')}
                    className={`px-2 py-1 text-xs rounded ${userRole === 'manager' ? 'bg-[#C2410C] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}
                    title="Quản lý - Dữ liệu TT Khu vực 3"
                  >
                    QL
                  </button>
                  <button
                    onClick={() => setUserRole('accountant')}
                    className={`px-2 py-1 text-xs rounded ${userRole === 'accountant' ? 'bg-[#1D4ED8] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}
                    title="Kế toán - Dữ liệu Toàn công ty"
                  >
                    KT
                  </button>
                  <button
                    onClick={() => setUserRole('director')}
                    className={`px-2 py-1 text-xs rounded ${userRole === 'director' ? 'bg-[#EE0033] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}
                    title="Giám đốc - Dữ liệu Toàn công ty"
                  >
                    GĐ
                  </button>
                  <button
                    onClick={() => setUserRole('admin')}
                    className={`px-2 py-1 text-xs rounded ${userRole === 'admin' ? 'bg-[#7C3AED] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}
                    title="Quản trị viên - Dữ liệu Toàn công ty"
                  >
                    QT
                  </button>
                </div>
                )}

                {/* Demo: Show Signature Setup */}
                <div className="ml-4 border-l pl-4 border-[#E5E7EB]">
                  <button
                    onClick={() => setActiveNav('onboarding')}
                    className="px-3 py-1.5 text-xs rounded bg-[#16A34A] text-white hover:bg-[#15803D] font-medium"
                    title="Demo: First-time Signature Setup"
                  >
                    🖋 Demo Chữ ký
                  </button>
                </div>
              </div>
            </header>

            {/* MAIN CONTENT */}
            <main className={`flex-1 bg-[#F9FAFB] p-6 ${activeNav === 'settings' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
              <div className={`max-w-[1440px] ${activeNav === 'settings' ? 'flex-1 min-h-0 flex flex-col' : ''}`}>
                {/* INVOICE LIST VIEW */}
                {activeNav === 'invoices' && (
                  <>
                    {showCreateInvoice ? (
                      <div className="space-y-4">
                        {/* Test controls */}
                        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 flex items-center gap-4 flex-wrap">
                          <div className="text-sm font-medium text-[#6B7280]">Test States:</div>
                          <div className="flex gap-2">
                            <button onClick={() => setFormStatus('draft')} className={`px-3 py-1 text-xs rounded ${formStatus === 'draft' ? 'bg-[#EE0033] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>Draft</button>
                            <button onClick={() => setFormStatus('pending')} className={`px-3 py-1 text-xs rounded ${formStatus === 'pending' ? 'bg-[#EE0033] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>Pending</button>
                            <button onClick={() => setFormStatus('approved')} className={`px-3 py-1 text-xs rounded ${formStatus === 'approved' ? 'bg-[#EE0033] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>Approved</button>
                            <button onClick={() => setFormStatus('rejected')} className={`px-3 py-1 text-xs rounded ${formStatus === 'rejected' ? 'bg-[#EE0033] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>Rejected</button>
                            <button onClick={() => setFormStatus('returned')} className={`px-3 py-1 text-xs rounded ${formStatus === 'returned' ? 'bg-[#EE0033] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>Returned</button>
                            <button onClick={() => setFormStatus('issued')} className={`px-3 py-1 text-xs rounded ${formStatus === 'issued' ? 'bg-[#EE0033] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>Issued</button>
                          </div>
                          <div className="h-6 w-px bg-[#E5E7EB]"></div>
                          <div className="flex gap-2">
                            <button onClick={() => setFormIsOwner(true)} className={`px-3 py-1 text-xs rounded ${formIsOwner ? 'bg-[#16A34A] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>Is Owner</button>
                            <button onClick={() => setFormIsOwner(false)} className={`px-3 py-1 text-xs rounded ${!formIsOwner ? 'bg-[#DC2626] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>Not Owner</button>
                          </div>
                        </div>

                        <CreateInvoiceRoleBased
                          onBack={() => setShowCreateInvoice(false)}
                          requestId="DN-2026-00156"
                          status={formStatus}
                          isOwner={formIsOwner}
                          userRole={userRole}
                          onNavigateToView={(view) => {
                            setShowCreateInvoice(false);
                            setActiveNav(view);
                          }}
                        />
                      </div>
                    ) : (
                      <InvoiceListRoleBased
                        getStatusBadge={getInvoiceStatusBadge}
                        getLegalIcon={getLegalStatusIcon}
                        onCreateNew={() => setShowCreateInvoice(true)}
                        userRole={userRole}
                      />
                    )}
                  </>
                )}

                {/* INVOICE EXPORT */}
                {activeNav === 'export-invoices' && (
                  <InvoiceExport userRole={userRole} />
                )}

                {/* CONTRACT MANAGEMENT */}
                {activeNav === 'contracts' && (
                  <ContractManagement userRole={userRole} />
                )}

                {/* INVOICE TYPE MANAGEMENT */}
                {activeNav === 'invoice-types' && (
                  <InvoiceTypeManagement userRole={userRole} />
                )}

                {/* APPROVAL VIEW */}
                {activeNav === 'approval' && (
                  <Approval userRole={userRole} />
                )}

                {/* LEGAL COMMITMENT TRACKING */}
                {activeNav === 'legal' && (
                  <LegalTracking userRole={userRole} />
                )}

                {/* VFS ACCOUNTING */}
                {activeNav === 'accounting' && (
                  <AccountingVFS viewport={viewport} />
                )}

                {/* MONITORING: S-INVOICE */}
                {activeNav === 'sinvoice' && (
                  <Monitoring initialTab="sinvoice" />
                )}

                {/* REPORTS & ANALYTICS */}
                {activeNav === 'reports' && (
                  <Reports userRole={userRole} />
                )}

                {/* SETTINGS & ADMIN */}
                {activeNav === 'settings' && (
                  <Settings userRole={userRole} />
                )}

                {/* NOTIFICATION CENTER */}
                {activeNav === 'notifications' && (
                  <NotificationCenter />
                )}

                {/* SIGNATURE SHOWCASE */}
                {activeNav === 'signature-showcase' && (
                  <SignatureShowcase />
                )}

                {/* Dashboard Content */}
                {activeNav === 'dashboard' && (
                  <>
                    {userRole === 'employee' && (
                      <DashboardEmployee getStatusBadge={getInvoiceStatusBadge} getLegalIcon={getLegalStatusIcon} />
                    )}
                    {userRole === 'manager' && (
                      <DashboardManager getStatusBadge={getInvoiceStatusBadge} getLegalIcon={getLegalStatusIcon} />
                    )}
                    {['accountant', 'director', 'admin'].includes(userRole) && (
                      <DashboardCompany getStatusBadge={getInvoiceStatusBadge} getLegalIcon={getLegalStatusIcon} userRole={userRole} />
                    )}
                  </>
                )}

                {/* USER PROFILE */}
                {activeNav === 'profile' && (
                  <UserProfile />
                )}

                {/* Screen Map */}
                {activeNav === 'screen-map' && (
                  <ScreenMap onNavigate={(page) => setActiveNav(page)} />
                )}

                {/* Wireframe Navigation */}
                {activeNav === 'wireframe-nav' && (
                  <WireframeNavigation 
                    currentPage={activeNav}
                    currentPageIndex={1}
                    totalPages={10}
                    onNavigate={(page) => setActiveNav(page)}
                  />
                )}
              </div>
            </main>
          </div>
        </div>
      )}

      {/* MOBILE LAYOUT */}
      {viewport === 'mobile' && (
        <div className="h-full flex flex-col w-[375px] mx-auto relative">
          {/* Mobile Header */}
          <header className="h-14 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 z-10">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} className="text-[#374151]" /> : <Menu size={24} className="text-[#374151]" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#EE0033] rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">V</span>
              </div>
              <span className="font-semibold text-[#111827] text-sm">VTK</span>
            </div>
            <button className="relative" onClick={() => { setActiveNav('notifications'); setMobileMenuOpen(false); }}>
              <Bell size={20} className="text-[#6B7280]" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EE0033] text-white text-[9px] font-semibold rounded-full flex items-center justify-center">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>
          </header>

          {/* Mobile Slide Menu */}
          {mobileMenuOpen && (
            <div className="absolute inset-0 z-50 flex" style={{ top: '56px', bottom: '56px' }}>
              <div className="w-[280px] bg-white border-r border-[#E5E7EB] h-full overflow-y-auto shadow-xl">
                {/* User Info */}
                <div className="p-4 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#D1D5DB] flex items-center justify-center text-[#374151] text-sm font-medium">
                      {(currentUser.name || '?').trim().split(/\s+/).slice(-2).map(s => s[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#111827]">{currentUser.name}</div>
                      <div 
                        className="inline-flex items-center h-5 px-2 rounded text-xs font-medium mt-1"
                        style={{ backgroundColor: roleConfig[userRole].bgColor, color: roleConfig[userRole].textColor }}
                      >
                        {roleConfig[userRole].label}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Items */}
                <nav className="p-3 space-y-1">
                  {[
                    { key: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={20} />, show: true },
                    { key: 'invoices', label: 'Đề nghị xuất HĐ', icon: <FileText size={20} />, show: true, badge: pendingRequestsCount },
                    { key: 'export-invoices', label: 'Xuất hóa đơn', icon: <Download size={20} />, show: true },
                    { key: 'contracts', label: 'Quản lý Hợp đồng', icon: <FileSignature size={20} />, show: true },
                    { key: 'invoice-types', label: 'Quản lý Loại HĐ', icon: <Layers size={20} />, show: hasAccess('invoice-types') },
                    { key: 'legal', label: userRole === 'employee' ? 'Hồ sơ pháp lý của tôi' : 'Quản lý pháp lý', icon: <ShieldCheck size={20} />, show: hasAccess('legal') },
                    { key: 'approval', label: userRole === 'employee' ? 'Theo dõi duyệt' : (userRole === 'manager' ? 'Theo dõi duyệt phòng ban' : 'Phê duyệt'), icon: (userRole === 'employee' || userRole === 'manager') ? <Eye size={20} /> : <CheckSquare size={20} />, show: true, badge: pendingApprovalsCount },
                    { key: 'sinvoice', label: 'S-Invoice', icon: <Zap size={20} />, show: hasAccess('sinvoice') },
                    { key: 'accounting', label: 'Hạch toán VFS', icon: <Database size={20} />, show: hasAccess('accounting') },
                    { key: 'reports', label: 'Báo cáo', icon: <BarChart3 size={20} />, show: hasAccess('reports') },
                    { key: 'settings', label: 'Cài đặt', icon: <SettingsIcon size={20} />, show: hasAccess('settings') },
                    { key: 'profile', label: 'Hồ sơ cá nhân', icon: <User size={20} />, show: true },
                    { key: 'screen-map', label: 'Bản đồ màn hình', icon: <Home size={20} />, show: true },
                  ].filter(item => item.show).map(item => (
                    <button
                      key={item.key}
                      onClick={() => { setActiveNav(item.key); setMobileMenuOpen(false); }}
                      className={`w-full h-11 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all ${
                        activeNav === item.key
                          ? 'bg-[#FFF1F3] text-[#EE0033]'
                          : 'text-[#374151] hover:bg-[#F3F4F6]'
                      }`}
                    >
                      <span className={activeNav === item.key ? 'text-[#EE0033]' : 'text-[#6B7280]'}>{item.icon}</span>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[#EE0033] text-white text-[11px] font-semibold flex items-center justify-center">{item.badge}</span>
                      )}
                    </button>
                  ))}
                </nav>

                {/* Role Switcher in Mobile Menu — gated by VITE_ENABLE_DEMO_ROLE_SWITCHER */}
                {SHOW_DEMO_ROLE_SWITCHER && (
                <div className="p-4 border-t border-[#E5E7EB]">
                  <div className="text-xs text-[#9CA3AF] mb-2">Chuyển vai trò (Demo)</div>
                  <div className="flex gap-2 flex-wrap">
                    {(['employee', 'manager', 'accountant', 'director', 'admin'] as const).map(role => (
                      <button
                        key={role}
                        onClick={() => setUserRole(role)}
                        className={`px-3 py-1.5 text-xs rounded-lg font-medium ${
                          userRole === role
                            ? 'text-white'
                            : 'bg-[#F3F4F6] text-[#6B7280]'
                        }`}
                        style={userRole === role ? { backgroundColor: roleConfig[role].textColor } : {}}
                      >
                        {roleConfig[role].label}
                      </button>
                    ))}
                  </div>
                </div>
                )}
              </div>
              {/* Overlay */}
              <div className="flex-1 bg-black/30" onClick={() => setMobileMenuOpen(false)} />
            </div>
          )}

          {/* Mobile Content - renders based on activeNav */}
          <main className="flex-1 overflow-y-auto bg-[#F9FAFB] p-4">
            {activeNav === 'dashboard' && (
              <>
                {userRole === 'employee' ? (
                  <DashboardEmployee getStatusBadge={getInvoiceStatusBadge} getLegalIcon={getLegalStatusIcon} />
                ) : (
                  <DashboardCompany getStatusBadge={getInvoiceStatusBadge} getLegalIcon={getLegalStatusIcon} userRole={userRole} />
                )}
              </>
            )}

            {activeNav === 'invoices' && (
              <>
                {showCreateInvoice ? (
                  <CreateInvoiceForm
                    onBack={() => setShowCreateInvoice(false)}
                    onCreated={() => setShowCreateInvoice(false)}
                    onSignatureRequired={() => {
                      setShowCreateInvoice(false);
                      setActiveNav('signature');
                    }}
                  />
                ) : (
                  <InvoiceListRoleBased
                    getStatusBadge={getInvoiceStatusBadge}
                    getLegalIcon={getLegalStatusIcon}
                    onCreateNew={() => setShowCreateInvoice(true)}
                    userRole={userRole}
                  />
                )}
              </>
            )}

            {activeNav === 'export-invoices' && <InvoiceExport userRole={userRole} />}
            {activeNav === 'contracts' && <ContractManagement userRole={userRole} />}
            {activeNav === 'invoice-types' && <InvoiceTypeManagement userRole={userRole} />}
            {activeNav === 'approval' && <Approval userRole={userRole} />}
            {activeNav === 'legal' && <LegalTracking userRole={userRole} />}
            {activeNav === 'sinvoice' && <Monitoring initialTab="sinvoice" />}
            {activeNav === 'accounting' && <AccountingVFS viewport={viewport} />}
            {activeNav === 'reports' && <Reports userRole={userRole} />}
            {activeNav === 'settings' && <Settings userRole={userRole} />}
            {activeNav === 'notifications' && <NotificationCenter />}
            {activeNav === 'profile' && <UserProfile />}
            {activeNav === 'screen-map' && <ScreenMap onNavigate={(page) => setActiveNav(page)} />}
            {activeNav === 'wireframe-nav' && (
              <WireframeNavigation 
                currentPage={activeNav}
                currentPageIndex={1}
                totalPages={10}
                onNavigate={(page) => setActiveNav(page)}
              />
            )}
            {activeNav === 'signature-showcase' && <SignatureShowcase />}

            {/* "More" page - shows additional nav options */}
            {activeNav === 'more' && (
              <div className="space-y-4">
                <h1 className="text-lg font-semibold text-[#111827]">Thêm</h1>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'export-invoices', label: 'Xuất HĐ', icon: <Download size={24} />, color: '#10B981', show: true },
                    { key: 'contracts', label: 'Hợp đồng', icon: <FileSignature size={24} />, color: '#3B82F6', show: true },
                    { key: 'invoice-types', label: 'Loại HĐ', icon: <Layers size={24} />, color: '#8B5CF6', show: hasAccess('invoice-types') },
                    { key: 'sinvoice', label: 'S-Invoice', icon: <Zap size={24} />, color: '#F59E0B', show: hasAccess('sinvoice') },
                    { key: 'accounting', label: 'Hạch toán VFS', icon: <Database size={24} />, color: '#3B82F6', show: hasAccess('accounting') },
                    { key: 'reports', label: 'Báo cáo', icon: <BarChart3 size={24} />, color: '#8B5CF6', show: hasAccess('reports') },
                    { key: 'settings', label: 'Cài đặt', icon: <SettingsIcon size={24} />, color: '#6B7280', show: hasAccess('settings') },
                    { key: 'profile', label: 'Hồ sơ', icon: <User size={24} />, color: '#10B981', show: true },
                    { key: 'screen-map', label: 'Bản đồ MH', icon: <Home size={24} />, color: '#EE0033', show: true },
                  ].filter(item => item.show).map(item => (
                    <button
                      key={item.key}
                      onClick={() => setActiveNav(item.key)}
                      className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                        {item.icon}
                      </div>
                      <span className="text-xs font-medium text-[#374151] text-center">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* MOBILE BOTTOM TAB BAR */}
          <nav className="h-14 bg-white border-t border-[#E5E7EB] flex items-center justify-around px-2 z-10">
            <button 
              onClick={() => setActiveNav('dashboard')}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-3 ${
                activeNav === 'dashboard' ? 'text-[#EE0033]' : 'text-[#6B7280]'
              }`}
            >
              <LayoutDashboard size={20} />
              <span className="text-[10px] font-medium">Tổng quan</span>
            </button>
            <button 
              onClick={() => setActiveNav('invoices')}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-3 relative ${
                activeNav === 'invoices' ? 'text-[#EE0033]' : 'text-[#6B7280]'
              }`}
            >
              <FileText size={20} />
              <span className="text-[10px] font-medium">Đề nghị</span>
              {pendingRequestsCount > 0 && (
                <span className="absolute top-1 right-1 w-3 h-3 bg-[#EE0033] text-white text-[8px] font-semibold rounded-full flex items-center justify-center">
                  {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveNav('legal')}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-3 ${
                activeNav === 'legal' ? 'text-[#EE0033]' : 'text-[#6B7280]'
              }`}
            >
              <ShieldCheck size={20} />
              <span className="text-[10px] font-medium">{userRole === 'employee' ? 'Hồ sơ PL' : 'Pháp lý'}</span>
            </button>
            <button 
              onClick={() => setActiveNav('approval')}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-3 relative ${
                activeNav === 'approval' ? 'text-[#EE0033]' : 'text-[#6B7280]'
              }`}
            >
              {(userRole === 'employee' || userRole === 'manager') ? <Eye size={20} /> : <CheckSquare size={20} />}
              <span className="text-[10px] font-medium">{userRole === 'employee' ? 'Theo dõi' : (userRole === 'manager' ? 'Duyệt PB' : 'Phê duyệt')}</span>
              {pendingApprovalsCount > 0 && (
                <span className="absolute top-1 right-1 w-3 h-3 bg-[#EE0033] text-white text-[8px] font-semibold rounded-full flex items-center justify-center">
                  {pendingApprovalsCount > 9 ? '9+' : pendingApprovalsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveNav('more')}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-3 ${
                ['more', 'export-invoices', 'contracts', 'invoice-types', 'sinvoice', 'accounting', 'reports', 'settings', 'profile', 'screen-map', 'notifications'].includes(activeNav) ? 'text-[#EE0033]' : 'text-[#6B7280]'
              }`}
            >
              <MoreHorizontal size={20} />
              <span className="text-[10px] font-medium">Thêm</span>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}