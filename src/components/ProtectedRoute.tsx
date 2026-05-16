import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { steamLoginUrl } from '@/lib/api/endpoints';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, isLoading, session } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && session === null) {
      window.location.href = steamLoginUrl(location.pathname);
    }
  }, [isLoading, session, location.pathname]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect kicks in via the effect above.
    return (
      <div className="text-sm text-muted-foreground">
        Перенаправляем на вход через Steam…
      </div>
    );
  }

  return <>{children}</>;
}
