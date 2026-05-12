import type { ReactNode } from 'react';
import { CheckCircle, AlertTriangle, XCircle, FileText, Loader } from 'lucide-react';
import React from 'react';

/**
 * GLOBAL STATUS BADGE DEFINITIONS
 * Use these exact definitions everywhere - NO VARIATIONS
 */

// ============================================================================
// INVOICE REQUEST STATUS BADGES
// ============================================================================

type InvoiceStatus = 'draft' | 'pending' | 'pending-vpgd' | 'approved' | 'issued' | 'accounted' | 'rejected' | 'returned';

const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, {
  text: string;
  bg: string;
  textColor: string;
  border?: string;
}> = {
  draft: {
    text: 'Nháp',
    bg: '#F3F4F6',
    textColor: '#6B7280',
  },
  pending: {
    text: 'Đề nghị duyệt',
    bg: '#FEF3C7',
    textColor: '#92400E',
  },
  'pending-vpgd': {
    text: 'Chờ duyệt VPGĐ',
    bg: '#FFF7ED',
    textColor: '#C2410C',
  },
  approved: {
    text: 'Đã duyệt',
    bg: '#DBEAFE',
    textColor: '#1E40AF',
  },
  issued: {
    text: 'Đã xuất HĐ',
    bg: '#D1FAE5',
    textColor: '#065F46',
  },
  accounted: {
    text: 'Đã hạch toán',
    bg: '#064E3B',
    textColor: '#FFFFFF',
  },
  rejected: {
    text: 'Từ chối',
    bg: '#FEE2E2',
    textColor: '#991B1B',
  },
  returned: {
    text: 'Trả lại bổ sung',
    bg: '#FEF3C7',
    textColor: '#92400E',
    border: '1px dashed #92400E',
  },
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const config = INVOICE_STATUS_CONFIG[status];
  
  if (!config) {
    console.warn(`Unknown invoice status: ${status}`);
    return null;
  }

  return (
    <span
      className="inline-flex items-center h-6 px-2.5 text-xs font-medium rounded-full whitespace-nowrap"
      style={{
        backgroundColor: config.bg,
        color: config.textColor,
        border: config.border,
      }}
    >
      {config.text}
    </span>
  );
}

// ============================================================================
// LEGAL STATUS ICONS
// ============================================================================

type LegalStatus = 'complete' | 'missing' | 'overdue' | 'committed';

interface LegalStatusConfig {
  icon: ReactNode;
  color: string;
  tooltip: string;
}

const LEGAL_STATUS_CONFIG: Record<LegalStatus, LegalStatusConfig> = {
  complete: {
    icon: <CheckCircle size={18} />,
    color: '#16A34A',
    tooltip: 'Đủ 11/11 hồ sơ pháp lý',
  },
  missing: {
    icon: <AlertTriangle size={18} />,
    color: '#D97706',
    tooltip: 'Thiếu 4 hồ sơ (7/11)',
  },
  overdue: {
    icon: <XCircle size={18} className="animate-pulse" />,
    color: '#DC2626',
    tooltip: 'Quá hạn bổ sung 5 ngày',
  },
  committed: {
    icon: <FileText size={18} />,
    color: '#7C3AED',
    tooltip: 'Có cam kết — hạn 30/04/2026',
  },
};

export function LegalStatusIcon({ 
  status, 
  customTooltip 
}: { 
  status: LegalStatus;
  customTooltip?: string;
}) {
  const config = LEGAL_STATUS_CONFIG[status];
  
  if (!config) {
    console.warn(`Unknown legal status: ${status}`);
    return null;
  }

  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div style={{ color: config.color }}>
        {config.icon}
      </div>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#111827] text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-50">
          {customTooltip || config.tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-[#111827] rotate-45"></div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// S-INVOICE STATUS BADGES
// ============================================================================

type SInvoiceStatus = 'pending' | 'processing' | 'issued' | 'sent_to_tax' | 'completed' | 'error';

const SINVOICE_STATUS_CONFIG: Record<SInvoiceStatus, {
  text: string;
  bg: string;
  textColor: string;
  icon?: ReactNode;
}> = {
  pending: {
    text: 'Chờ đẩy',
    bg: '#F3F4F6',
    textColor: '#6B7280',
  },
  processing: {
    text: 'Đang xử lý',
    bg: '#FEF3C7',
    textColor: '#92400E',
    icon: <Loader size={12} className="animate-spin" />,
  },
  issued: {
    text: 'Đã xuất HĐ',
    bg: '#DBEAFE',
    textColor: '#1E40AF',
  },
  sent_to_tax: {
    text: 'Đã gửi CQT',
    bg: '#CCFBF1',
    textColor: '#115E59',
  },
  completed: {
    text: 'Hoàn thành',
    bg: '#D1FAE5',
    textColor: '#065F46',
    icon: <CheckCircle size={12} />,
  },
  error: {
    text: 'Lỗi',
    bg: '#FEE2E2',
    textColor: '#991B1B',
    icon: <AlertTriangle size={12} />,
  },
};

export function SInvoiceStatusBadge({ status }: { status: SInvoiceStatus }) {
  const config = SINVOICE_STATUS_CONFIG[status];
  
  if (!config) {
    console.warn(`Unknown S-Invoice status: ${status}`);
    return null;
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-medium rounded-full whitespace-nowrap"
      style={{
        backgroundColor: config.bg,
        color: config.textColor,
      }}
    >
      {config.icon}
      {config.text}
    </span>
  );
}

// ============================================================================
// VFS STATUS BADGES
// ============================================================================

type VFSStatus = 'pending' | 'processing' | 'completed' | 'error';

const VFS_STATUS_CONFIG: Record<VFSStatus, {
  text: string;
  bg: string;
  textColor: string;
}> = {
  pending: {
    text: 'Chờ',
    bg: '#F3F4F6',
    textColor: '#6B7280',
  },
  processing: {
    text: 'Đang HT',
    bg: '#FEF3C7',
    textColor: '#92400E',
  },
  completed: {
    text: 'Đã HT',
    bg: '#D1FAE5',
    textColor: '#065F46',
  },
  error: {
    text: 'Lỗi',
    bg: '#FEE2E2',
    textColor: '#991B1B',
  },
};

export function VFSStatusBadge({ status }: { status: VFSStatus }) {
  const config = VFS_STATUS_CONFIG[status];
  
  if (!config) {
    console.warn(`Unknown VFS status: ${status}`);
    return null;
  }

  return (
    <span
      className="inline-flex items-center h-6 px-2.5 text-xs font-medium rounded-full whitespace-nowrap"
      style={{
        backgroundColor: config.bg,
        color: config.textColor,
      }}
    >
      {config.text}
    </span>
  );
}

// ============================================================================
// HELPER FUNCTIONS FOR BACKWARD COMPATIBILITY
// ============================================================================

/**
 * Get status badge as JSX element (for backward compatibility)
 */
export function getInvoiceStatusBadge(status: string): ReactNode {
  const statusMap: Record<string, InvoiceStatus> = {
    'draft': 'draft',
    'pending': 'pending',
    'pending-vpgd': 'pending-vpgd',
    'approved': 'approved',
    'issued': 'issued',
    'accounted': 'accounted',
    'rejected': 'rejected',
    'returned': 'returned',
  };

  const mappedStatus = statusMap[status] || 'draft';
  return <InvoiceStatusBadge status={mappedStatus} />;
}

/**
 * Get legal icon as JSX element (for backward compatibility)
 */
export function getLegalStatusIcon(status: string, customTooltip?: string): ReactNode {
  const statusMap: Record<string, LegalStatus> = {
    'complete': 'complete',
    'missing': 'missing',
    'overdue': 'overdue',
    'committed': 'committed',
  };

  const mappedStatus = statusMap[status] || 'complete';
  return <LegalStatusIcon status={mappedStatus} customTooltip={customTooltip} />;
}

/**
 * Get S-Invoice status badge as JSX element
 */
export function getSInvoiceStatusBadge(status: string): ReactNode {
  const statusMap: Record<string, SInvoiceStatus> = {
    'pending': 'pending',
    'processing': 'processing',
    'issued': 'issued',
    'sent_to_tax': 'sent_to_tax',
    'completed': 'completed',
    'error': 'error',
  };

  const mappedStatus = statusMap[status] || 'pending';
  return <SInvoiceStatusBadge status={mappedStatus} />;
}

/**
 * Get VFS status badge as JSX element
 */
export function getVFSStatusBadge(status: string): ReactNode {
  const statusMap: Record<string, VFSStatus> = {
    'pending': 'pending',
    'processing': 'processing',
    'completed': 'completed',
    'error': 'error',
  };

  const mappedStatus = statusMap[status] || 'pending';
  return <VFSStatusBadge status={mappedStatus} />;
}