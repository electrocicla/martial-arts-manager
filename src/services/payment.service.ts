/**
 * Payment Service
 * Handles all payment-related operations following SRP
 */

import { apiClient, type ApiResponse } from '../lib/api-client';
import type { Payment, PaymentFormData } from '../types/index';

export interface PaymentFilters {
  studentId?: string;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaymentStats {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  refunded: number;
  totalAmount: number;
  monthlyRevenue: Record<string, number>;
}

export class PaymentService {
  private readonly endpoint = '/api/payments';

  async getAll(filters?: PaymentFilters): Promise<ApiResponse<Payment[]>> {
    const params = new URLSearchParams();

    if (filters?.studentId) params.append('student_id', filters.studentId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters?.dateTo) params.append('date_to', filters.dateTo);

    const query = params.toString();
    const endpoint = query ? `${this.endpoint}?${query}` : this.endpoint;

    return apiClient.get<Payment[]>(endpoint);
  }

  async getById(id: string): Promise<ApiResponse<Payment>> {
    return apiClient.get<Payment>(`${this.endpoint}/${id}`);
  }

  async create(data: PaymentFormData): Promise<ApiResponse<Payment>> {
    const payload = {
      id: crypto.randomUUID(),
      student_id: data.studentId,
      amount: data.amount,
      date: data.date,
      type: data.type,
      notes: data.notes || undefined,
      status: 'completed', // Default status
      payment_method: data.paymentMethod || undefined,
    };

    return apiClient.post<Payment>(this.endpoint, payload);
  }

  async update(id: string, data: Partial<Payment>): Promise<ApiResponse<Payment>> {
    return apiClient.put<Payment>(`${this.endpoint}/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`);
  }

  async getStats(): Promise<ApiResponse<PaymentStats>> {
    const response = await this.getAll();
    if (!response.success || !response.data) {
      return { success: false, error: response.error };
    }

    const payments = response.data;
    const stats: PaymentStats = {
      total: payments.length,
      completed: 0,
      pending: 0,
      failed: 0,
      refunded: 0,
      totalAmount: 0,
      monthlyRevenue: {},
    };

    payments.forEach((payment: Payment) => {
      // Count by status
      switch (payment.status) {
        case 'completed':
          stats.completed++;
          break;
        case 'pending':
          stats.pending++;
          break;
        case 'failed':
          stats.failed++;
          break;
        case 'refunded':
          stats.refunded++;
          break;
      }

      // Sum total amount
      stats.totalAmount += payment.amount;

      // Group by month
      const monthKey = new Date(payment.date).toISOString().slice(0, 7); // YYYY-MM
      stats.monthlyRevenue[monthKey] = (stats.monthlyRevenue[monthKey] || 0) + payment.amount;
    });

    return { data: stats, success: true };
  }

  async getByStudent(studentId: string): Promise<ApiResponse<Payment[]>> {
    return this.getAll({ studentId });
  }

  async getRevenueByPeriod(startDate: string, endDate: string): Promise<ApiResponse<number>> {
    const response = await this.getAll({ dateFrom: startDate, dateTo: endDate });
    if (!response.success || !response.data) {
      return { success: false, error: response.error };
    }

    const total = response.data.reduce((sum: number, payment: Payment) => sum + payment.amount, 0);
    return { data: total, success: true };
  }

  async getOverdue(): Promise<ApiResponse<Payment[]>> {
    const response = await this.getAll({ status: 'pending' });
    if (!response.success || !response.data) {
      return { success: false, error: response.error };
    }

    // Filter payments that are past due (more than 30 days old)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const overdue = response.data.filter((payment: Payment) => {
      const paymentDate = new Date(payment.date);
      return paymentDate < thirtyDaysAgo;
    });

    return { data: overdue, success: true };
  }

  async markAsPaid(id: string): Promise<ApiResponse<Payment>> {
    return this.update(id, { status: 'completed' });
  }
}

// Create singleton instance
export const paymentService = new PaymentService();