import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { qk, useMarkNotificationRead } from '@/lib/queries';
import { useToast } from '@/components/ui/use-toast';
import { typeIcon } from '@/lib/notifications/typeIcon';
import type { NotificationDto } from '@/lib/api/types';

/**
 * Opens the notifications SSE stream while authenticated. On each incoming
 * notification: shows a clickable toast (navigate to the match + mark read),
 * bumps the unread-count cache, and invalidates the list. The browser
 * auto-reconnects EventSource; on (re)open we resync the unread count.
 */
export function useNotificationStream() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const { toast, dismiss } = useToast();
  const navigate = useNavigate();
  const markRead = useMarkNotificationRead();

  // Держим изменчивые зависимости в ref, чтобы EventSource не пересоздавался на
  // каждый ре-рендер (иначе стрим рвётся и пересоздаётся на каждый бамп бейджа).
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const dismissRef = useRef(dismiss);
  dismissRef.current = dismiss;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const markReadRef = useRef(markRead);
  markReadRef.current = markRead;

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
      const n = dto;
      let toastId: string;
      const onClick = () => {
        if (n.id) markReadRef.current.mutate(n.id);
        if (n.link) navigateRef.current(n.link);
        dismissRef.current(toastId);
      };
      toastId = toastRef.current({
        title: n.title,
        description: n.body ?? undefined,
        icon: typeIcon(n.type),
        onClick,
      });
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
      console.debug('notifications SSE error (will retry)');
    };

    return () => {
      es.removeEventListener('notification', onNotification as EventListener);
      es.close();
    };
  }, [isAuthenticated, qc]);
}
