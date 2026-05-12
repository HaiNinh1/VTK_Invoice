import { ChevronLeft, ChevronRight, Smartphone } from 'lucide-react';

interface WireframeNavigationProps {
  currentPage: string;
  currentPageIndex: number;
  totalPages: number;
  onNavigate: (page: string) => void;
}

const pages = [
  { id: 'dashboard', label: 'Tổng quan' },
  { id: 'invoices', label: 'Đề nghị' },
  { id: 'legal', label: 'Pháp lý' },
  { id: 'approval', label: 'Phê duyệt' },
  { id: 'sinvoice', label: 'S-Invoice' },
  { id: 'accounting', label: 'VFS' },
  { id: 'reports', label: 'Báo cáo' },
  { id: 'settings', label: 'Cài đặt' },
  { id: 'onboarding', label: 'Đăng nhập CK' },
];

export default function WireframeNavigation({
  currentPage,
  currentPageIndex,
  totalPages,
  onNavigate,
}: WireframeNavigationProps) {
  const currentIndex = pages.findIndex(p => p.id === currentPage);

  const handlePrev = () => {
    if (currentIndex > 0) {
      onNavigate(pages[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < pages.length - 1) {
      onNavigate(pages[currentIndex + 1].id);
    }
  };

  return (
    <div className="w-full h-12 bg-[#1F2937] rounded-t-lg flex items-center justify-between px-3 gap-3">
      {/* LEFT: Current Page Name */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-white font-semibold text-sm truncate">
          📄 {pages.find(p => p.id === currentPage)?.label?.toUpperCase() || 'TRANG'}
        </span>
      </div>

      {/* CENTER: Navigation Pills */}
      <div className="flex items-center gap-2 flex-1 justify-center overflow-x-auto">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => onNavigate(page.id)}
            className={`
              h-8 px-3 rounded-full text-[13px] font-medium whitespace-nowrap transition-all
              ${currentPage === page.id
                ? 'bg-[#DC2626] text-white shadow-sm'
                : 'bg-[#374151] text-[#D1D5DB] hover:bg-[#4B5563]'
              }
            `}
          >
            {page.label}
          </button>
        ))}
      </div>

      {/* RIGHT: Utility Buttons */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`
            w-8 h-8 rounded-full flex items-center justify-center transition-all
            ${currentIndex === 0
              ? 'bg-[#374151] text-[#6B7280] cursor-not-allowed opacity-50'
              : 'bg-[#4B5563] text-white hover:bg-[#6B7280]'
            }
          `}
          title="Trang trước"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentIndex === pages.length - 1}
          className={`
            w-8 h-8 rounded-full flex items-center justify-center transition-all
            ${currentIndex === pages.length - 1
              ? 'bg-[#374151] text-[#6B7280] cursor-not-allowed opacity-50'
              : 'bg-[#4B5563] text-white hover:bg-[#6B7280]'
            }
          `}
          title="Trang sau"
        >
          <ChevronRight size={16} />
        </button>

        {/* Mobile View Button (Placeholder) */}
        <button
          className="h-8 px-3 rounded-full bg-[#374151] text-[#D1D5DB] text-[13px] font-medium flex items-center gap-1.5 hover:bg-[#4B5563] transition-all"
          title="Xem phiên bản mobile"
        >
          <Smartphone size={14} />
          <span className="hidden sm:inline">Mobile</span>
        </button>

        {/* Frame Counter */}
        <div className="text-[#9CA3AF] text-[13px] font-medium ml-1">
          {currentPageIndex}/{totalPages}
        </div>
      </div>
    </div>
  );
}
