import { X, ArrowLeft, AlertTriangle, CheckCircle, Zap, Database, FileCheck } from 'lucide-react';

// Modal Close Button (top-right corner)
export function ModalCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center text-[#9CA3AF] hover:text-[#6B7280] transition-colors z-10"
      title="Đóng"
    >
      <X size={20} />
    </button>
  );
}

// Back to List Button (top-left in detail views)
export function BackToListButton({ onBack, label = "Quay lại danh sách" }: { onBack: () => void; label?: string }) {
  return (
    <button
      onClick={onBack}
      className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#EE0033] transition-colors mb-4"
    >
      <ArrowLeft size={16} />
      <span>{label}</span>
    </button>
  );
}

// Clickable Breadcrumb
interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

export function ClickableBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="flex items-center gap-2 text-sm mb-3">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="text-[#6B7280] hover:text-[#EE0033] transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-[#374151] font-medium">{item.label}</span>
          )}
          {index < items.length - 1 && <span className="text-[#9CA3AF]">/</span>}
        </div>
      ))}
    </div>
  );
}

// Quick Links Pills (jump to related views)
interface QuickLink {
  id: string;
  label: string;
  status: 'complete' | 'warning' | 'error' | 'pending';
  count?: string;
  onClick: () => void;
}

export function QuickLinksPills({ links, recordId }: { links: QuickLink[]; recordId: string }) {
  const getIcon = (id: string) => {
    switch (id) {
      case 'legal':
        return <FileCheck size={14} />;
      case 'sinvoice':
        return <Zap size={14} />;
      case 'vfs':
        return <Database size={14} />;
      case 'approval':
        return <CheckCircle size={14} />;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: QuickLink['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle size={14} className="text-[#16A34A]" />;
      case 'warning':
        return <AlertTriangle size={14} className="text-[#D97706]" />;
      case 'error':
        return <X size={14} className="text-[#DC2626]" />;
      case 'pending':
        return <span className="text-[#6B7280]">...</span>;
    }
  };

  const getStatusColor = (status: QuickLink['status']) => {
    switch (status) {
      case 'complete':
        return 'bg-[#F0FDF4] text-[#16A34A] border-[#86EFAC]';
      case 'warning':
        return 'bg-[#FFFBEB] text-[#D97706] border-[#FCD34D]';
      case 'error':
        return 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]';
      case 'pending':
        return 'bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB]';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs text-[#6B7280] font-medium">Xem trên:</span>
      {links.map((link) => (
        <button
          key={link.id}
          onClick={link.onClick}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
            hover:shadow-sm hover:-translate-y-0.5
            ${getStatusColor(link.status)}
          `}
          title={`Xem ${recordId} trên ${link.label}`}
        >
          {getIcon(link.id)}
          <span>{link.label}</span>
          {link.count && <span className="font-semibold">{link.count}</span>}
          {getStatusIcon(link.status)}
        </button>
      ))}
    </div>
  );
}

// Modal Footer Buttons
export function ModalFooterButtons({
  onClose,
  onConfirm,
  closeLabel = "Đóng",
  confirmLabel = "Xác nhận",
  confirmVariant = "primary",
  loading = false,
}: {
  onClose: () => void;
  onConfirm?: () => void;
  closeLabel?: string;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger' | 'success';
  loading?: boolean;
}) {
  const getConfirmClass = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'bg-[#DC2626] hover:bg-[#B91C1C] text-white';
      case 'success':
        return 'bg-[#16A34A] hover:bg-[#15803D] text-white';
      default:
        return 'bg-[#EE0033] hover:bg-[#CC0028] text-white';
    }
  };

  return (
    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
      <button
        onClick={onClose}
        disabled={loading}
        className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#374151] transition-colors disabled:opacity-50"
      >
        {closeLabel}
      </button>
      {onConfirm && (
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-50 ${getConfirmClass()}`}
        >
          {loading ? 'Đang xử lý...' : confirmLabel}
        </button>
      )}
    </div>
  );
}

// Detail View Header with all navigation helpers combined
export function DetailViewHeader({
  recordId,
  breadcrumbItems,
  quickLinks,
  onBack,
}: {
  recordId: string;
  breadcrumbItems: BreadcrumbItem[];
  quickLinks: QuickLink[];
  onBack: () => void;
}) {
  return (
    <div className="mb-6">
      <BackToListButton onBack={onBack} />
      <ClickableBreadcrumb items={breadcrumbItems} />
      <QuickLinksPills links={quickLinks} recordId={recordId} />
    </div>
  );
}
