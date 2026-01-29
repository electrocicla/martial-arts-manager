import { useState, useEffect, useCallback } from 'react';
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

  const fetchData = useCallback(async () => {
    if (!user) {
      setData(prev => ({ ...prev, isLoading: false, error: 'Not authenticated' }));
      return;
    }

    if (!user.student_id) {
      setData(prev => ({ ...prev, isLoading: false, error: 'Student ID not found' }));
      return;
    }

    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // Note: We no longer store access tokens in localStorage
      // The token should be passed as a parameter or obtained from context
      // For now, this will fail gracefully and prompt re-authentication
      const headers = {
        'Content-Type': 'application/json'
      };

      const [profileRes, classesRes, paymentsRes] = await Promise.all([
        fetch('/api/student/profile', { headers, credentials: 'include' }),
        fetch('/api/student/classes', { headers, credentials: 'include' }),
        fetch('/api/student/payments', { headers, credentials: 'include' })
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
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...data, refresh: fetchData };
}
