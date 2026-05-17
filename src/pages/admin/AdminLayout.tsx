import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const NAV: Array<{ to: string; label: string; disabled?: boolean }> = [
  { to: '/admin/mmr', label: 'MMR-заявки' },
  { to: '/admin/seasons', label: 'Сезоны' },
  { to: '/admin/tournaments', label: 'Турниры' },
  { to: '/admin/matches', label: 'Матчи' },
  { to: '/admin/players', label: 'Игроки' },
  { to: '/admin/audit', label: 'Журнал' },
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
    <div className="grid gap-6 md:grid-cols-[200px_1fr]">
      <aside className="space-y-1">
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
  );
}
