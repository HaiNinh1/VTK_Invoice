import { Check, AlertTriangle, Wrench, ArrowRight } from 'lucide-react';

interface ScreenMapProps {
  onNavigate: (page: string) => void;
}

interface ScreenCard {
  id: string;
  name: string;
  status: 'done' | 'progress' | 'missing';
  isNew?: boolean;
  category: 'main' | 'support' | 'settings' | 'modals';
}

const screens: ScreenCard[] = [
  // Row 1 - Main screens
  { id: 'dashboard', name: 'Tổng quan', status: 'done', category: 'main' },
  { id: 'invoices', name: 'Đề nghị xuất HĐ', status: 'done', category: 'main' },
  { id: 'invoices-form', name: 'Form Tạo ĐN', status: 'done', category: 'main' },
  { id: 'approval', name: 'Phê duyệt', status: 'done', category: 'main' },

  // Row 2 - Support screens
  { id: 'legal', name: 'Quản lý Pháp lý', status: 'done', category: 'support' },
  { id: 'sinvoice', name: 'S-Invoice', status: 'done', category: 'support' },
  { id: 'accounting', name: 'Hạch toán VFS', status: 'done', category: 'support', isNew: true },
  { id: 'reports', name: 'Báo cáo', status: 'done', category: 'support' },

  // Row 3 - Settings & Auth
  { id: 'settings', name: 'Cài đặt', status: 'done', category: 'settings' },
  { id: 'profile', name: 'Hồ sơ cá nhân', status: 'done', category: 'settings' },
  { id: 'onboarding', name: 'Đăng nhập + Chữ ký', status: 'done', category: 'settings', isNew: true },

  // Row 4 - Modals & States (placeholder - not implemented yet)
  { id: 'modal-approval', name: 'Modal Phê duyệt', status: 'done', category: 'modals' },
  { id: 'modal-accounting', name: 'Modal Bút toán', status: 'done', category: 'modals' },
  { id: 'modal-commitment', name: 'Modal Cam kết', status: 'done', category: 'modals' },
  { id: 'modal-error', name: 'Modal Lỗi', status: 'done', category: 'modals' },
];

const categoryNames = {
  main: 'Màn hình chính',
  support: 'Màn hình hỗ trợ',
  settings: 'Cài đặt & Xác thực',
  modals: 'Modals & Trạng thái'
};

export default function ScreenMap({ onNavigate }: ScreenMapProps) {
  const getStatusIcon = (status: ScreenCard['status']) => {
    switch (status) {
      case 'done':
        return <Check size={16} className="text-[#16A34A]" />;
      case 'progress':
        return <Wrench size={16} className="text-[#D97706]" />;
      case 'missing':
        return <AlertTriangle size={16} className="text-[#DC2626]" />;
    }
  };

  const getStatusColor = (status: ScreenCard['status']) => {
    switch (status) {
      case 'done':
        return 'border-[#16A34A]';
      case 'progress':
        return 'border-[#D97706]';
      case 'missing':
        return 'border-[#DC2626]';
    }
  };

  const getStatusLabel = (status: ScreenCard['status']) => {
    switch (status) {
      case 'done':
        return '✅ Hoàn thành';
      case 'progress':
        return '🔧 Đang phát triển';
      case 'missing':
        return '❌ Còn thiếu';
    }
  };

  const groupedScreens = screens.reduce((acc, screen) => {
    if (!acc[screen.category]) {
      acc[screen.category] = [];
    }
    acc[screen.category].push(screen);
    return acc;
  }, {} as Record<string, ScreenCard[]>);

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#111827] mb-2">
            🗺 Bản đồ màn hình — Hệ thống Quản lý Xuất HĐ VTK
          </h1>
          <p className="text-sm text-[#6B7280]">
            Toàn bộ màn hình trong hệ thống VTK Invoice. Nhấp vào card để điều hướng đến màn hình tương ứng.
          </p>
        </div>

        {/* Status Legend */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 mb-6 flex items-center gap-6">
          <span className="text-sm font-medium text-[#6B7280]">Chú giải:</span>
          <div className="flex items-center gap-2">
            <Check size={16} className="text-[#16A34A]" />
            <span className="text-sm text-[#374151]">Hoàn thành</span>
          </div>
          <div className="flex items-center gap-2">
            <Wrench size={16} className="text-[#D97706]" />
            <span className="text-sm text-[#374151]">Đang phát triển</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-[#DC2626]" />
            <span className="text-sm text-[#374151]">Còn thiếu</span>
          </div>
        </div>

        {/* User Flow Diagram */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 mb-8">
          <h2 className="text-sm font-semibold text-[#111827] mb-4">Luồng người dùng chính</h2>
          <div className="flex items-center gap-3 flex-wrap">
            {['Đăng nhập CK', 'Tổng quan', 'Đề nghị', 'Form', 'Phê duyệt', 'S-Invoice', 'VFS'].map((step, index, arr) => (
              <div key={step} className="flex items-center gap-3">
                <div className="bg-[#FFF1F3] text-[#EE0033] px-4 py-2 rounded-lg text-sm font-medium border border-[#EE0033]/20">
                  {step}
                </div>
                {index < arr.length - 1 && (
                  <ArrowRight size={16} className="text-[#9CA3AF]" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Screen Cards by Category */}
        <div className="space-y-8">
          {Object.entries(groupedScreens).map(([category, categoryScreens]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold text-[#111827] mb-4">
                {categoryNames[category as keyof typeof categoryNames]}
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {categoryScreens.map((screen) => (
                  <button
                    key={screen.id}
                    onClick={() => onNavigate(screen.id)}
                    className={`
                      bg-white border-2 rounded-lg p-4 text-left transition-all hover:shadow-lg hover:-translate-y-0.5
                      ${getStatusColor(screen.status)}
                    `}
                  >
                    {/* Thumbnail Placeholder */}
                    <div className="w-full h-32 bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] rounded mb-3 flex items-center justify-center relative overflow-hidden">
                      <div className="text-4xl opacity-20">📄</div>
                      {screen.isNew && (
                        <div className="absolute top-2 right-2 bg-[#EE0033] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          🆕 MỚI
                        </div>
                      )}
                    </div>

                    {/* Screen Name */}
                    <div className="text-sm font-medium text-[#111827] mb-2">
                      {screen.name}
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                      {getStatusIcon(screen.status)}
                      <span>{getStatusLabel(screen.status)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Statistics */}
        <div className="mt-8 grid grid-cols-4 gap-4">
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
            <div className="text-2xl font-bold text-[#111827]">{screens.length}</div>
            <div className="text-sm text-[#6B7280]">Tổng số màn hình</div>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
            <div className="text-2xl font-bold text-[#16A34A]">
              {screens.filter(s => s.status === 'done').length}
            </div>
            <div className="text-sm text-[#6B7280]">Đã hoàn thành</div>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
            <div className="text-2xl font-bold text-[#D97706]">
              {screens.filter(s => s.status === 'progress').length}
            </div>
            <div className="text-sm text-[#6B7280]">Đang phát triển</div>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
            <div className="text-2xl font-bold text-[#DC2626]">
              {screens.filter(s => s.status === 'missing').length}
            </div>
            <div className="text-sm text-[#6B7280]">Còn thiếu</div>
          </div>
        </div>
      </div>
    </div>
  );
}