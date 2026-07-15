import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User, Users, Mail } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth';
import { useLogout, useMyInvites } from '@/lib/queries';
import { steamLoginUrl } from '@/lib/api/endpoints';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';

export default function Header() {
  const { session, isAuthenticated, isLoading } = useAuth();
  const logout = useLogout();
  const location = useLocation();
  const navigate = useNavigate();

  const isStaff = !!session?.roles?.some(
    (r) => r === 'MODERATOR' || r === 'ADMIN',
  );

  // Pull a tiny page of incoming invites just to know whether the badge
  // should appear. Disabled for anonymous users to avoid 401s.
  const invitesProbe = useMyInvites(
    { status: 'PENDING', page: 0, size: 5 },
    { enabled: isAuthenticated },
  );
  const pendingInviteCount = isAuthenticated
    ? (invitesProbe.data?.items ?? []).filter((i) => i.status === 'PENDING')
        .length
    : 0;

  function handleLogin() {
    const returnTo = location.pathname === '/' ? '/profile' : location.pathname;
    window.location.href = steamLoginUrl(returnTo);
  }

  async function handleLogout() {
    await logout.mutateAsync();
    navigate('/');
  }

  const initials = (session?.nickname ?? '?').slice(0, 2).toUpperCase();

  const navLink = (to: string, exact = false) => {
    const active = exact
      ? location.pathname === to
      : location.pathname === to || location.pathname.startsWith(`${to}/`);
    return active
      ? 'font-bold text-ink'
      : 'font-medium text-ink-muted transition-colors hover:text-ink';
  };

  return (
    <header className="border-b border-line bg-background">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center" aria-label="Play Stage — на главную">
            <img
              src="/logo.png"
              alt="Play Stage"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <nav className="hidden gap-6 text-sm sm:flex">
            <Link to="/" className={navLink('/', true)}>
              Главная
            </Link>
            <Link to="/scenes" className={navLink('/scenes')}>
              Сцены
            </Link>
            <Link to="/teams" className={navLink('/teams')}>
              Команды
            </Link>
            <Link to="/leaderboard" className={navLink('/leaderboard')}>
              Рейтинг
            </Link>
            <Link to="/archive" className={navLink('/archive')}>
              Архив
            </Link>
            <Link to="/lobbies" className={navLink('/lobbies')}>
              Лобби
            </Link>
            {isAuthenticated && pendingInviteCount > 0 && (
              <Link
                to="/me/invites"
                className={`flex items-center gap-1.5 ${navLink('/me/invites')}`}
              >
                Приглашения
                <Badge variant="default" className="h-5 px-1.5 text-xs">
                  {pendingInviteCount}
                </Badge>
              </Link>
            )}
            {isAuthenticated && (
              <Link to="/profile" className={navLink('/profile')}>
                Профиль
              </Link>
            )}
            {isStaff && (
              <Link to="/admin/mmr" className={navLink('/admin')}>
                Админка
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationBell />
          {isLoading ? (
            <div className="h-10 w-24 animate-pulse rounded-md bg-muted" />
          ) : isAuthenticated && session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Меню пользователя"
                >
                  <Avatar>
                    {session.avatarUrl && (
                      <AvatarImage src={session.avatarUrl} alt="" />
                    )}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[12.5rem]">
                <DropdownMenuLabel>
                  {session.nickname ?? 'Без ника'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Профиль
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/teams/new')}>
                  <Users className="mr-2 h-4 w-4" />
                  Создать команду
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/me/invites')}>
                  <Mail className="mr-2 h-4 w-4" />
                  Приглашения
                  {pendingInviteCount > 0 && (
                    <Badge
                      variant="default"
                      className="ml-auto h-5 px-1.5 text-xs"
                    >
                      {pendingInviteCount}
                    </Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              className="ec-btn ec-btn-dark"
            >
              Войти через Steam
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
