import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const NAV: Array<{ to: string; label: string; disabled?: boolean }> = [
  { to: '/admin/mmr', label: 'MMR-заявки' },
  { to: '/admin/seasons', label: 'Сцены' },
  { to: '/admin/hero-groups', label: 'Группы героев' },
  { to: '/admin/achievements', label: 'Достижения' },
  { to: '/admin/tournaments', label: 'Турниры' },
  { to: '/admin/matches', label: 'Матчи' },
  { to: '/admin/players', label: 'Игроки' },
  { to: '/admin/teams', label: 'Команды' },
  { to: '/admin/audit', label: 'Журнал' },
  { to: '/admin/bots', label: 'Боты' },
  { to: '/admin/lobbies', label: 'Лобби' },
];

export default function AdminLayout() {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isStaff = !!session?.roles?.some(
    (r) => r === 'MODERATOR' || r === 'ADMIN',
  );

  useEffect(() => {
    if (isLoading) return;
    if (!isStaff) {
      toast({
        title: 'Нет доступа',
        description: 'Требуется роль MODERATOR или ADMIN',
        variant: 'destructive',
      });
      const t = setTimeout(() => navigate('/', { replace: true }), 2000);
      return () => clearTimeout(t);
    }
  }, [isLoading, isStaff, navigate, toast]);

  if (isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }

  if (!isStaff) {
    return (
      <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-6 text-destructive">
        <div className="font-semibold">Нет доступа</div>
        <div className="text-sm">
          Эта секция доступна только модераторам и администраторам. Сейчас вас
          перенаправит на главную.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <nav className="flex gap-2 overflow-x-auto pb-1 md:hidden">
        {NAV.map((item) =>
          item.disabled ? (
            <span
              key={item.to}
              className="shrink-0 cursor-not-allowed whitespace-nowrap rounded-full border border-line px-3 py-1.5 text-xs text-muted-foreground opacity-50"
              title="Будет в следующей итерации"
            >
              {item.label}
            </span>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors',
                  isActive
                    ? 'border-transparent bg-accent text-accent-foreground'
                    : 'border-line text-muted-foreground hover:bg-accent hover:text-foreground',
                )
              }
            >
              {item.label}
            </NavLink>
          ),
        )}
      </nav>

      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        <aside className="hidden space-y-1 md:block">
          <h2 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Админка
          </h2>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) =>
              item.disabled ? (
                <span
                  key={item.to}
                  className="cursor-not-allowed rounded-md px-3 py-2 text-sm text-muted-foreground opacity-50"
                  title="Будет в следующей итерации"
                >
                  {item.label}
                </span>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-md px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ),
            )}
          </nav>
        </aside>
        <section>
          <Outlet />
        </section>
      </div>
    </div>
  );
}
