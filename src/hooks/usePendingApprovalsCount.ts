/**
 * Hook to fetch pending approvals count for admin/instructor users
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function usePendingApprovalsCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCount = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'instructor')) {
      setCount(0);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('/api/auth/pending-approvals', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCount(data.users?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch pending approvals count:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();

    // Refresh count every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user, fetchCount]);

  return { count, loading, refetch: fetchCount };
}