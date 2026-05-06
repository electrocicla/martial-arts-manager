import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from './notification.service';
import { apiClient } from '../lib/api-client';

vi.mock('../lib/api-client', () => {
  const mockGet = vi.fn();
  const mockPost = vi.fn();
  const mockPut = vi.fn();
  const mockDelete = vi.fn();
  return {
    apiClient: { get: mockGet, post: mockPost, put: mockPut, delete: mockDelete },
  };
});

const mockPost = vi.mocked(apiClient.post);

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
    vi.clearAllMocks();
  });

  describe('confirm', () => {
    it('POSTs to /api/notifications/confirm with the notification id', async () => {
      mockPost.mockResolvedValue({
        success: true,
        data: { success: true, confirmedAt: '2026-01-12T00:00:00.000Z' },
      });

      const result = await service.confirm('notif-123');

      expect(apiClient.post).toHaveBeenCalledWith('/api/notifications/confirm', {
        id: 'notif-123',
      });
      expect(result.success).toBe(true);
      expect(result.data?.confirmedAt).toBe('2026-01-12T00:00:00.000Z');
    });

    it('returns alreadyConfirmed when the server reports it', async () => {
      mockPost.mockResolvedValue({
        success: true,
        data: { success: true, alreadyConfirmed: true },
      });

      const result = await service.confirm('notif-123');

      expect(result.data?.alreadyConfirmed).toBe(true);
    });

    it('forwards backend errors', async () => {
      mockPost.mockResolvedValue({
        success: false,
        error: 'Notification not found',
      });

      const result = await service.confirm('missing');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Notification not found');
    });
  });
});
