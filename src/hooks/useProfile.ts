import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
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

  const fetchData = useCallback(async () => {
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

      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      // Student endpoint requires a valid student_id.
      // For admin/instructor (or students not linked yet), use auth/me directly.
      const shouldUseStudentEndpoint = user.role === 'student' && Boolean(user.student_id);

      let profilePayload: Student | null = null;

      if (shouldUseStudentEndpoint) {
        const profileRes = await fetch('/api/student/profile', { headers });

        if (profileRes.ok) {
          profilePayload = await profileRes.json() as Student;
        } else {
          // Graceful fallback for legacy users when student profile is temporarily unavailable
          const userRes = await fetch('/api/auth/me', { headers });
          if (!userRes.ok) {
            throw new Error('Failed to fetch profile data');
          }

          const userData = await userRes.json();
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
        const userRes = await fetch('/api/auth/me', { headers });
        if (!userRes.ok) {
          throw new Error('Failed to fetch profile data');
        }

        const userData = await userRes.json();
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

      setData({
        profile: profilePayload,
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