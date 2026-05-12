import { apiGet, unwrap } from '../client';

export interface DashboardData {
  scope: 'company' | 'revenue-center' | 'own';
  total: number;
  draft: number;
  pending: number;
  returned: number;
  approved: number;
  rejected: number;
  by_status: Record<string, number>;
}

export const dashboardApi = {
  get: async (): Promise<DashboardData> => {
    const raw = await apiGet<unknown>('/dashboard');
    return unwrap<DashboardData>(raw);
  },
};
