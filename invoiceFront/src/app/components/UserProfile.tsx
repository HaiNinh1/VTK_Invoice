import { useState } from 'react';
import {
  Mail, Phone, Edit3, Upload, Check, X, Clock, Eye, Send,
  AlertTriangle, TrendingUp, FileText, Bell
} from 'lucide-react';

export default function UserProfile() {
  const [notificationSettings, setNotificationSettings] = useState({
    approvalEmail: true,
    legalReminder: true,
    dailyDigest: false
  });

  // Recent activity data
  const recentActivities = [
    {
      icon: Check,
      color: '#16A34A',
      title: 'Duyệt đề nghị DN-2026-00158',
      description: 'Đề nghị từ Trần Văn B - P. Kinh doanh',
      timestamp: '13/03/2026 16:30',
      type: 'approve'
    },
    {
      icon: Eye,
      color: '#9CA3AF',
      title: 'Xem đề nghị DN-2026-00157',
      description: 'Đề nghị từ Lê Thị C - P. Kỹ thuật',
      timestamp: '13/03/2026 15:45',
      type: 'view'
    },
    {
      icon: Check,
      color: '#16A34A',
      title: 'Duyệt đề nghị DN-2026-00155',
      description: 'Đề nghị từ Phạm Văn D - P. Hành chính',
      timestamp: '13/03/2026 14:20',
      type: 'approve'
    },
    {
      icon: AlertTriangle,
      color: '#DC2626',
      title: 'Trả lại đề nghị DN-2026-00153',
      description: 'Thiếu hồ sơ pháp lý - yêu cầu bổ sung',
      timestamp: '13/03/2026 11:15',
      type: 'return'
    },
    {
      icon: Eye,
      color: '#9CA3AF',
      title: 'Xem đề nghị DN-2026-00152',
      description: 'Đề nghị từ Hoàng Thị E - P. Kinh doanh',
      timestamp: '13/03/2026 10:30',
      type: 'view'
    },
    {
      icon: Check,
      color: '#16A34A',
      title: 'Duyệt đề nghị DN-2026-00150',
      description: 'Đề nghị từ Vũ Văn F - P. Kỹ thuật',
      timestamp: '12/03/2026 16:45',
      type: 'approve'
    },
    {
      icon: Check,
      color: '#16A34A',
      title: 'Duyệt đề nghị DN-2026-00148',
      description: 'Đề nghị từ Đỗ Thị G - P. Tài chính',
      timestamp: '12/03/2026 14:50',
      type: 'approve'
    },
    {
      icon: Eye,
      color: '#9CA3AF',
      title: 'Xem đề nghị DN-2026-00147',
      description: 'Đề nghị từ Bùi Văn H - P. Hành chính',
      timestamp: '12/03/2026 11:20',
      type: 'view'
    },
    {
      icon: Check,
      color: '#16A34A',
      title: 'Duyệt đề nghị DN-2026-00145',
      description: 'Đề nghị từ Ngô Thị I - P. Kinh doanh',
      timestamp: '11/03/2026 15:30',
      type: 'approve'
    },
    {
      icon: Send,
      color: '#F59E0B',
      title: 'Tạo đề nghị DN-2026-00144',
      description: 'Đề nghị xuất hoá đơn cho dự án ABC',
      timestamp: '11/03/2026 09:15',
      type: 'create'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-4">
        <div className="max-w-[1440px] mx-auto">
          <h1 className="text-2xl font-semibold text-[#111827]">Hồ sơ cá nhân</h1>
          <p className="text-sm text-[#6B7280] mt-1">Quản lý thông tin và cài đặt tài khoản của bạn</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1440px] mx-auto p-6">
        <div className="flex gap-6">
          {/* LEFT COLUMN - 360px */}
          <div className="w-[360px] space-y-6 flex-shrink-0">
            {/* Profile Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
              {/* Avatar */}
              <div className="relative group mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#EE0033] to-[#CC002B] flex items-center justify-center text-white text-3xl font-semibold mx-auto">
                  NVA
                </div>
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="text-white text-xs font-medium flex items-center gap-1">
                    <Upload size={14} />
                    Thay ảnh
                  </span>
                </div>
              </div>

              {/* User Info */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-[#111827] mb-2">Nguyễn Văn A</h2>
                <div className="inline-flex items-center h-6 px-3 rounded-full bg-[#EEF2FF] text-[#4338CA] text-xs font-medium mb-2">
                  Kế toán viên
                </div>
                <p className="text-sm text-[#6B7280]">P. Tài chính Kế toán</p>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={16} className="text-[#9CA3AF] flex-shrink-0" />
                  <span className="text-[#374151]">nva@vtk.com.vn</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={16} className="text-[#9CA3AF] flex-shrink-0" />
                  <span className="text-[#374151]">0912.345.678</span>
                </div>
              </div>

              {/* Edit Button */}
              <button className="w-full h-10 border border-[#D1D5DB] rounded-lg text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] flex items-center justify-center gap-2 transition-colors">
                <Edit3 size={14} />
                Sửa thông tin
              </button>
            </div>

            {/* Signature Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
              <h3 className="text-base font-semibold text-[#111827] mb-4">Chữ ký của tôi</h3>
              
              {/* Signature Preview */}
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 mb-3">
                <div className="h-[60px] flex items-center justify-center">
                  <div className="text-2xl font-['Brush_Script_MT',cursive] text-[#374151]" style={{ fontFamily: 'Brush Script MT, cursive' }}>
                    Nguyễn Văn A
                  </div>
                </div>
              </div>

              {/* Signature Metadata */}
              <div className="text-xs text-[#6B7280] mb-4 text-center">
                Tạo: 10/01/2026 | Loại: Vẽ tay
              </div>

              {/* Change Signature Button */}
              <button className="w-full h-9 border border-[#D1D5DB] rounded-lg text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors">
                Thay đổi chữ ký
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex-1 space-y-6">
            {/* Section 1: Monthly Stats */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
              <h3 className="text-base font-semibold text-[#111827] mb-4">Thống kê hoạt động tháng này</h3>
              
              <div className="grid grid-cols-4 gap-4">
                {/* Stat Card 1 */}
                <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-lg p-4">
                  <div className="text-xs text-[#991B1B] font-medium mb-1">Đề nghị tạo</div>
                  <div className="text-3xl font-bold text-[#DC2626]" style={{ fontVariantNumeric: 'tabular-nums' }}>8</div>
                </div>

                {/* Stat Card 2 */}
                <div className="bg-[#ECFDF5] border border-[#D1FAE5] rounded-lg p-4">
                  <div className="text-xs text-[#065F46] font-medium mb-1">Đã duyệt</div>
                  <div className="text-3xl font-bold text-[#16A34A]" style={{ fontVariantNumeric: 'tabular-nums' }}>15</div>
                </div>

                {/* Stat Card 3 */}
                <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-lg p-4">
                  <div className="text-xs text-[#92400E] font-medium mb-1">Đã từ chối</div>
                  <div className="text-3xl font-bold text-[#D97706]" style={{ fontVariantNumeric: 'tabular-nums' }}>1</div>
                </div>

                {/* Stat Card 4 */}
                <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg p-4">
                  <div className="text-xs text-[#1E40AF] font-medium mb-1">TB xử lý</div>
                  <div className="text-3xl font-bold text-[#2563EB]" style={{ fontVariantNumeric: 'tabular-nums' }}>2.5<span className="text-sm ml-1">giờ</span></div>
                </div>
              </div>
            </div>

            {/* Section 2: Recent Activity */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
              <h3 className="text-base font-semibold text-[#111827] mb-4">Hoạt động gần đây</h3>
              
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#E5E7EB]"></div>

                <div className="space-y-0">
                  {recentActivities.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div key={index} className="relative pl-12 pb-6 last:pb-0">
                        <div 
                          className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-white"
                          style={{ backgroundColor: activity.color }}
                        ></div>
                        <div>
                          <div className="text-[14px] font-medium text-[#111827] mb-1 flex items-center gap-2">
                            <Icon size={14} style={{ color: activity.color }} />
                            {activity.title}
                          </div>
                          <p className="text-[13px] text-[#6B7280] mb-1">
                            {activity.description}
                          </p>
                          <div className="text-xs text-[#9CA3AF]">{activity.timestamp}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 3: Notification Settings */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell size={20} className="text-[#EE0033]" />
                <h3 className="text-base font-semibold text-[#111827]">Cài đặt thông báo</h3>
              </div>
              
              <div className="space-y-4">
                {/* Toggle 1 */}
                <div className="flex items-center justify-between py-3 border-b border-[#E5E7EB]">
                  <div>
                    <div className="text-sm font-medium text-[#111827] mb-0.5">
                      Email khi duyệt/từ chối
                    </div>
                    <div className="text-xs text-[#6B7280]">
                      Nhận email khi đề nghị của bạn được duyệt hoặc từ chối
                    </div>
                  </div>
                  <button
                    onClick={() => setNotificationSettings(prev => ({ ...prev, approvalEmail: !prev.approvalEmail }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      notificationSettings.approvalEmail ? 'bg-[#EE0033]' : 'bg-[#D1D5DB]'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        notificationSettings.approvalEmail ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>

                {/* Toggle 2 */}
                <div className="flex items-center justify-between py-3 border-b border-[#E5E7EB]">
                  <div>
                    <div className="text-sm font-medium text-[#111827] mb-0.5">
                      Email nhắc nhở pháp lý
                    </div>
                    <div className="text-xs text-[#6B7280]">
                      Nhận email nhắc nhở khi hồ sơ pháp lý sắp hết hạn
                    </div>
                  </div>
                  <button
                    onClick={() => setNotificationSettings(prev => ({ ...prev, legalReminder: !prev.legalReminder }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      notificationSettings.legalReminder ? 'bg-[#EE0033]' : 'bg-[#D1D5DB]'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        notificationSettings.legalReminder ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>

                {/* Toggle 3 */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium text-[#111827] mb-0.5">
                      Daily digest
                    </div>
                    <div className="text-xs text-[#6B7280]">
                      Nhận tổng hợp hoạt động hàng ngày vào 8:00 sáng
                    </div>
                  </div>
                  <button
                    onClick={() => setNotificationSettings(prev => ({ ...prev, dailyDigest: !prev.dailyDigest }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      notificationSettings.dailyDigest ? 'bg-[#EE0033]' : 'bg-[#D1D5DB]'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        notificationSettings.dailyDigest ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
