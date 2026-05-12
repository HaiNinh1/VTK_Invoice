import { useState } from 'react';
import { 
  CheckCircle, AlertTriangle, Bell, Calendar, Filter, 
  Check, Trash2, ChevronDown 
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'approval' | 'legal' | 'system';
  title: string;
  message: string;
  time: string;
  date: string;
  read: boolean;
  priority?: 'high';
}

export default function NotificationCenter() {
  const [filterCategory, setFilterCategory] = useState<'all' | 'approval' | 'legal' | 'system'>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');

  // Extended notifications data with dates
  const allNotifications: Notification[] = [
    // Today
    { id: '1', type: 'approval', title: 'Đề nghị DN-2026-00145 đã được duyệt', message: 'Duyệt bởi Trần Thị B lúc 15:42', time: '2 phút trước', date: 'today', read: false },
    { id: '2', type: 'legal', title: 'Hồ sơ BB nghiệm thu HĐ-089 quá hạn 5 ngày', message: 'Cần bổ sung ngay biên bản nghiệm thu', time: '1 giờ trước', date: 'today', read: false, priority: 'high' },
    { id: '3', type: 'system', title: '3 hoá đơn mới đã xuất trên S-Invoice', message: 'DN-2026-00142, DN-2026-00143, DN-2026-00144', time: '3 giờ trước', date: 'today', read: true },
    { id: '4', type: 'approval', title: 'Đề nghị DN-2026-00140 được trả lại', message: 'Cần bổ sung BB quyết toán', time: '5 giờ trước', date: 'today', read: true },
    
    // Yesterday
    { id: '5', type: 'system', title: 'Lỗi xuất HĐ DN-2026-00138: MST không hợp lệ', message: 'Kiểm tra lại mã số thuế chủ đầu tư', time: 'hôm qua', date: 'yesterday', read: false, priority: 'high' },
    { id: '6', type: 'legal', title: 'Cam kết CK-2026-00089 còn 3 ngày nữa đến hạn', message: 'Người cam kết: Nguyễn Văn A', time: 'hôm qua', date: 'yesterday', read: true },
    
    // This week
    { id: '7', type: 'system', title: 'Hạch toán VFS hoàn thành cho DN-2026-00135', message: 'Đã đồng bộ thành công lên VFS', time: '2 ngày trước', date: 'week', read: true },
    { id: '8', type: 'system', title: 'Phạm Văn C đã thiết lập chữ ký điện tử', message: 'Quản trị viên - Admin', time: '3 ngày trước', date: 'week', read: true },
    { id: '9', type: 'approval', title: 'Đề nghị DN-2026-00132 cần phê duyệt', message: 'Đề nghị mới từ Lê Văn D', time: '4 ngày trước', date: 'week', read: true },
    
    // Older
    { id: '10', type: 'legal', title: 'Hồ sơ DN-2026-00128 đã được bổ sung đầy đủ', message: 'Người tạo: Nguyễn Văn A', time: '8 ngày trước', date: 'older', read: true },
    { id: '11', type: 'system', title: '5 hoá đơn đã xuất thành công', message: 'Batch xuất ngày 05/03/2026', time: '9 ngày trước', date: 'older', read: true },
    { id: '12', type: 'approval', title: 'Đề nghị DN-2026-00120 đã được duyệt', message: 'Duyệt bởi Hoàng Văn E', time: '10 ngày trước', date: 'older', read: true }
  ];

  // Filter notifications
  const filteredNotifications = allNotifications.filter(n => {
    if (filterCategory !== 'all' && n.type !== filterCategory) return false;
    if (filterRead === 'unread' && n.read) return false;
    if (filterRead === 'read' && !n.read) return false;
    return true;
  });

  // Group notifications by date
  const groupedNotifications = {
    today: filteredNotifications.filter(n => n.date === 'today'),
    yesterday: filteredNotifications.filter(n => n.date === 'yesterday'),
    week: filteredNotifications.filter(n => n.date === 'week'),
    older: filteredNotifications.filter(n => n.date === 'older')
  };

  const unreadCount = allNotifications.filter(n => !n.read).length;

  const getIcon = (type: Notification['type'], priority?: 'high') => {
    const isPriority = priority === 'high';
    
    switch (type) {
      case 'approval':
        return (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPriority ? 'bg-[#16A34A]' : 'bg-[#D1FAE5]'}`}>
            <CheckCircle size={16} className={isPriority ? 'text-white' : 'text-[#16A34A]'} strokeWidth={2.5} />
          </div>
        );
      case 'legal':
        return (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPriority ? 'bg-[#D97706]' : 'bg-[#FEF3C7]'}`}>
            <AlertTriangle size={16} className={isPriority ? 'text-white' : 'text-[#D97706]'} strokeWidth={2.5} />
          </div>
        );
      case 'system':
        return (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPriority ? 'bg-[#1D4ED8]' : 'bg-[#E5E7EB]'}`}>
            <Bell size={16} className={isPriority ? 'text-white' : 'text-[#6B7280]'} strokeWidth={2.5} />
          </div>
        );
    }
  };

  const DateGroup = ({ title, notifications }: { title: string; notifications: Notification[] }) => {
    if (notifications.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-[#6B7280] uppercase mb-3 px-6">{title}</h3>
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          {notifications.map((notification, idx) => (
            <div 
              key={notification.id}
              className={`px-6 py-4 flex items-start gap-4 hover:bg-[#F9FAFB] cursor-pointer transition-colors ${
                idx !== notifications.length - 1 ? 'border-b border-[#E5E7EB]' : ''
              } ${!notification.read ? 'bg-[#FFFBEB]' : ''}`}
            >
              {getIcon(notification.type, notification.priority)}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-[#111827] mb-1">
                  {notification.title}
                </h4>
                <p className="text-xs text-[#6B7280] mb-2">
                  {notification.message}
                </p>
                <span className="text-xs text-[#9CA3AF]">{notification.time}</span>
              </div>
              <div className="flex items-center gap-2">
                {!notification.read && (
                  <div className={`w-2 h-2 rounded-full ${
                    notification.priority === 'high' ? 'bg-[#EE0033]' : 'bg-[#1D4ED8]'
                  }`}></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">Trung tâm thông báo</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Theo dõi tất cả các thông báo và cập nhật quan trọng
        </p>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-center justify-between flex-wrap gap-4">
        {/* Left: Filters */}
        <div className="flex items-center gap-3">
          {/* Category Filter */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="h-9 pl-9 pr-8 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] appearance-none bg-white cursor-pointer"
            >
              <option value="all">Tất cả danh mục</option>
              <option value="approval">Phê duyệt</option>
              <option value="legal">Pháp lý</option>
              <option value="system">Hệ thống</option>
            </select>
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
          </div>

          {/* Read Status Toggle */}
          <div className="flex items-center h-9 bg-[#F3F4F6] rounded-lg p-1">
            <button
              onClick={() => setFilterRead('all')}
              className={`h-7 px-3 text-xs font-medium rounded transition-colors ${
                filterRead === 'all' 
                  ? 'bg-white text-[#111827] shadow-sm' 
                  : 'text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              Tất cả ({allNotifications.length})
            </button>
            <button
              onClick={() => setFilterRead('unread')}
              className={`h-7 px-3 text-xs font-medium rounded transition-colors ${
                filterRead === 'unread' 
                  ? 'bg-white text-[#111827] shadow-sm' 
                  : 'text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              Chưa đọc ({unreadCount})
            </button>
            <button
              onClick={() => setFilterRead('read')}
              className={`h-7 px-3 text-xs font-medium rounded transition-colors ${
                filterRead === 'read' 
                  ? 'bg-white text-[#111827] shadow-sm' 
                  : 'text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              Đã đọc ({allNotifications.length - unreadCount})
            </button>
          </div>
        </div>

        {/* Right: Bulk Actions */}
        <div className="flex items-center gap-2">
          <button className="h-9 px-4 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F3F4F6] flex items-center gap-2">
            <Check size={14} />
            Đọc tất cả
          </button>
          <button className="h-9 px-4 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F3F4F6] flex items-center gap-2">
            <Trash2 size={14} />
            Xoá đã đọc
          </button>
        </div>
      </div>

      {/* Notifications List by Date Group */}
      <DateGroup title="Hôm nay" notifications={groupedNotifications.today} />
      <DateGroup title="Hôm qua" notifications={groupedNotifications.yesterday} />
      <DateGroup title="Tuần này" notifications={groupedNotifications.week} />
      <DateGroup title="Trước đó" notifications={groupedNotifications.older} />

      {/* Empty State */}
      {filteredNotifications.length === 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center">
          <Bell size={48} className="text-[#D1D5DB] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#111827] mb-2">Không có thông báo</h3>
          <p className="text-sm text-[#6B7280]">
            Không tìm thấy thông báo nào phù hợp với bộ lọc của bạn.
          </p>
        </div>
      )}
    </div>
  );
}
