import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api-client';
import type { Student } from '../types';

interface ProfileData {
  profile: Student | null;
  isLoading: boolean;
  error: string | null;
}

export function useProfile() {
  const { user, accessToken } = useAuth();
  const [data, setData] = useState<ProfileData>({
    profile: null,
    isLoading: true,
    error: null,
  });

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (!user) {
      setData(prev => ({ ...prev, isLoading: false, error: 'Not authenticated' }));
      return;
    }

    if (!accessToken) {
      setData(prev => ({ ...prev, isLoading: true, error: null }));
      return;
    }

    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      const profileRes = await apiClient.get<Student>('/api/account/profile', { signal });
      if (!profileRes.success || !profileRes.data) {
        throw new Error(profileRes.error || 'Failed to fetch profile data');
      }

      if (signal?.aborted) return;

      setData({
        profile: profileRes.data,
        isLoading: false,
        error: null
      });
    } catch (err) {
      if (signal?.aborted) return;
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