import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { HeroIcon } from '@/components/match/HeroIcon';
import { usePlayerMatches } from '@/lib/queries';
import { formatGameTime, heroName } from '@/lib/dota/format';

interface Props {
  playerId: string | undefined;
}

const PAGE_SIZE = 20;

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function PlayerMatchesTab({ playerId }: Props) {
  const [page, setPage] = useState(0);
  const q = usePlayerMatches(playerId, { page, size: PAGE_SIZE });

  const items = q.data?.items ?? [];
  const totalPages = q.data?.totalPages ?? 0;
  const totalItems = q.data?.totalItems ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Сыгранные матчи</CardTitle>
        <CardDescription>
          {q.isLoading ? 'Загрузка…' : `${totalItems} матчей со статистикой`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {q.isLoading && <Skeleton className="h-48 w-full" />}
        {q.isError && (
          <div className="text-sm text-destructive">
            Не удалось загрузить историю матчей.
          </div>
        )}
        {q.data && items.length === 0 && (
          <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
            Игрок ещё не сыграл ни одного матча со статистикой.
          </div>
        )}
        {items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 text-left">Результат</th>
                  <th className="px-3 py-2 text-left">Герой</th>
                  <th className="px-3 py-2 text-center">K/D/A</th>
                  <th className="px-3 py-2 text-center">GPM/XPM</th>
                  <th className="px-3 py-2 text-center">NW</th>
                  <th className="px-3 py-2 text-center">Длит.</th>
                  <th className="px-3 py-2 text-left">Турнир</th>
                  <th className="px-3 py-2 text-left">Дата</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr
                    key={m.matchId}
                    className={`border-t ${
                      m.win ? 'bg-green-500/5' : 'bg-red-500/5'
                    }`}
                  >
                    <td className="px-3 py-2">
                      <Link to={`/matches/${m.matchId}`}>
                        <Badge
                          variant={m.win ? 'default' : 'destructive'}
                          className="cursor-pointer"
                        >
                          {m.win ? 'Победа' : 'Поражение'}
                        </Badge>
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <HeroIcon heroId={m.heroId} size={32} />
                        <span className="max-w-[8rem] truncate">
                          {heroName(m.heroId)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center font-mono">
                      {m.kills}/{m.deaths}/{m.assists}
                    </td>
                    <td className="px-3 py-2 text-center font-mono">
                      {m.gpm}/{m.xpm}
                    </td>
                    <td className="px-3 py-2 text-center font-mono">
                      {m.netWorth.toLocaleString('ru-RU')}
                    </td>
                    <td className="px-3 py-2 text-center font-mono">
                      {formatGameTime(m.durationSec)}
                    </td>
                    <td className="px-3 py-2">
                      {m.tournamentSlug ? (
                        <Link
                          to={`/tournaments/${m.tournamentSlug}`}
                          className="hover:underline"
                        >
                          {m.tournamentName ?? m.tournamentSlug}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {fmtDate(m.playedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 0 || q.isFetching}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Назад
            </Button>
            <span className="text-xs text-muted-foreground">
              Стр. {page + 1} из {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1 || q.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Вперёд
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
