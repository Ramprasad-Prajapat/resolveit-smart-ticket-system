// Notification context managing live alert toasts and periodic polling for unread notifications.
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as api from './api';
import { POLL_SECONDS, ALERT_SECONDS } from './constants';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [toasts, setToasts] = useState([]);
  const shownIds = useRef(new Set());
  const timersRef = useRef(new Map());

  const dismissToast = useCallback((toastOrId) => {
    const id = typeof toastOrId === 'object' ? toastOrId.id : toastOrId;

    // Clear auto-close timer if still active
    if (timersRef.current.has(id)) {
      clearTimeout(timersRef.current.get(id));
      timersRef.current.delete(id);
    }

    setToasts((prev) => {
      const target = prev.find((t) => t.id === id);
      if (target && !target.isLocal) {
        api.markNotificationRead(target.id).catch(() => {});
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const showToast = useCallback(({ type = 'INFO', title, message, ticketNumber, complaintId }) => {
    const localId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newToast = {
      id: localId,
      type,
      title: title || 'Notice',
      message: message || '',
      ticketNumber: ticketNumber || null,
      complaintId: complaintId || null,
      isLocal: true,
      createdAt: new Date().toISOString(),
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss timer
    const timer = setTimeout(() => {
      dismissToast(localId);
    }, ALERT_SECONDS * 1000);
    timersRef.current.set(localId, timer);
  }, [dismissToast]);

  const pollUnread = useCallback(async () => {
    if (typeof document !== 'undefined' && document.hidden) {
      return;
    }

    try {
      const unreadList = await api.getUnreadNotifications();
      if (!Array.isArray(unreadList) || unreadList.length === 0) {
        return;
      }

      const freshToasts = [];
      for (const item of unreadList) {
        if (!shownIds.current.has(item.id)) {
          shownIds.current.add(item.id);
          const toastItem = {
            id: item.id,
            type: item.type,
            title: item.title,
            message: item.message,
            ticketNumber: item.ticketNumber,
            complaintId: item.complaintId,
            isLocal: false,
            createdAt: item.createdAt,
          };
          freshToasts.push(toastItem);

          // Auto-close timer
          const timer = setTimeout(() => {
            dismissToast(item.id);
          }, ALERT_SECONDS * 1000);
          timersRef.current.set(item.id, timer);
        }
      }

      if (freshToasts.length > 0) {
        setToasts((prev) => [...prev, ...freshToasts]);
      }
    } catch (e) {
      // Ignore polling errors silently (e.g. temporary network glitch or server restart)
    }
  }, [dismissToast]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Clear state when user is logged out
      setToasts([]);
      shownIds.current.clear();
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
      return;
    }

    // Initial check
    pollUnread();

    // Setup periodic polling
    const intervalId = setInterval(pollUnread, POLL_SECONDS * 1000);

    // Visibility change handler
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        pollUnread();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, user?.id, pollUnread]);

  return (
    <NotificationContext.Provider value={{ toasts, dismissToast, showToast }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return ctx;
}
