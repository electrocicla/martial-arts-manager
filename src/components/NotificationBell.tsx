/**
 * NotificationBell Component
 * 
 * Displays a bell icon with unread notification count
 * and a dropdown to view/manage notifications
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, X, Check, Trash2, Loader2 } from 'lucide-react';
import { apiClient } from '../lib/api-client';
import { useAuth } from '../context/AuthContext';

interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: string;
  read: number;
  created_at: string;
}

export default function NotificationBell() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await apiClient.get<{ notifications: Notification[] }>('/api/notifications');
      
      if (response.success && response.data) {
        const notifs = response.data.notifications || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => n.read === 0).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await apiClient.put(`/api/notifications?id=${notificationId}`, {});
      
      if (response.success) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: 1 } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await apiClient.delete(`/api/notifications?id=${notificationId}`);
      
      if (response.success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        const notification = notifications.find(n => n.id === notificationId);
        if (notification && notification.read === 0) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => n.read === 0);
    
    for (const notification of unreadNotifications) {
      await markAsRead(notification.id);
    }
  };

  if (!user) return null;

  return (
    <div className="dropdown dropdown-end">
      <button
        tabIndex={0}
        className="btn btn-ghost btn-circle"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="indicator">
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="badge badge-sm badge-error indicator-item">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </button>

      {showDropdown && (
        <div
          tabIndex={0}
          className="dropdown-content z-[1] menu p-0 shadow-xl bg-base-200 rounded-2xl w-80 md:w-96 mt-3 border-2 border-base-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {t('notifications.title', 'Notifications')}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="btn btn-ghost btn-xs gap-1"
                  title={t('notifications.markAllRead', 'Mark all as read')}
                >
                  <Check className="w-4 h-4" />
                  {t('notifications.all', 'All')}
                </button>
              )}
              <button
                onClick={() => setShowDropdown(false)}
                className="btn btn-ghost btn-xs btn-circle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Bell className="w-12 h-12 mx-auto text-base-content/30 mb-2" />
                <p className="text-base-content/70">
                  {t('notifications.empty', 'No notifications')}
                </p>
              </div>
            ) : (
              <ul className="menu p-2">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <div
                      className={`flex items-start gap-3 p-3 rounded-xl ${
                        notification.read === 0
                          ? 'bg-primary/10 hover:bg-primary/20'
                          : 'hover:bg-base-300'
                      }`}
                    >
                      <div className="flex-1">
                        <p className={`text-sm ${notification.read === 0 ? 'font-semibold' : ''}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-base-content/60 mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {notification.read === 0 && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="btn btn-ghost btn-xs btn-circle"
                            title={t('notifications.markRead', 'Mark as read')}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="btn btn-ghost btn-xs btn-circle hover:btn-error"
                          title={t('notifications.delete', 'Delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
