import { apiGet, apiPost, unwrap } from '../client';
import type { AppNotification, Paginated } from '../types';

export const notificationsApi = {
  list: async (params?: { unread?: boolean; per_page?: number; page?: number }) => {
    const raw = await apiGet<unknown>('/notifications', { params });
    // Backend returns either {data: [...], meta:{...}} (paginated) or {data: [...]}.
    const payload = raw as { data?: AppNotification[]; meta?: Paginated<AppNotification>['meta'] };
    return {
      data: payload.data ?? [],
      meta: payload.meta,
    };
  },
  markRead: (id: string) => apiPost<{ message?: string }>(`/notifications/${id}/read`),
  markAllRead: () => apiPost<{ message?: string }>('/notifications/read-all'),
};
