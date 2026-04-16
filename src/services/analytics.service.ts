/**
 * Analytics Service
 * Fetches pre-computed analytics from the server
 */

import { apiClient, type ApiResponse } from '../lib/api-client';

export interface AnalyticsData {
  students: {
    total: number;
    active: number;
    newThisMonth: number;
    byBelt: Record<string, number>;
    byDiscipline: Record<string, number>;
  };
  payments: {
    totalRevenue: number;
    thisMonthRevenue: number;
    recentPayments: number;
    byType: Record<string, number>;
  };
  classes: {
    total: number;
    active: number;
    thisWeek: number;
    todayClasses: unknown[];
    upcomingClasses: number;
  };
  attendance: {
    totalThisMonth: number;
    averagePerClass: number;
  };
  recentStudents: unknown[];
  recentPayments: unknown[];
}

export class AnalyticsService {
  private readonly endpoint = '/api/analytics';

  async get(options?: { signal?: AbortSignal }): Promise<ApiResponse<AnalyticsData>> {
    return apiClient.get<AnalyticsData>(this.endpoint, { signal: options?.signal });
  }
}

export const analyticsService = new AnalyticsService();
