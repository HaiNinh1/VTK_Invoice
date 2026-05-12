import * as React from 'react';
import { FileText, AlertCircle, RefreshCw, Filter as FilterIcon, Bell, CheckCircle, AlertTriangle, Clock, Lock, Edit3 } from 'lucide-react';

// SKELETON LOADERS
export const SkeletonStatCard = () => (
  <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 h-[140px] animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="w-10 h-10 rounded-full bg-[#E5E7EB]"></div>
      <div className="w-12 h-4 bg-[#E5E7EB] rounded"></div>
    </div>
    <div className="space-y-2">
      <div className="w-20 h-8 bg-[#E5E7EB] rounded"></div>
      <div className="w-32 h-3 bg-[#E5E7EB] rounded"></div>
    </div>
  </div>
);

export const SkeletonTableRow = () => (
  <tr className="border-b border-[#E5E7EB]">
    <td className="px-6 py-4"><div className="w-24 h-4 bg-[#E5E7EB] rounded animate-pulse"></div></td>
    <td className="px-6 py-4"><div className="w-32 h-4 bg-[#E5E7EB] rounded animate-pulse"></div></td>
    <td className="px-6 py-4"><div className="w-20 h-4 bg-[#E5E7EB] rounded animate-pulse"></div></td>
    <td className="px-6 py-4"><div className="w-20 h-4 bg-[#E5E7EB] rounded animate-pulse"></div></td>
    <td className="px-6 py-4"><div className="w-24 h-6 bg-[#E5E7EB] rounded-full animate-pulse"></div></td>
    <td className="px-6 py-4"><div className="w-16 h-4 bg-[#E5E7EB] rounded animate-pulse"></div></td>
  </tr>
);

export const SkeletonTable = ({ rows = 10 }: { rows?: number }) => (
  <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
    <div className="p-6 border-b border-[#E5E7EB]">
      <div className="w-48 h-6 bg-[#E5E7EB] rounded animate-pulse"></div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-[#F3F4F6]">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <th key={i} className="px-6 py-3">
                <div className="w-20 h-3 bg-[#D1D5DB] rounded animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const SkeletonChart = () => (
  <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
    <div className="w-48 h-6 bg-[#E5E7EB] rounded mb-4 animate-pulse"></div>
    <div className="w-full h-[280px] border-2 border-dashed border-[#E5E7EB] rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#E5E7EB] border-t-[#EE0033] rounded-full animate-spin mx-auto mb-3"></div>
        <div className="text-sm text-[#9CA3AF]">Đang tải biểu đồ...</div>
      </div>
    </div>
  </div>
);

export const SkeletonForm = () => (
  <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 space-y-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="animate-pulse">
        <div className="w-32 h-4 bg-[#E5E7EB] rounded mb-2"></div>
        <div className="w-full h-10 bg-[#F3F4F6] rounded border border-[#E5E7EB]"></div>
      </div>
    ))}
  </div>
);

// EMPTY STATES
export const EmptyInvoices = ({ onCreate }: { onCreate?: () => void }) => (
  <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-12 text-center">
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#F3F4F6] mb-6">
      <FileText size={40} className="text-[#9CA3AF]" />
    </div>
    <h3 className="text-xl font-semibold text-[#111827] mb-2">Chưa có đề nghị nào</h3>
    <p className="text-sm text-[#6B7280] mb-6 max-w-md mx-auto">
      Bạn chưa tạo đề nghị xuất hoá đơn nào. Hãy bắt đầu bằng cách tạo đề nghị mới.
    </p>
    {onCreate && (
      <button 
        onClick={onCreate}
        className="inline-flex items-center gap-2 h-10 px-6 bg-[#EE0033] text-white rounded-lg text-sm font-medium hover:bg-[#CC002B] transition-colors"
      >
        <FileText size={16} />
        Tạo đề nghị mới
      </button>
    )}
  </div>
);

export const EmptySearchResults = ({ onClearFilters }: { onClearFilters?: () => void }) => (
  <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-12 text-center">
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#F3F4F6] mb-6">
      <FilterIcon size={40} className="text-[#9CA3AF]" />
    </div>
    <h3 className="text-xl font-semibold text-[#111827] mb-2">Không tìm thấy kết quả</h3>
    <p className="text-sm text-[#6B7280] mb-6 max-w-md mx-auto">
      Không có đề nghị nào khớp với bộ lọc của bạn. Hãy thử điều chỉnh các tiêu chí tìm kiếm.
    </p>
    {onClearFilters && (
      <button 
        onClick={onClearFilters}
        className="inline-flex items-center gap-2 h-10 px-6 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F3F4F6] transition-colors"
      >
        <FilterIcon size={16} />
        Xoá bộ lọc
      </button>
    )}
  </div>
);

export const ErrorState = ({ message, onRetry }: { message?: string; onRetry?: () => void }) => (
  <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-12 text-center">
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#FEE2E2] mb-6">
      <AlertCircle size={40} className="text-[#DC2626]" />
    </div>
    <h3 className="text-xl font-semibold text-[#111827] mb-2">Đã có lỗi xảy ra</h3>
    <p className="text-sm text-[#6B7280] mb-6 max-w-md mx-auto">
      {message || 'Không thể tải dữ liệu. Vui lòng thử lại sau.'}
    </p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="inline-flex items-center gap-2 h-10 px-6 bg-[#EE0033] text-white rounded-lg text-sm font-medium hover:bg-[#CC002B] transition-colors"
      >
        <RefreshCw size={16} />
        Thử lại
      </button>
    )}
  </div>
);

// NOTIFICATION DROPDOWN
interface Notification {
  id: string;
  type: 'approval' | 'legal' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority?: 'high';
}

export const NotificationDropdown = ({ 
  isOpen, 
  onClose,
  notifications,
  onViewAll
}: { 
  isOpen: boolean; 
  onClose: () => void;
  notifications: Notification[];
  onViewAll?: () => void;
}) => {
  const [activeTab, setActiveTab] = React.useState<'all' | 'approval' | 'legal' | 'system'>('all');

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === activeTab);

  const getIcon = (type: Notification['type'], priority?: 'high') => {
    const isPriority = priority === 'high';
    
    switch (type) {
      case 'approval':
        return (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPriority ? 'bg-[#16A34A]' : 'bg-[#D1FAE5]'}`}>
            <CheckCircle size={16} className={isPriority ? 'text-white' : 'text-[#16A34A]'} strokeWidth={2.5} />
          </div>
        );
      case 'legal':
        return (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPriority ? 'bg-[#D97706]' : 'bg-[#FEF3C7]'}`}>
            <AlertTriangle size={16} className={isPriority ? 'text-white' : 'text-[#D97706]'} strokeWidth={2.5} />
          </div>
        );
      case 'system':
        return (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPriority ? 'bg-[#1D4ED8]' : 'bg-[#E5E7EB]'}`}>
            <Bell size={16} className={isPriority ? 'text-white' : 'text-[#6B7280]'} strokeWidth={2.5} />
          </div>
        );
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
      
      {/* Dropdown Panel */}
      <div className="absolute top-full right-0 mt-2 w-[380px] max-h-[480px] bg-white rounded-xl shadow-xl border border-[#E5E7EB] z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-[#111827] flex items-center gap-2">
            Thông báo
            {unreadCount > 0 && (
              <span className="text-sm font-medium text-[#EE0033]">({unreadCount} mới)</span>
            )}
          </h3>
          <button className="text-xs font-medium text-[#EE0033] hover:text-[#CC002B]">
            Đọc tất cả
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center border-b border-[#E5E7EB] bg-[#F9FAFB]">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 h-8 text-xs font-medium transition-colors ${
              activeTab === 'all'
                ? 'text-[#EE0033] bg-white border-b-2 border-[#EE0033]'
                : 'text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setActiveTab('approval')}
            className={`flex-1 h-8 text-xs font-medium transition-colors ${
              activeTab === 'approval'
                ? 'text-[#EE0033] bg-white border-b-2 border-[#EE0033]'
                : 'text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            Phê duyệt
          </button>
          <button
            onClick={() => setActiveTab('legal')}
            className={`flex-1 h-8 text-xs font-medium transition-colors ${
              activeTab === 'legal'
                ? 'text-[#EE0033] bg-white border-b-2 border-[#EE0033]'
                : 'text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            Pháp lý
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex-1 h-8 text-xs font-medium transition-colors ${
              activeTab === 'system'
                ? 'text-[#EE0033] bg-white border-b-2 border-[#EE0033]'
                : 'text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            Hệ thống
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell size={40} className="text-[#D1D5DB] mx-auto mb-3" />
              <p className="text-sm text-[#9CA3AF]">Không có thông báo mới</p>
            </div>
          ) : (
            <div>
              {filteredNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`px-4 py-3 border-b border-[#F3F4F6] hover:bg-[#F9FAFB] cursor-pointer transition-colors ${
                    !notification.read ? '' : ''
                  }`}
                  style={{ minHeight: '72px' }}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(notification.type, notification.priority)}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-medium text-[#111827] mb-0.5">
                        {notification.title}
                      </h4>
                      <p className="text-xs text-[#6B7280] mb-1">
                        {notification.message}
                      </p>
                      <span className="text-[11px] text-[#9CA3AF]">{notification.time}</span>
                    </div>
                    {!notification.read && (
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${
                        notification.priority === 'high' ? 'bg-[#EE0033]' : 'bg-[#1D4ED8]'
                      }`}></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#E5E7EB] bg-[#F9FAFB]">
          <button 
            onClick={() => {
              onViewAll?.();
              onClose();
            }}
            className="w-full text-center text-sm font-medium text-[#EE0033] hover:text-[#CC002B] py-1"
          >
            Xem tất cả thông báo →
          </button>
        </div>
      </div>
    </>
  );
};

// LOADING OVERLAY
export const LoadingOverlay = ({ message = 'Đang tải...' }: { message?: string }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-8 shadow-xl text-center">
      <div className="w-16 h-16 border-4 border-[#F3F4F6] border-t-[#EE0033] rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-sm font-medium text-[#374151]">{message}</p>
    </div>
  </div>
);

// LOADING SPINNER (Inline)
export const LoadingSpinner = ({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className={`${sizeClasses[size]} border-[#F3F4F6] border-t-[#EE0033] rounded-full animate-spin ${className}`}></div>
  );
};

// ============================================================
// SIGNATURE COMPONENTS
// ============================================================

// 1. SIGNATURE PREVIEW (read-only, used in approvals/commitments)
interface SignaturePreviewProps {
  signatureName: string;
  variant?: 'default' | 'with-info';
  userName?: string;
  userTitle?: string;
  signedAt?: string;
  className?: string;
}

export const SignaturePreview = ({ 
  signatureName, 
  variant = 'default',
  userName,
  userTitle,
  signedAt,
  className = ''
}: SignaturePreviewProps) => {
  if (variant === 'with-info') {
    return (
      <div className={`w-[320px] h-[80px] bg-white border border-[#E5E7EB] rounded-lg p-3 flex gap-4 ${className}`}>
        {/* Signature Image */}
        <div className="w-[140px] h-full bg-white border border-[#D1D5DB] rounded flex items-center justify-center flex-shrink-0 relative">
          <div className="text-[#374151] font-serif italic text-sm">{signatureName}</div>
          <Lock size={12} className="absolute bottom-1 right-1 text-[#D1D5DB]" />
        </div>
        
        {/* Signer Info */}
        <div className="flex-1 space-y-0.5">
          {userName && <div className="text-sm font-medium text-[#374151]">{userName}</div>}
          {userTitle && <div className="text-xs text-[#6B7280]">{userTitle}</div>}
          {signedAt && <div className="text-xs text-[#9CA3AF]">{signedAt}</div>}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`w-[200px] h-[60px] bg-white border border-[#E5E7EB] rounded-lg p-2 relative ${className}`}>
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-[#374151] font-serif italic text-sm">{signatureName}</div>
      </div>
      <Lock size={12} className="absolute bottom-1 right-1 text-[#D1D5DB]" />
    </div>
  );
};

// 2. SIGNATURE STAMP (used in timeline/audit trail)
interface SignatureStampProps {
  signatureName: string;
  className?: string;
}

export const SignatureStamp = ({ signatureName, className = '' }: SignatureStampProps) => {
  return (
    <div className={`inline-flex items-center gap-2 h-[35px] px-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-md ${className}`}>
      <div className="text-[#374151] font-serif italic text-xs">{signatureName}</div>
      <Lock size={10} className="text-[#9CA3AF]" />
    </div>
  );
};

// 3. NO-SIGNATURE WARNING
interface NoSignatureWarningProps {
  variant?: 'inline' | 'card' | 'modal';
  onSetup?: () => void;
  className?: string;
}

export const NoSignatureWarning = ({ 
  variant = 'inline',
  onSetup,
  className = ''
}: NoSignatureWarningProps) => {
  // Inline variant (single line)
  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-center gap-2 text-sm text-[#D97706] ${className}`}>
        <span>⚠ Chưa có chữ ký.</span>
        {onSetup && (
          <button 
            onClick={onSetup}
            className="font-medium underline hover:text-[#92400E]"
          >
            Thiết lập →
          </button>
        )}
      </div>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <div className={`w-[320px] bg-[#FFFBEB] border border-[#F59E0B] rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-[#D97706] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-[#92400E] mb-3">
              Bạn chưa thiết lập chữ ký số. Vui lòng thiết lập để có thể phê duyệt hoặc tạo cam kết.
            </p>
            {onSetup && (
              <button
                onClick={onSetup}
                className="h-9 px-4 bg-[#D97706] text-white rounded-lg text-sm font-medium hover:bg-[#B45309] flex items-center gap-2"
              >
                <Edit3 size={14} />
                Thiết lập ngay
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Modal blocker variant
  return (
    <div className={`bg-[#FFFBEB] border border-[#F59E0B] rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="text-[#D97706] flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-[#92400E] mb-1">Chưa thiết lập chữ ký</h4>
          <p className="text-sm text-[#92400E]">
            Bạn cần thiết lập chữ ký số trước khi thực hiện hành động này.
          </p>
        </div>
      </div>
    </div>
  );
};

// 4. SIGNATURE SETUP BUTTON
interface SignatureSetupButtonProps {
  hasSignature: boolean;
  onClick?: () => void;
  className?: string;
}

export const SignatureSetupButton = ({ 
  hasSignature, 
  onClick,
  className = ''
}: SignatureSetupButtonProps) => {
  if (hasSignature) {
    // Change signature button (outline)
    return (
      <button
        onClick={onClick}
        className={`h-10 px-6 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F3F4F6] flex items-center gap-2 transition-colors ${className}`}
      >
        <Edit3 size={16} />
        Thay đổi chữ ký
      </button>
    );
  }

  // Setup signature button (primary with pulse)
  return (
    <button
      onClick={onClick}
      className={`h-10 px-6 bg-[#DC2626] text-white rounded-lg text-sm font-medium hover:bg-[#B91C1C] flex items-center gap-2 transition-all animate-pulse ${className}`}
    >
      <Edit3 size={16} />
      Thiết lập chữ ký ngay
    </button>
  );
};