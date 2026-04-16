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

    // Wait for access token to be available
    if (!accessToken) {
      console.log('[Profile] Waiting for access token...');
      return;
    }

    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // Student endpoint requires a valid student_id.
      // For admin/instructor (or students not linked yet), use auth/me directly.
      const shouldUseStudentEndpoint = user.role === 'student' && Boolean(user.student_id);

      let profilePayload: Student | null = null;

      if (shouldUseStudentEndpoint) {
        const profileRes = await apiClient.get<Student>('/api/student/profile', { signal });

        if (profileRes.success && profileRes.data) {
          profilePayload = profileRes.data;
        } else {
          // Graceful fallback for legacy users when student profile is temporarily unavailable
          const userRes = await apiClient.get<{ user: { id: string; name: string; email: string; role: string; avatar_url?: string } }>('/api/auth/me', { signal });
          if (!userRes.success || !userRes.data) {
            throw new Error('Failed to fetch profile data');
          }

          const userData = userRes.data;
          profilePayload = {
            id: userData.user.id,
            name: userData.user.name,
            email: userData.user.email,
            role: userData.user.role,
            avatar_url: userData.user.avatar_url,
            discipline: 'Unknown',
            belt: 'Unknown',
            join_date: new Date().toISOString(),
            date_of_birth: undefined,
            emergency_contact_name: undefined,
            emergency_contact_phone: undefined,
            notes: undefined,
            is_active: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            phone: undefined,
            created_by: undefined,
            updated_by: undefined,
            deleted_at: undefined
          } as Student;
        }
      } else {
        const userRes = await apiClient.get<{ user: { id: string; name: string; email: string; role: string; avatar_url?: string } }>('/api/auth/me', { signal });
        if (!userRes.success || !userRes.data) {
          throw new Error('Failed to fetch profile data');
        }

        const userData = userRes.data;
        profilePayload = {
          id: userData.user.id,
          name: userData.user.name,
          email: userData.user.email,
          role: userData.user.role,
          avatar_url: userData.user.avatar_url,
          discipline: 'Unknown',
          belt: 'Unknown',
          join_date: new Date().toISOString(),
          date_of_birth: undefined,
          emergency_contact_name: undefined,
          emergency_contact_phone: undefined,
          notes: undefined,
          is_active: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          phone: undefined,
          created_by: undefined,
          updated_by: undefined,
          deleted_at: undefined
        } as Student;
      }

      if (signal?.aborted) return;

      setData({
        profile: profilePayload,
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