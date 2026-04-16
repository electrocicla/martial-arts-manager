import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentService, classService, paymentService } from '../services';
import { parseLocalDate } from '../lib/utils';
import type { Student, Payment, Class } from '../types/index';

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
  recentStudents: Student[];
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

        // Fetch all data in parallel using services
        const [studentsRes, classesRes, paymentsRes] = await Promise.all([
          studentService.getAll(undefined, { signal }),
          classService.getAll(undefined, { signal }),
          paymentService.getAll(undefined, { signal }),
        ]);

        if (signal.aborted) return;

        const students = studentsRes.data;
        const classes = classesRes.data;
        const payments = paymentsRes.data;

        if (!students || !classes || !payments) {
          throw new Error('Failed to fetch dashboard data');
        }

        // Calculate stats
        const now = new Date();
        // Build today string using local parts to avoid UTC-date shift
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        // nextMonthStart as upper bound so future-dated payments within the month are included
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const todayClasses = classes.filter(cls => {
          const classDate = cls.date;
          return classDate === today;
        });

        const thisWeekClasses = classes.filter(cls => {
          const classDate = parseLocalDate(cls.date);
          return classDate >= weekStart && classDate <= now;
        });

        // Use parseLocalDate so "YYYY-MM-DD" strings are parsed as local midnight (not UTC),
        // and use nextMonthStart as upper bound so admin-entered future dates within the
        // current month are always counted in the monthly total.
        const thisMonthPayments = payments.filter(payment => {
          const paymentDate = parseLocalDate(payment.date);
          return paymentDate >= monthStart && paymentDate < nextMonthStart;
        });

        const thisMonthStudents = students.filter(student => {
          const joinDate = parseLocalDate(student.join_date);
          return joinDate >= monthStart && joinDate <= now;
        });

        const revenueThisMonth = thisMonthPayments.reduce((sum, payment) => {
          if (payment.status === 'completed') {
            return sum + payment.amount;
          }
          if (payment.status === 'refunded') {
            return sum - payment.amount;
          }
          return sum;
        }, 0);

        const upcomingClasses = classes.filter(cls => {
          const classDate = new Date(cls.date);
          return classDate > now;
        });

        setData({
          stats: {
            totalStudents: students.length,
            activeStudents: students.filter(s => s.is_active === 1).length,
            classesThisWeek: thisWeekClasses.length,
            revenueThisMonth,
            newEnrollments: thisMonthStudents.length,
            upcomingClasses: upcomingClasses.length,
          },
          todayClasses: todayClasses.slice(0, 5), // Show max 5 classes
          recentStudents: students.slice(-5).reverse(), // Last 5 students
          recentPayments: payments.slice(-5).reverse(), // Last 5 payments
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