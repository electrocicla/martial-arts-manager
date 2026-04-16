import { apiClient } from '../lib/api-client';

export const settingsService = {
  async getAll(options?: { signal?: AbortSignal }) {
    return apiClient.get<Record<string, unknown>>('/api/settings', { signal: options?.signal });
  },

  async saveSection(section: string, value: unknown) {
    return apiClient.put('/api/settings', { section, value });
  }
};

export default settingsService;
