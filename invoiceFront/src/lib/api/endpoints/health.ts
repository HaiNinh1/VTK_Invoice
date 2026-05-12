// Public health-check endpoint. Used for backend liveness diagnostics in the UI.
import { apiGet } from '../client';

export interface HealthResponse {
  status: 'ok' | string;
  app?: string;
  env?: string;
  time?: string;
  [key: string]: unknown;
}

export const healthApi = {
  get: () => apiGet<HealthResponse>('/health'),
};
