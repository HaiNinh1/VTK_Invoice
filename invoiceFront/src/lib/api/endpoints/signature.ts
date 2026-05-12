import { apiDelete, apiGet, apiPost, apiPut, unwrap } from '../client';

export interface UserSignature {
  id?: number;
  user_id?: number;
  method?: 'draw' | 'text' | 'upload';
  data_path?: string;
  font_family?: string | null;
}

export const signatureApi = {
  show: async (): Promise<UserSignature | null> => {
    try {
      const raw = await apiGet<unknown>('/me/signature');
      return unwrap<UserSignature>(raw);
    } catch {
      return null;
    }
  },

  /**
   * Backend currently requires multipart upload for all methods (incl. draw).
   * For text method we still send the text as a generated image file (caller responsibility).
   */
  update: async (payload: { method: 'draw' | 'text' | 'upload'; file?: File; text?: string }) => {
    const fd = new FormData();
    fd.append('method', payload.method);
    if (payload.file) fd.append('file', payload.file);
    if (payload.text) fd.append('text', payload.text);
    return apiPost<unknown>('/me/signature', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  destroy: () => apiDelete<void>('/me/signature'),
};
