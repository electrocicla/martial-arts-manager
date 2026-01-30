/**
 * Hook to fetch pending approvals count for admin/instructor users
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export function usePendingApprovalsCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user, accessToken } = useAuth();

  const fetchCount = useCallback(async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'instructor')) {
      setCount(0);
      return;
    }

    if (!accessToken) {
      console.log('[PendingApprovals] Waiting for access token...');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/auth/pending-approvals', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCount(data.pending_users?.length || data.users?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch pending approvals count:', error);
    } finally {
      setLoading(false);
    }
  }, [user, accessToken]);

  useEffect(() => {
    fetchCount();

    // Refresh count every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  return { count, loading, refetch: fetchCount };
}