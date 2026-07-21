import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import {
  useUnreadCount,
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/lib/queries';
import { useNotificationStream } from '@/lib/notifications/useNotificationStream';
import { typeIcon } from '@/lib/notifications/typeIcon';
import { timeAgoRu } from '@/lib/format';
import type { NotificationDto } from '@/lib/api/types';

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  useNotificationStream();

  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const unread = useUnreadCount(isAuthenticated);
  const list = useNotifications(0, 20, isAuthenticated && open);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  if (!isAuthenticated) return null;

  const count = unread.data?.count ?? 0;
  const items: NotificationDto[] = list.data?.items ?? [];

  const onItemClick = (n: NotificationDto) => {
    if (!n.read && n.id) markRead.mutate(n.id);
    if (n.link) navigate(n.link);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Уведомления"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge
              variant="default"
              className="absolute -right-0.5 -top-0.5 h-4 min-w-4 justify-center px-1 text-[10px]"
            >
              {count > 99 ? '99+' : count}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-line px-3 py-2">
          <span className="text-sm font-semibold text-ink">Уведомления</span>
          {count > 0 && (
            <button
              className="text-xs text-ink-muted hover:text-ink disabled:opacity-50"
              disabled={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              Прочитать все
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {list.isLoading ? (
            <p className="px-3 py-6 text-center text-sm text-ink-muted">Загрузка…</p>
          ) : list.isError ? (
            <p className="px-3 py-6 text-center text-sm text-ink-muted">Не удалось загрузить</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-ink-muted">Пока нет уведомлений</p>
          ) : (
            items.map((n) => {
              const Icon = typeIcon(n.type);
              return (
                <button
                  key={n.id}
                  onClick={() => onItemClick(n)}
                  className={`flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-secondary ${
                    n.read ? '' : 'bg-accent'
                  }`}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{n.title}</span>
                    <span className="block truncate text-xs text-ink-muted">{n.body}</span>
                    <span className="block text-[11px] text-ink-faint">
                      {timeAgoRu(n.createdAt) ?? ''}
                    </span>
                  </span>
                  {!n.read && <span className="ec-dot mt-1.5 shrink-0 bg-brand" aria-hidden />}
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
