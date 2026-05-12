import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  CheckCircle, AlertTriangle, Bell, Filter,
  Check, Trash2, ChevronDown,
} from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../../lib/api/queries';
import type { AppNotification } from '../../lib/api/types';

type Category = 'approval' | 'legal' | 'system';

interface DisplayNotification {
  id: string;
  type: Category;
  title: string;
  message: string;
  time: string;
  bucket: 'today' | 'yesterday' | 'week' | 'older';
  read: boolean;
  priority?: 'high';
  invoiceRequestId?: number;
}

function classify(n: AppNotification): Category {
  // Backend may emit `category` directly on the resource.
  const explicit = (n.category ?? '').toLowerCase();
  if (explicit === 'approval' || explicit === 'legal' || explicit === 'system') {
    return explicit as Category;
  }
  const t = n.type.toLowerCase();
  if (t.includes('approv') || t.includes('reject') || t.includes('return') || t.includes('submit') || t.includes('resubmit')) {
    return 'approval';
  }
  if (t.includes('legal') || t.includes('commit') || t.includes('document') || t.includes('overdue') || t.includes('expire')) {
    return 'legal';
  }
  return 'system';
}

function bucketOf(iso: string): DisplayNotification['bucket'] {
  const created = new Date(iso);
  if (Number.isNaN(created.getTime())) return 'older';
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = startOfDay(now);
  const created0 = startOfDay(created);
  const diffDays = Math.round((today - created0) / 86400000);
  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays <= 7) return 'week';
  return 'older';
}

function relativeTime(iso: string): string {
  const created = new Date(iso);
  if (Number.isNaN(created.getTime())) return '';
  const diffMs = Date.now() - created.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'hôm qua';
  if (days < 30) return `${days} ngày trước`;
  return created.toLocaleDateString('vi-VN');
}

function isPriority(n: AppNotification): boolean {
  if (n.priority && n.priority.toLowerCase() === 'high') return true;
  const t = n.type.toLowerCase();
  return t.includes('overdue') || t.includes('reject') || t.includes('return') || t.includes('error');
}

function mapToDisplay(n: AppNotification): DisplayNotification {
  const data = n.data ?? {};
  // Backend now exposes title/message at the top level; the older `data.*`
  // payload remains for backward compatibility.
  const title = n.title ?? (data['title'] as string | undefined) ?? 'Thông báo';
  const message = n.message ?? (data['message'] as string | undefined) ?? '';
  // Backend approval notifications emit `request_code`; older payloads used
  // `invoice_request_code`. Accept either.
  const code =
    (data['request_code'] as string | undefined) ??
    (data['invoice_request_code'] as string | undefined);
  const invoiceRequestId =
    typeof data['invoice_request_id'] === 'number'
      ? (data['invoice_request_id'] as number)
      : undefined;
  return {
    id: String(n.id),
    type: classify(n),
    title: code ? `${title} (${code})` : title,
    message,
    time: relativeTime(n.created_at),
    bucket: bucketOf(n.created_at),
    read: !!n.read_at,
    priority: isPriority(n) ? 'high' : undefined,
    invoiceRequestId,
  };
}

export default function NotificationCenter() {
  const [filterCategory, setFilterCategory] = useState<'all' | Category>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');

  const { data, isLoading, isError, refetch } = useNotifications({ per_page: 100 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const navigate = useNavigate();

  const rawList = data?.data ?? [];
  const allNotifications = useMemo(() => rawList.map(mapToDisplay), [rawList]);

  const filteredNotifications = allNotifications.filter(n => {
    if (filterCategory !== 'all' && n.type !== filterCategory) return false;
    if (filterRead === 'unread' && n.read) return false;
    if (filterRead === 'read' && !n.read) return false;
    return true;
  });

  const groupedNotifications = {
    today: filteredNotifications.filter(n => n.bucket === 'today'),
    yesterday: filteredNotifications.filter(n => n.bucket === 'yesterday'),
    week: filteredNotifications.filter(n => n.bucket === 'week'),
    older: filteredNotifications.filter(n => n.bucket === 'older'),
  };

  const unreadCount = allNotifications.filter(n => !n.read).length;

  function handleItemClick(notif: DisplayNotification) {
    if (!notif.read) {
      markRead.mutate(notif.id);
    }
    if (notif.invoiceRequestId) {
      navigate(`/invoices/${notif.invoiceRequestId}`);
    }
  }

  function handleMarkAll() {
    markAllRead.mutate();
  }

  const getIcon = (type: Category, priority?: 'high') => {
    const prio = priority === 'high';
    switch (type) {
      case 'approval':
        return (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${prio ? 'bg-[#16A34A]' : 'bg-[#D1FAE5]'}`}>
            <CheckCircle size={16} className={prio ? 'text-white' : 'text-[#16A34A]'} strokeWidth={2.5} />
          </div>
        );
      case 'legal':
        return (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${prio ? 'bg-[#D97706]' : 'bg-[#FEF3C7]'}`}>
            <AlertTriangle size={16} className={prio ? 'text-white' : 'text-[#D97706]'} strokeWidth={2.5} />
          </div>
        );
      case 'system':
      default:
        return (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${prio ? 'bg-[#1D4ED8]' : 'bg-[#E5E7EB]'}`}>
            <Bell size={16} className={prio ? 'text-white' : 'text-[#6B7280]'} strokeWidth={2.5} />
          </div>
        );
    }
  };

  const DateGroup = ({ title, notifications }: { title: string; notifications: DisplayNotification[] }) => {
    if (notifications.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-[#6B7280] uppercase mb-3 px-6">{title}</h3>
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          {notifications.map((notification, idx) => (
            <div
              key={notification.id}
              onClick={() => handleItemClick(notification)}
              className={`px-6 py-4 flex items-start gap-4 hover:bg-[#F9FAFB] cursor-pointer transition-colors ${
                idx !== notifications.length - 1 ? 'border-b border-[#E5E7EB]' : ''
              } ${!notification.read ? 'bg-[#FFFBEB]' : ''}`}
            >
              {getIcon(notification.type, notification.priority)}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-[#111827] mb-1">{notification.title}</h4>
                {notification.message && (
                  <p className="text-xs text-[#6B7280] mb-2">{notification.message}</p>
                )}
                <span className="text-xs text-[#9CA3AF]">{notification.time}</span>
              </div>
              <div className="flex items-center gap-2">
                {!notification.read && (
                  <div className={`w-2 h-2 rounded-full ${
                    notification.priority === 'high' ? 'bg-[#EE0033]' : 'bg-[#1D4ED8]'
                  }`} />
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
        <p className="text-sm text-[#6B7280] mt-1">Theo dõi tất cả các thông báo và cập nhật quan trọng</p>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as 'all' | Category)}
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

          <div className="flex items-center h-9 bg-[#F3F4F6] rounded-lg p-1">
            <button
              onClick={() => setFilterRead('all')}
              className={`h-7 px-3 text-xs font-medium rounded transition-colors ${
                filterRead === 'all' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              Tất cả ({allNotifications.length})
            </button>
            <button
              onClick={() => setFilterRead('unread')}
              className={`h-7 px-3 text-xs font-medium rounded transition-colors ${
                filterRead === 'unread' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              Chưa đọc ({unreadCount})
            </button>
            <button
              onClick={() => setFilterRead('read')}
              className={`h-7 px-3 text-xs font-medium rounded transition-colors ${
                filterRead === 'read' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              Đã đọc ({allNotifications.length - unreadCount})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAll}
            disabled={markAllRead.isPending || unreadCount === 0}
            className="h-9 px-4 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F3F4F6] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={14} />
            Đọc tất cả
          </button>
          <button
            onClick={() => refetch()}
            className="h-9 px-4 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F3F4F6] flex items-center gap-2"
          >
            <Trash2 size={14} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Loading / Error states */}
      {isLoading && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-center text-sm text-[#6B7280]">
          Đang tải thông báo...
        </div>
      )}
      {isError && !isLoading && (
        <div className="bg-white border border-[#FCA5A5] rounded-xl p-6 text-center text-sm text-[#DC2626]">
          Không thể tải thông báo. Vui lòng thử lại.
        </div>
      )}

      {/* Notifications List by Date Group */}
      {!isLoading && !isError && (
        <>
          <DateGroup title="Hôm nay" notifications={groupedNotifications.today} />
          <DateGroup title="Hôm qua" notifications={groupedNotifications.yesterday} />
          <DateGroup title="Tuần này" notifications={groupedNotifications.week} />
          <DateGroup title="Trước đó" notifications={groupedNotifications.older} />

          {filteredNotifications.length === 0 && (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center">
              <Bell size={48} className="text-[#D1D5DB] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#111827] mb-2">Không có thông báo</h3>
              <p className="text-sm text-[#6B7280]">
                Không tìm thấy thông báo nào phù hợp với bộ lọc của bạn.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
