import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Student, Class, Payment } from '../types';

interface StudentDashboardData {
  profile: Student | null;
  classes: Class[];
  payments: Payment[];
  isLoading: boolean;
  error: string | null;
}

export function useStudentDashboardData() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentDashboardData>({
    profile: null,
    classes: [],
    payments: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchData() {
      if (!user?.studentId) return;

      try {
        setData(prev => ({ ...prev, isLoading: true, error: null }));

        const [profileRes, classesRes, paymentsRes] = await Promise.all([
          fetch('/api/student/profile'),
          fetch('/api/student/classes'),
          fetch('/api/student/payments')
        ]);

        if (!profileRes.ok || !classesRes.ok || !paymentsRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const [profile, classes, payments] = await Promise.all([
          profileRes.json(),
          classesRes.json(),
          paymentsRes.json()
        ]);

        setData({
          profile,
          classes,
          payments,
          isLoading: false,
          error: null
        });
      } catch (err) {
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: (err as Error).message
        }));
      }
    }

    fetchData();
  }, [user?.studentId]);

  return data;
}
