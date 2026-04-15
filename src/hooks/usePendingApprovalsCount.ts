/**
 * Hook to fetch pending approvals count for admin/instructor users
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api-client';
import { onDataEvent } from '../lib/dataEvents';

interface PendingApprovalsData {
  pending_users?: { id: string }[];
  users?: { id: string }[];
}

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

      const result = await apiClient.get<PendingApprovalsData>('/api/auth/pending-approvals');

      if (result.success && result.data) {
        setCount(result.data.pending_users?.length || result.data.users?.length || 0);
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

  // Also refetch immediately when another component approves/rejects an account
  useEffect(() => {
    return onDataEvent('pendingApprovals', fetchCount);
  }, [fetchCount]);

  return { count, loading, refetch: fetchCount };
}