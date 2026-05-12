import { Edit3 } from 'lucide-react';

interface SignatureSetupButtonProps {
  hasSignature?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'compact';
}

export default function SignatureSetupButton({
  hasSignature = false,
  onClick,
  variant = 'default'
}: SignatureSetupButtonProps) {
  
  const buttonHeight = variant === 'compact' ? 'h-9' : 'h-11';
  const textSize = variant === 'compact' ? 'text-xs' : 'text-sm';
  const iconSize = variant === 'compact' ? 14 : 16;

  if (hasSignature) {
    // User already has signature - show "Change" button (outline style)
    return (
      <button
        onClick={onClick}
        className={`${buttonHeight} px-4 bg-white border border-[#D1D5DB] text-[#374151] ${textSize} font-medium rounded-lg hover:bg-[#F3F4F6] hover:border-[#9CA3AF] transition-all flex items-center gap-2`}
      >
        <Edit3 size={iconSize} />
        Thay đổi chữ ký
      </button>
    );
  }

  // User doesn't have signature - show "Setup Now" button with pulse animation
  return (
    <button
      onClick={onClick}
      className={`${buttonHeight} px-4 bg-[#DC2626] text-white ${textSize} font-semibold rounded-lg hover:bg-[#B91C1C] transition-all flex items-center gap-2 relative animate-pulse-slow`}
      style={{
        animation: 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }}
    >
      <Edit3 size={iconSize} />
      Thiết lập chữ ký ngay
      <style>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.85;
          }
        }
      `}</style>
    </button>
  );
}
