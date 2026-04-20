import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '../lib/api-client';
import { onDataEvent } from '../lib/dataEvents';

interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: string;
  read: number;
  created_at: string;
}

interface PendingApprovalsData {
  pending_users?: { id: string }[];
  users?: { id: string }[];
}

interface PollingContextType {
  pendingApprovalsCount: number;
  pendingApprovalsLoading: boolean;
  notifications: Notification[];
  unreadCount: number;
  notificationsLoading: boolean;
  refetchPendingApprovals: () => Promise<void>;
  refetchNotifications: () => Promise<void>;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

const PollingContext = createContext<PollingContextType | null>(null);

const POLL_INTERVAL = 30_000;

export function PollingProvider({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuth();

  // Pending approvals state
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [pendingApprovalsLoading, setPendingApprovalsLoading] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const fetchPendingApprovals = useCallback(async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'instructor')) {
      setPendingApprovalsCount(0);
      return;
    }
    if (!accessToken) return;

    try {
      setPendingApprovalsLoading(true);
      const result = await apiClient.get<PendingApprovalsData>('/api/auth/pending-approvals');
      if (result.success && result.data) {
        setPendingApprovalsCount(result.data.pending_users?.length || result.data.users?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch pending approvals count:', error);
    } finally {
      setPendingApprovalsLoading(false);
    }
  }, [user, accessToken]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setNotificationsLoading(true);
      const response = await apiClient.get<{ notifications: Notification[] }>('/api/notifications');
      if (response.success && response.data) {
        const notifs = response.data.notifications || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => n.read === 0).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  }, [user]);

  // Single polling interval for both
  useEffect(() => {
    fetchPendingApprovals();
    fetchNotifications();

    const interval = setInterval(() => {
      fetchPendingApprovals();
      fetchNotifications();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchPendingApprovals, fetchNotifications]);

  // React to data events for immediate refetch
  useEffect(() => {
    return onDataEvent('pendingApprovals', fetchPendingApprovals);
  }, [fetchPendingApprovals]);

  useEffect(() => {
    return onDataEvent('notifications', fetchNotifications);
  }, [fetchNotifications]);

  return (
    <PollingContext.Provider
      value={{
        pendingApprovalsCount,
        pendingApprovalsLoading,
        notifications,
        unreadCount,
        notificationsLoading,
        refetchPendingApprovals: fetchPendingApprovals,
        refetchNotifications: fetchNotifications,
        setNotifications,
        setUnreadCount,
      }}
    >
      {children}
    </PollingContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePolling() {
  const ctx = useContext(PollingContext);
  if (!ctx) throw new Error('usePolling must be used within a PollingProvider');
  return ctx;
}
