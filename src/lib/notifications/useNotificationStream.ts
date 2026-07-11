import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { qk } from '@/lib/queries';
import { useToast } from '@/components/ui/use-toast';
import type { NotificationDto } from '@/lib/api/types';

/**
 * Opens the notifications SSE stream while authenticated. On each incoming
 * notification: shows a toast, bumps the unread-count cache, and invalidates the
 * list so an open dropdown refreshes. The browser auto-reconnects EventSource;
 * on (re)open we resync the unread count in case events were missed.
 */
export function useNotificationStream() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  // useToast() returns a fresh `toast` identity every render. Keep it in a ref so
  // it is NOT an effect dependency — otherwise the EventSource would tear down and
  // reconnect on every re-render (each badge bump / dropdown toggle), defeating the
  // persistent stream and hammering the backend.
  const toastRef = useRef(toast);
  toastRef.current = toast;

  useEffect(() => {
    if (!isAuthenticated) return;

    const es = new EventSource('/api/v1/notifications/stream', {
      withCredentials: true,
    });

    const onNotification = (e: MessageEvent) => {
      let dto: NotificationDto | null = null;
      try {
        dto = JSON.parse(e.data) as NotificationDto;
      } catch {
        return;
      }
      toastRef.current({ title: dto.title, description: dto.body ?? undefined });
      qc.setQueryData<{ count: number }>(qk.notificationsUnread, (prev) => ({
        count: (prev?.count ?? 0) + 1,
      }));
      qc.invalidateQueries({ queryKey: ['notifications', 'list'] });
    };

    es.addEventListener('notification', onNotification as EventListener);
    es.onopen = () => {
      qc.invalidateQueries({ queryKey: qk.notificationsUnread });
    };
    es.onerror = () => {
      // EventSource auto-reconnects; this fires routinely on transient drops.
      console.debug('notifications SSE error (will retry)');
    };

    return () => {
      es.removeEventListener('notification', onNotification as EventListener);
      es.close();
    };
  }, [isAuthenticated, qc]);
}
