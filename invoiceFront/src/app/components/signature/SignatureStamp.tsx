import { Lock } from 'lucide-react';

interface SignatureStampProps {
  signatureUrl?: string;
  width?: number;
  height?: number;
}

export default function SignatureStamp({
  signatureUrl,
  width = 120,
  height = 35
}: SignatureStampProps) {
  return (
    <div
      className="relative bg-[#F9FAFB] border border-[#E5E7EB] rounded-md p-1 flex items-center justify-center"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {signatureUrl ? (
        <img
          src={signatureUrl}
          alt="Chữ ký"
          className="max-w-full max-h-full object-contain"
        />
      ) : (
        <div className="text-[10px] text-[#9CA3AF] italic">Chữ ký</div>
      )}
      <div className="absolute bottom-0.5 right-0.5">
        <div className="w-2.5 h-2.5 rounded-full bg-[#D1D5DB] flex items-center justify-center opacity-30">
          <Lock size={6} className="text-[#6B7280]" />
        </div>
      </div>
    </div>
  );
}
