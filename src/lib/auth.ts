import { useSession } from './queries';

export function useAuth() {
  const q = useSession();
  return {
    session: q.data ?? null,
    isLoading: q.isLoading,
    isAuthenticated: !!q.data,
    error: q.error,
  };
}
