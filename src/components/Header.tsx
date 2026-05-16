import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth';
import { useLogout } from '@/lib/queries';
import { steamLoginUrl } from '@/lib/api/endpoints';

export default function Header() {
  const { session, isAuthenticated, isLoading } = useAuth();
  const logout = useLogout();
  const location = useLocation();
  const navigate = useNavigate();

  function handleLogin() {
    const returnTo = location.pathname === '/' ? '/profile' : location.pathname;
    window.location.href = steamLoginUrl(returnTo);
  }

  async function handleLogout() {
    await logout.mutateAsync();
    navigate('/');
  }

  const initials = (session?.nickname ?? '?').slice(0, 2).toUpperCase();

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-base font-semibold tracking-tight">
            Femka Platform
          </Link>
          <nav className="hidden gap-6 text-sm text-muted-foreground sm:flex">
            <Link to="/" className="hover:text-foreground">
              Главная
            </Link>
            <Link to="/profile" className="hover:text-foreground">
              Профиль
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
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
              <DropdownMenuContent align="end" className="min-w-[180px]">
                <DropdownMenuLabel>
                  {session.nickname ?? 'Без ника'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Профиль
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={handleLogin}>Войти через Steam</Button>
          )}
        </div>
      </div>
    </header>
  );
}
