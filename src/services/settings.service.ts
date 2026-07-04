import { apiClient } from '../lib/api-client';

export const settingsService = {
  async getAll(options?: { signal?: AbortSignal }) {
    return apiClient.get<Record<string, unknown>>('/api/settings', { signal: options?.signal });
  },

  async saveSection(section: string, value: unknown) {
    return apiClient.put('/api/settings', { section, value });
  },

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return apiClient.post<{ success: boolean; message: string }>('/api/account/change-password', data);
  }
};

export default settingsService;
