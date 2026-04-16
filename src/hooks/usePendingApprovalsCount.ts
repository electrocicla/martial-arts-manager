/**
 * Hook to fetch pending approvals count for admin/instructor users.
 * Delegates to shared PollingContext to avoid duplicate polling intervals.
 */

import { usePolling } from '../context/PollingContext';

export function usePendingApprovalsCount() {
  const { pendingApprovalsCount, pendingApprovalsLoading, refetchPendingApprovals } = usePolling();

  return {
    count: pendingApprovalsCount,
    loading: pendingApprovalsLoading,
    refetch: refetchPendingApprovals,
  };
}