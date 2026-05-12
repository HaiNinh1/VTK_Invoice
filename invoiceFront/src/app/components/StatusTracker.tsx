import { CheckCircle, Circle, XCircle, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { InvoiceRequest } from '../data/masterInvoiceData';

interface StatusTrackerProps {
  record: InvoiceRequest;
}

interface Step {
  id: number;
  label: string;
  status: 'complete' | 'current' | 'pending' | 'error';
  sublabel?: string;
  errorMessage?: string;
}

export default function StatusTracker({ record }: StatusTrackerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Determine steps based on record status
  const getSteps = (): Step[] => {
    const steps: Step[] = [];

    // Step 1: Tạo ĐN - Always complete if record exists
    steps.push({
      id: 1,
      label: 'Tạo ĐN',
      status: 'complete'
    });

    // Step 2: Gửi duyệt
    if (record.status === 'draft') {
      steps.push({
        id: 2,
        label: 'Gửi duyệt',
        status: 'current',
        sublabel: 'Đang soạn thảo'
      });
    } else {
      steps.push({
        id: 2,
        label: 'Gửi duyệt',
        status: 'complete'
      });
    }

    // Step 3: KT duyệt
    if (record.status === 'draft') {
      steps.push({
        id: 3,
        label: 'KT soát xét',
        status: 'pending'
      });
    } else if (record.status === 'pending') {
      // Check if legal docs are insufficient
      if (record.legalStatus.status === 'insufficient' || record.legalStatus.status === 'overdue') {
        steps.push({
          id: 3,
          label: 'KT soát xét',
          status: 'current',
          sublabel: `Đang chờ — ${record.creator} (Kế toán)`
        });
      } else {
        steps.push({
          id: 3,
          label: 'KT soát xét',
          status: 'current',
          sublabel: `Đang xử lý — ${record.creator} (Kế toán)`
        });
      }
    } else if (record.status === 'rejected') {
      steps.push({
        id: 3,
        label: 'KT soát xét',
        status: 'error',
        sublabel: 'Đã từ chối',
        errorMessage: 'Đề nghị bị từ chối. Vui lòng xem lý do và chỉnh sửa.'
      });
    } else {
      steps.push({
        id: 3,
        label: 'KT duyệt',
        status: 'complete'
      });
    }

    // Step 4: S-Invoice
    if (record.status === 'draft' || record.status === 'pending') {
      steps.push({
        id: 4,
        label: 'S-Invoice',
        status: 'pending'
      });
    } else if (record.sInvoiceStatus === 'error') {
      steps.push({
        id: 4,
        label: 'S-Invoice LỖI',
        status: 'error',
        errorMessage: record.sInvoiceError || 'Lỗi không xác định'
      });
    } else if (record.sInvoiceStatus === 'pending') {
      steps.push({
        id: 4,
        label: 'S-Invoice',
        status: 'current',
        sublabel: 'Đang xử lý'
      });
    } else if (record.sInvoiceStatus === 'sent-to-cqt') {
      steps.push({
        id: 4,
        label: 'S-Invoice',
        status: 'complete',
        sublabel: `Mã: ${record.sInvoiceCode}`
      });
    } else if (record.sInvoiceStatus === 'completed') {
      steps.push({
        id: 4,
        label: 'S-Invoice',
        status: 'complete',
        sublabel: `Mã: ${record.sInvoiceCode}`
      });
    } else {
      steps.push({
        id: 4,
        label: 'S-Invoice',
        status: 'pending'
      });
    }

    // Step 5: VFS
    if (record.status === 'draft' || record.status === 'pending' || record.sInvoiceStatus === 'pending' || record.sInvoiceStatus === 'error') {
      steps.push({
        id: 5,
        label: 'VFS',
        status: 'pending'
      });
    } else if (record.vfsStatus === 'pending') {
      steps.push({
        id: 5,
        label: 'VFS',
        status: 'current',
        sublabel: 'Chờ hạch toán'
      });
    } else if (record.vfsStatus === 'processing') {
      steps.push({
        id: 5,
        label: 'VFS',
        status: 'current',
        sublabel: 'Đang hạch toán'
      });
    } else if (record.vfsStatus === 'completed') {
      steps.push({
        id: 5,
        label: 'VFS',
        status: 'complete'
      });
    } else {
      steps.push({
        id: 5,
        label: 'VFS',
        status: 'pending'
      });
    }

    // Step 6: Hoàn thành
    if (record.status === 'accounted' && record.vfsStatus === 'completed') {
      steps.push({
        id: 6,
        label: 'Hoàn thành',
        status: 'complete'
      });
    } else {
      steps.push({
        id: 6,
        label: 'Hoàn thành',
        status: 'pending'
      });
    }

    return steps;
  };

  const steps = getSteps();
  const hasError = steps.some(s => s.status === 'error');
  const isComplete = steps.every(s => s.status === 'complete');

  const getStepIcon = (step: Step) => {
    if (step.status === 'complete') {
      return <CheckCircle size={20} className="text-[#16A34A]" />;
    } else if (step.status === 'error') {
      return <XCircle size={20} className="text-[#DC2626]" />;
    } else if (step.status === 'current') {
      return (
        <div className="relative">
          <AlertCircle size={20} className="text-[#EE0033]" />
          <div className="absolute inset-0 rounded-full bg-[#EE0033] opacity-30 animate-pulse"></div>
        </div>
      );
    } else {
      return <Circle size={20} className="text-[#D1D5DB]" />;
    }
  };

  const getStepColor = (step: Step) => {
    if (step.status === 'complete') return '#16A34A';
    if (step.status === 'error') return '#DC2626';
    if (step.status === 'current') return '#EE0033';
    return '#D1D5DB';
  };

  if (isCollapsed) {
    return (
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-2 flex items-center justify-between cursor-pointer hover:bg-[#F9FAFB]" onClick={() => setIsCollapsed(false)}>
        <div className="flex items-center gap-3">
          <div className="text-xs font-medium text-[#6B7280] uppercase">Trạng thái xử lý</div>
          {isComplete ? (
            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-medium bg-[#ECFDF5] text-[#065F46]">
              <CheckCircle size={12} />
              Hoàn thành
            </span>
          ) : hasError ? (
            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-medium bg-[#FEE2E2] text-[#991B1B]">
              <XCircle size={12} />
              Có lỗi
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-medium bg-[#FFF1F3] text-[#EE0033]">
              <AlertCircle size={12} />
              Đang xử lý
            </span>
          )}
        </div>
        <ChevronDown size={16} className="text-[#6B7280]" />
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-[#E5E7EB]">
      {/* Header */}
      <div className="px-6 py-3 flex items-center justify-between border-b border-[#F3F4F6] cursor-pointer hover:bg-[#F9FAFB]" onClick={() => setIsCollapsed(true)}>
        <div className="text-xs font-medium text-[#6B7280] uppercase">Trạng thái xử lý</div>
        <ChevronUp size={16} className="text-[#6B7280]" />
      </div>

      {/* Stepper */}
      <div className="px-6 py-6">
        <div className="flex items-start justify-between relative">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center flex-1 relative">
              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div className="absolute top-2.5 left-1/2 w-full h-0.5 -z-10" style={{
                  backgroundColor: steps[index + 1].status === 'complete' ? '#16A34A' : '#E5E7EB'
                }}>
                </div>
              )}

              {/* Step Icon */}
              <div className="relative z-10 mb-2">
                {getStepIcon(step)}
              </div>

              {/* Step Label */}
              <div className="text-center">
                <div 
                  className="text-sm font-medium whitespace-nowrap mb-1"
                  style={{ color: getStepColor(step) }}
                >
                  {step.label}
                </div>

                {/* Sublabel */}
                {step.sublabel && (
                  <div className="text-xs text-[#6B7280] mt-1">
                    {step.sublabel}
                  </div>
                )}

                {/* Error Message */}
                {step.status === 'error' && step.errorMessage && (
                  <div className="mt-2 p-2 bg-[#FEF2F2] border border-[#FEE2E2] rounded-lg max-w-xs">
                    <div className="text-xs text-[#991B1B] mb-1.5">
                      Lỗi: {step.errorMessage}
                    </div>
                    <div className="flex gap-2">
                      <button className="text-xs font-medium text-[#EE0033] hover:text-[#CC002B]">
                        Xem chi tiết
                      </button>
                      <span className="text-xs text-[#D1D5DB]">•</span>
                      <button className="text-xs font-medium text-[#EE0033] hover:text-[#CC002B]">
                        Thử lại
                      </button>
                    </div>
                  </div>
                )}

                {/* Completion animation for final step */}
                {step.id === 6 && step.status === 'complete' && (
                  <div className="mt-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ECFDF5] border border-[#BBF7D0] rounded-full">
                      <CheckCircle size={14} className="text-[#16A34A] animate-pulse" />
                      <span className="text-xs font-medium text-[#065F46]">Đã hoàn thành</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
