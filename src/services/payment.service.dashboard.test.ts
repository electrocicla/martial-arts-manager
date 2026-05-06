import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentService } from './payment.service';
import { apiClient } from '../lib/api-client';
import type {
  PaymentHistoryResponse,
  OverdueStudentsResponse,
  NotifyOverdueResponse,
} from './payment.service';

vi.mock('../lib/api-client', () => {
  const mockGet = vi.fn();
  const mockPost = vi.fn();
  const mockPut = vi.fn();
  const mockDelete = vi.fn();
  return {
    apiClient: { get: mockGet, post: mockPost, put: mockPut, delete: mockDelete },
  };
});

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);

describe('PaymentService — admin dashboard endpoints', () => {
  let service: PaymentService;

  beforeEach(() => {
    service = new PaymentService();
    vi.clearAllMocks();
  });

  describe('getMonthlyHistory', () => {
    it('hits /api/payments/history and returns the parsed response', async () => {
      const payload: PaymentHistoryResponse = {
        months: [
          {
            monthKey: '2026-01',
            totalAmount: 35000,
            totalCount: 1,
            completedCount: 1,
            pendingCount: 0,
            failedCount: 0,
            refundedCount: 0,
            payments: [
              {
                id: 'p-1',
                student_id: 's-1',
                student_name: 'Alice',
                student_email: 'alice@example.com',
                amount: 35000,
                date: '2026-01-05',
                type: 'monthly',
                notes: null,
                status: 'completed',
                payment_method: 'cash',
                created_at: '2026-01-05T12:00:00Z',
                updated_at: '2026-01-05T12:00:00Z',
              },
            ],
          },
        ],
        totals: {
          totalAmount: 35000,
          totalCount: 1,
          completedAmount: 35000,
          pendingAmount: 0,
          monthsTracked: 1,
        },
      };

      mockGet.mockResolvedValue({ success: true, data: payload });

      const result = await service.getMonthlyHistory();

      expect(apiClient.get).toHaveBeenCalledWith('/api/payments/history');
      expect(result).toEqual({ success: true, data: payload });
    });

    it('propagates API errors', async () => {
      mockGet.mockResolvedValue({ success: false, error: 'Access denied' });
      const result = await service.getMonthlyHistory();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied');
    });
  });

  describe('getOverdueStudents', () => {
    it('hits /api/payments/overdue and returns the parsed response', async () => {
      const payload: OverdueStudentsResponse = {
        students: [
          {
            studentId: 's-1',
            studentName: 'Alice',
            studentEmail: 'alice@example.com',
            studentPhone: null,
            belt: 'white',
            discipline: 'karate',
            userId: 'u-1',
            expectedAmount: 35000,
            lastPaymentDate: '2025-12-05',
            lastPaymentAmount: 35000,
            daysOverdue: 7,
            dueDate: '2026-01-05',
          },
        ],
        meta: { dueDay: 5, dueDate: '2026-01-05', referenceDate: '2026-01-12', totalOverdue: 1 },
      };

      mockGet.mockResolvedValue({ success: true, data: payload });

      const result = await service.getOverdueStudents();

      expect(apiClient.get).toHaveBeenCalledWith('/api/payments/overdue');
      expect(result).toEqual({ success: true, data: payload });
    });
  });

  describe('notifyOverdueStudent', () => {
    it('POSTs to /api/payments/notify-overdue with the supplied payload', async () => {
      const payload: NotifyOverdueResponse = { success: true, notificationId: 'n-1' };
      mockPost.mockResolvedValue({ success: true, data: payload });

      const result = await service.notifyOverdueStudent({
        studentId: 's-1',
        daysOverdue: 7,
        expectedAmount: 35000,
        monthLabel: '2026-01',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/api/payments/notify-overdue', {
        studentId: 's-1',
        daysOverdue: 7,
        expectedAmount: 35000,
        monthLabel: '2026-01',
      });
      expect(result).toEqual({ success: true, data: payload });
    });

    it('returns the API error when notification fails', async () => {
      mockPost.mockResolvedValue({
        success: false,
        error: 'Student does not have a linked user account to receive notifications',
      });

      const result = await service.notifyOverdueStudent({ studentId: 's-2' });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/linked user account/);
    });
  });
});
