import { Lock } from 'lucide-react';

interface SignaturePreviewProps {
  signatureUrl?: string;
  variant?: 'default' | 'with-info';
  signerName?: string;
  signerTitle?: string;
  signerDepartment?: string;
  timestamp?: string;
  width?: number;
  height?: number;
}

export default function SignaturePreview({
  signatureUrl,
  variant = 'default',
  signerName,
  signerTitle,
  signerDepartment,
  timestamp,
  width,
  height
}: SignaturePreviewProps) {
  // Default dimensions based on variant
  const defaultWidth = variant === 'with-info' ? 320 : 200;
  const defaultHeight = variant === 'with-info' ? 80 : 60;
  
  const finalWidth = width || defaultWidth;
  const finalHeight = height || defaultHeight;

  if (variant === 'with-info') {
    return (
      <div
        className="bg-white border border-[#E5E7EB] rounded-lg p-3 flex items-center gap-4"
        style={{ width: `${finalWidth}px`, height: `${finalHeight}px` }}
      >
        {/* Signature Image */}
        <div className="relative flex-shrink-0 w-[120px] h-[54px] bg-white border border-[#E5E7EB] rounded flex items-center justify-center">
          {signatureUrl ? (
            <img
              src={signatureUrl}
              alt="Chữ ký"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="text-xs text-[#9CA3AF] italic">Chữ ký</div>
          )}
          <div className="absolute bottom-1 right-1">
            <div className="w-3 h-3 rounded-full bg-[#D1D5DB] flex items-center justify-center opacity-40">
              <Lock size={8} className="text-[#6B7280]" />
            </div>
          </div>
        </div>

        {/* Signer Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[#111827] truncate">
            {signerName || 'Nguyễn Văn A'}
          </div>
          <div className="text-xs text-[#6B7280] truncate">
            {signerTitle || 'Kế toán viên'} — {signerDepartment || 'P. Tài chính'}
          </div>
          <div className="text-xs text-[#9CA3AF] mt-0.5">
            {timestamp || '13/03/2026 09:30:00'}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className="relative bg-white border border-[#E5E7EB] rounded-lg p-2 flex items-center justify-center"
      style={{ width: `${finalWidth}px`, height: `${finalHeight}px` }}
    >
      {signatureUrl ? (
        <img
          src={signatureUrl}
          alt="Chữ ký"
          className="max-w-full max-h-full object-contain"
        />
      ) : (
        <div className="text-xs text-[#9CA3AF] italic">Chữ ký</div>
      )}
      <div className="absolute bottom-1.5 right-1.5">
        <div className="w-3 h-3 rounded-full bg-[#D1D5DB] flex items-center justify-center opacity-40">
          <Lock size={8} className="text-[#6B7280]" />
        </div>
      </div>
    </div>
  );
}
