import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api-client';
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

  const fetchData = useCallback(async (signal?: AbortSignal) => {
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

      const [profileRes, classesRes, paymentsRes] = await Promise.all([
        apiClient.get<Student>('/api/student/profile', { signal }),
        apiClient.get<Class[]>('/api/student/classes', { signal }),
        apiClient.get<Payment[]>('/api/student/payments', { signal })
      ]);

      if (signal?.aborted) return;

      if (!profileRes.success || !classesRes.success || !paymentsRes.success) {
        throw new Error('Failed to fetch dashboard data');
      }

      setData({
        profile: profileRes.data ?? null,
        classes: classesRes.data ?? [],
        payments: paymentsRes.data ?? [],
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
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  return { ...data, refresh: fetchData };
}
