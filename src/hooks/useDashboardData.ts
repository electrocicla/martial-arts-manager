import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services';
import type { Class, Payment } from '../types/index';

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  classesThisWeek: number;
  revenueThisMonth: number;
  newEnrollments: number;
  upcomingClasses: number;
}

interface DashboardData {
  stats: DashboardStats;
  todayClasses: Class[];
  recentStudents: unknown[];
  recentPayments: Payment[];
  isLoading: boolean;
  error: string | null;
}

export function useDashboardData(): DashboardData {
  const { user, accessToken } = useAuth();
  const [data, setData] = useState<DashboardData>({
    stats: {
      totalStudents: 0,
      activeStudents: 0,
      classesThisWeek: 0,
      revenueThisMonth: 0,
      newEnrollments: 0,
      upcomingClasses: 0,
    },
    todayClasses: [],
    recentStudents: [],
    recentPayments: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    async function fetchDashboardData() {
      if (user?.role === 'student') {
        setData(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Wait for authentication token to be available
      if (!accessToken) {
        console.log('[Dashboard] Waiting for access token...');
        return;
      }

      try {
        setData(prev => ({ ...prev, isLoading: true, error: null }));

        const res = await analyticsService.get({ signal });

        if (signal.aborted) return;

        if (!res.data) {
          throw new Error('Failed to fetch dashboard data');
        }

        const analytics = res.data;

        setData({
          stats: {
            totalStudents: analytics.students.total,
            activeStudents: analytics.students.active,
            classesThisWeek: analytics.classes.thisWeek,
            revenueThisMonth: analytics.payments.thisMonthRevenue,
            newEnrollments: analytics.students.newThisMonth,
            upcomingClasses: analytics.classes.upcomingClasses,
          },
          todayClasses: analytics.classes.todayClasses as Class[],
          recentStudents: analytics.recentStudents,
          recentPayments: analytics.recentPayments as Payment[],
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load dashboard data',
        }));
      }
    }

    fetchDashboardData();
    return () => controller.abort();
  }, [user?.role, accessToken]);

  return data;
}