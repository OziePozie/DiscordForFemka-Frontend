import { useEffect } from 'react';
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
      toast({ title: dto.title, description: dto.body ?? undefined });
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
  }, [isAuthenticated, qc, toast]);
}
