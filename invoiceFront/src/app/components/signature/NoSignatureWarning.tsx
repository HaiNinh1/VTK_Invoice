import { AlertTriangle, ArrowRight } from 'lucide-react';

interface NoSignatureWarningProps {
  variant?: 'inline' | 'card' | 'modal';
  onSetup?: () => void;
}

export default function NoSignatureWarning({
  variant = 'inline',
  onSetup
}: NoSignatureWarningProps) {
  
  // Inline variant: single line with warning + link
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-[#D97706]">
          <AlertTriangle size={14} />
          <span className="text-sm font-medium">Chưa có chữ ký</span>
        </div>
        <button
          onClick={onSetup}
          className="text-sm font-medium text-[#EE0033] hover:text-[#CC002B] flex items-center gap-1 transition-colors"
        >
          Thiết lập
          <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  // Card variant: amber background card with icon, message, and button
  if (variant === 'card') {
    return (
      <div
        className="bg-[#FFFBEB] border border-[#F59E0B] rounded-lg p-4 flex items-center gap-3"
        style={{ width: '320px', minHeight: '80px' }}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center">
          <AlertTriangle size={20} className="text-[#D97706]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[#92400E] mb-1">
            Chưa thiết lập chữ ký
          </div>
          <div className="text-xs text-[#92400E] mb-2">
            Bạn cần thiết lập chữ ký để thực hiện phê duyệt
          </div>
          <button
            onClick={onSetup}
            className="h-7 px-3 bg-[#F59E0B] text-white text-xs font-medium rounded hover:bg-[#D97706] transition-colors flex items-center gap-1.5"
          >
            Thiết lập ngay
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    );
  }

  // Modal blocker: displayed in confirmation modal, disables action
  if (variant === 'modal') {
    return (
      <div className="bg-[#FFFBEB] border border-[#F59E0B] rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FEF3C7] flex items-center justify-center">
            <AlertTriangle size={16} className="text-[#D97706]" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[#92400E] mb-1">
              Không thể thực hiện hành động
            </div>
            <div className="text-xs text-[#92400E] leading-relaxed mb-3">
              Bạn cần thiết lập chữ ký số trước khi có thể phê duyệt, từ chối hoặc tạo cam kết. 
              Chữ ký sẽ được tự động gắn vào tài liệu để xác thực.
            </div>
            <button
              onClick={onSetup}
              className="h-9 px-4 bg-[#EE0033] text-white text-sm font-medium rounded-lg hover:bg-[#CC002B] transition-colors flex items-center gap-2"
            >
              <AlertTriangle size={14} />
              Thiết lập chữ ký ngay
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
