import { apiGet, apiPost, unwrap } from '../client';
import type { User } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiPost<LoginResponse>('/auth/login', payload),

  me: async (): Promise<User> => {
    const raw = await apiGet<unknown>('/auth/me');
    return unwrap<User>(raw);
  },

  logout: () => apiPost<void>('/auth/logout'),

  changePassword: (payload: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }) => apiPost<{ message: string }>('/auth/change-password', payload),
};
