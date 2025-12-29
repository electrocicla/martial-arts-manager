import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Student } from '../types';

interface ProfileData {
  profile: Student | null;
  isLoading: boolean;
  error: string | null;
}

export function useProfile() {
  const { user } = useAuth();
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

    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // For now, use student profile endpoint for all roles
      // If user doesn't have student_id, we'll handle it gracefully
      const endpoint = '/api/student/profile';

      const profileRes = await fetch(endpoint, { headers });

      if (!profileRes.ok) {
        // If profile endpoint fails, try to get basic user info from /api/auth/me
        const userRes = await fetch('/api/auth/me', { headers });
        if (!userRes.ok) {
          throw new Error('Failed to fetch profile data');
        }

        const userData = await userRes.json();

        // Create a basic profile from user data
        const basicProfile = {
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
        };

        setData({
          profile: basicProfile,
          isLoading: false,
          error: null
        });
        return;
      }

      const profile = await profileRes.json();

      setData({
        profile,
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