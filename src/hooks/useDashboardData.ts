import { useState, useEffect } from 'react';
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
    async function fetchDashboardData() {
      try {
        setData(prev => ({ ...prev, isLoading: true, error: null }));

        // Fetch all data in parallel
        const [studentsRes, classesRes, paymentsRes] = await Promise.all([
          fetch('/api/students'),
          fetch('/api/classes'),
          fetch('/api/payments'),
        ]);

        if (!studentsRes.ok || !classesRes.ok || !paymentsRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const [students, classes, payments] = await Promise.all([
          studentsRes.json() as Promise<Student[]>,
          classesRes.json() as Promise<Class[]>,
          paymentsRes.json() as Promise<Payment[]>,
        ]);

        // Calculate stats
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const todayClasses = classes.filter(cls => {
          const classDate = cls.date;
          return classDate === today;
        });

        const thisWeekClasses = classes.filter(cls => {
          const classDate = new Date(cls.date);
          return classDate >= weekStart && classDate <= now;
        });

        const thisMonthPayments = payments.filter(payment => {
          const paymentDate = new Date(payment.date);
          return paymentDate >= monthStart && paymentDate <= now;
        });

        const thisMonthStudents = students.filter(student => {
          const joinDate = new Date(student.join_date);
          return joinDate >= monthStart && joinDate <= now;
        });

        const revenueThisMonth = thisMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);

        const upcomingClasses = classes.filter(cls => {
          const classDate = new Date(cls.date);
          return classDate > now;
        });

        setData({
          stats: {
            totalStudents: students.length,
            activeStudents: students.length, // For now, assume all are active
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
  }, []);

  return data;
}