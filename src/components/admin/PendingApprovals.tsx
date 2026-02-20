/**
 * PendingApprovals - Admin/Instructor component to approve or reject pending user accounts
 * Mobile + Desktop responsive with Tailwind styling
 */

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, UserCheck, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dispatchDataEvent } from '../../lib/dataEvents';

interface PendingUser {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  registration_notes?: string;
}

interface PendingApprovalsResponse {
  pending_users?: PendingUser[];
  users?: PendingUser[];
  error?: string;
}

export function PendingApprovals() {
  const { accessToken } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPendingUsers = useCallback(async () => {
    if (!accessToken) {
      console.log('[PendingApprovals] Waiting for access token...');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/pending-approvals', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({ error: 'Failed to fetch pending approvals' }))) as PendingApprovalsResponse;
        throw new Error(data.error || 'Failed to fetch pending approvals');
      }

      const data = (await response.json()) as PendingApprovalsResponse;
      setPendingUsers(data.pending_users || data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const handleApprove = async (userId: string, userName: string) => {
    if (!confirm(`Approve the account for ${userName}?`)) {
      return;
    }

    if (!accessToken) {
      setError('No authentication token');
      return;
    }

    try {
      setProcessingId(userId);
      setError(null);

      const response = await fetch('/api/auth/pending-approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({ error: 'Failed to approve account' }))) as PendingApprovalsResponse;
        throw new Error(data.error || 'Failed to approve account');
      }

      // Update local state immediately
      setPendingUsers((prev) => prev.filter((user) => user.id !== userId));
      dispatchDataEvent('pendingApprovals');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve account');
      console.error('[PendingApprovals] Approve error:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string, userName: string) => {
    if (!confirm(`Reject the account for ${userName}? This will deactivate the account.`)) {
      return;
    }

    if (!accessToken) {
      setError('No authentication token');
      return;
    }

    try {
      setProcessingId(userId);
      setError(null);

      const response = await fetch(`/api/auth/pending-approvals?user_id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({ error: 'Failed to reject account' }))) as PendingApprovalsResponse;
        throw new Error(data.error || 'Failed to reject account');
      }

      // Update local state immediately
      setPendingUsers((prev) => prev.filter((user) => user.id !== userId));
      dispatchDataEvent('pendingApprovals');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject account');
      console.error('[PendingApprovals] Reject error:', err);
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchPendingUsers();
    }
  }, [fetchPendingUsers, accessToken]);

  // Don't show loading on initial render if we haven't started fetching yet
  if (loading && pendingUsers.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  if (pendingUsers.length === 0 && !loading && !error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center text-gray-400">
          <CheckCircle2 className="mx-auto h-12 w-12 mb-3" />
          <p className="font-semibold">No pending accounts</p>
          <p className="text-sm mt-1">All accounts have been processed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-yellow-500/30">
      {/* Error Alert */}
      {error && (
        <div className="mb-4 bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-400">Error</p>
              <p className="text-sm text-red-300 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-600 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Pending approvals</h3>
            <p className="text-sm text-gray-400">New accounts require approval</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-yellow-600 text-white text-sm font-bold rounded-full">
            {pendingUsers.length}
          </span>
          <button
            onClick={fetchPendingUsers}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {pendingUsers.map((user) => (
          <div
            key={user.id}
            className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
          >
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold text-base truncate mb-1">{user.name}</h4>
                  <p className="text-gray-400 text-sm truncate mb-2">{user.email}</p>
                  <div className="text-xs text-gray-500">
                    Registered: {new Date(user.created_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <span className="px-3 py-1 bg-blue-900 text-blue-200 text-xs font-medium rounded-full whitespace-nowrap self-start">
                  {user.role}
                </span>
              </div>

              {user.registration_notes && (
                <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-600">
                  <span className="font-semibold text-gray-300 text-xs">Notes:</span>
                  <p className="text-xs text-gray-300 mt-1">{user.registration_notes}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleApprove(user.id, user.name)}
                disabled={processingId === user.id}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px]"
              >
                {processingId === user.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Processing...
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 flex-shrink-0" />
                    Approve account
                  </>
                )}
              </button>

              <button
                onClick={() => handleReject(user.id, user.name)}
                disabled={processingId === user.id}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px]"
              >
                {processingId === user.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Processing...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 flex-shrink-0" />
                    Reject account
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
