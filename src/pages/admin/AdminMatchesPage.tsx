import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getSeasonsPage,
  getSeasonBySlug,
  getTournamentMatchesPage,
} from '@/lib/api/endpoints';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MATCH_FORMAT_LABEL,
  MATCH_STATUS_LABEL,
  currentGame,
  type MatchDto,
  type MatchStatus,
  type SeasonDto,
  type TournamentDto,
} from '@/lib/api/types';
import { MatchAdminMenu } from '@/components/MatchAdminMenu';

const PAGE_SIZE = 25;

function statusVariant(s: MatchStatus) {
  switch (s) {
    case 'LIVE':
      return 'default' as const;
    case 'SCHEDULED':
      return 'secondary' as const;
    case 'FINISHED':
      return 'outline' as const;
    case 'CANCELLED':
      return 'destructive' as const;
  }
}

function fmtDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminMatchesPage() {
  const navigate = useNavigate();

  // Seasons → tournaments selectors (mirrors AdminTournamentsPage).
  const seasonsQ = useQuery({
    queryKey: ['admin-matches-seasons'],
    queryFn: () => getSeasonsPage({ size: 50 }),
    staleTime: 60_000,
  });
  const seasons: SeasonDto[] = seasonsQ.data?.items ?? [];

  const [seasonSlug, setSeasonSlug] = useState<string>('');
  const [tournamentId, setTournamentId] = useState<string>('');

  useEffect(() => {
    if (!seasonSlug && seasons.length > 0) {
      setSeasonSlug(seasons[0].slug);
    }
  }, [seasons, seasonSlug]);

  const seasonDetailsQ = useQuery({
    queryKey: ['admin-matches-season-details', seasonSlug],
    queryFn: () => getSeasonBySlug(seasonSlug),
    enabled: !!seasonSlug,
  });

  const tournaments: TournamentDto[] = seasonDetailsQ.data?.tournaments ?? [];

  useEffect(() => {
    setTournamentId('');
  }, [seasonSlug]);

  const [page, setPage] = useState(0);
  useEffect(() => {
    setPage(0);
  }, [tournamentId]);

  const matchesQ = useQuery({
    queryKey: ['admin-tournament-matches', tournamentId, page],
    queryFn: () =>
      getTournamentMatchesPage(tournamentId, { page, size: PAGE_SIZE }),
    enabled: !!tournamentId,
  });

  const matches: MatchDto[] = matchesQ.data?.items ?? [];
  const totalPages = matchesQ.data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Матчи</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor="season-filter" className="text-sm">
          Сцена:
        </Label>
        <Select
          value={seasonSlug || undefined}
          onValueChange={(v) => setSeasonSlug(v)}
        >
          <SelectTrigger id="season-filter" className="w-56">
            <SelectValue placeholder="Выберите сцену" />
          </SelectTrigger>
          <SelectContent>
            {seasons.map((s) => (
              <SelectItem key={s.id} value={s.slug}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Label htmlFor="tournament-filter" className="text-sm">
          Турнир:
        </Label>
        <Select
          value={tournamentId || undefined}
          onValueChange={(v) => setTournamentId(v)}
          disabled={tournaments.length === 0}
        >
          <SelectTrigger id="tournament-filter" className="w-72">
            <SelectValue placeholder="Выберите турнир" />
          </SelectTrigger>
          <SelectContent>
            {tournaments.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(seasonsQ.isLoading || seasonDetailsQ.isLoading) && (
        <Skeleton className="h-40 w-full" />
      )}

      {seasonsQ.data && seasons.length === 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          Нет сцен.
        </div>
      )}

      {seasonDetailsQ.data && tournaments.length === 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          На этой сцене нет турниров.
        </div>
      )}

      {!tournamentId && tournaments.length > 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          Выберите турнир, чтобы увидеть его матчи.
        </div>
      )}

      {matchesQ.isLoading && tournamentId && (
        <Skeleton className="h-60 w-full" />
      )}

      {matchesQ.isError && (
        <div className="text-sm text-destructive">
          Не удалось загрузить матчи:{' '}
          {matchesQ.error?.message ?? 'unknown error'}
        </div>
      )}

      {tournamentId && matchesQ.data && matches.length === 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          У этого турнира пока нет матчей.
        </div>
      )}

      {matches.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Команда A</th>
                <th className="px-4 py-2 font-medium">Команда B</th>
                <th className="px-4 py-2 font-medium">Статус</th>
                <th className="px-4 py-2 font-medium">Формат</th>
                <th className="px-4 py-2 font-medium">Готовность</th>
                <th className="px-4 py-2 font-medium">Лобби</th>
                <th className="px-4 py-2 font-medium">Время</th>
                <th className="px-4 py-2 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => {
                const finished =
                  m.status === 'FINISHED' || m.status === 'CANCELLED';
                const aReady = !!m.teamAReadyAt;
                const bReady = !!m.teamBReadyAt;
                return (
                  <tr
                    key={m.id}
                    className="cursor-pointer border-t align-top hover:bg-muted/40"
                    onClick={() => navigate(`/matches/${m.id}`)}
                  >
                    <td className="px-4 py-3">
                      {m.teamA ? (
                        <>
                          {m.teamA.name}{' '}
                          <span className="text-muted-foreground">
                            [{m.teamA.tag}]
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">TBD</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {m.teamB ? (
                        <>
                          {m.teamB.name}{' '}
                          <span className="text-muted-foreground">
                            [{m.teamB.tag}]
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">TBD</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(m.status)}>
                        {MATCH_STATUS_LABEL[m.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">
                        {MATCH_FORMAT_LABEL[m.format]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <span className={aReady ? 'text-green-700' : ''}>
                        {aReady ? '✓' : '—'}
                      </span>
                      <span className="px-1 text-muted-foreground">/</span>
                      <span className={bReady ? 'text-green-700' : ''}>
                        {bReady ? '✓' : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {currentGame(m)?.lobbyName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {finished
                        ? fmtDateTime(m.finishedAt)
                        : fmtDateTime(m.scheduledAt)}
                    </td>
                    <td
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MatchAdminMenu match={m} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tournamentId && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Назад
          </Button>
          <div className="text-sm text-muted-foreground">
            Страница {page + 1} из {totalPages}
          </div>
          <Button
            variant="outline"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Дальше
          </Button>
        </div>
      )}
    </div>
  );
}
