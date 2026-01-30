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
  const { user, accessToken } = useAuth();
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

    // Wait for access token to be available
    if (!accessToken) {
      console.log('[StudentDashboard] Waiting for access token...');
      return;
    }

    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      const headers = {
        'Authorization': `Bearer ${accessToken}`,
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
  }, [user, accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...data, refresh: fetchData };
}
