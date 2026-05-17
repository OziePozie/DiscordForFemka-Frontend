import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeasonsList, useSeasonChampions } from '@/lib/queries';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  SEASON_STATUS_LABEL,
  TOURNAMENT_FORMAT_LABEL,
  type SeasonDto,
} from '@/lib/api/types';

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

export default function ArchivePage() {
  const seasonsQ = useSeasonsList({ size: 50 });
  const seasons: SeasonDto[] = seasonsQ.data?.items ?? [];

  const [selectedSlug, setSelectedSlug] = useState<string>('');

  // Auto-select first season once loaded; prefer FINISHED (archive).
  useEffect(() => {
    if (!selectedSlug && seasons.length > 0) {
      const finished = seasons.find((s) => s.status === 'FINISHED');
      setSelectedSlug((finished ?? seasons[0]).slug);
    }
  }, [seasons, selectedSlug]);

  const championsQ = useSeasonChampions(selectedSlug || undefined);
  const champions = championsQ.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Архив</h1>
        <div className="text-sm text-muted-foreground">
          Чемпионы прошедших сезонов
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        {/* Left: seasons list */}
        <aside className="space-y-1">
          <h2 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Сезоны
          </h2>
          {seasonsQ.isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}
          {seasonsQ.data && seasons.length === 0 && (
            <div className="rounded-md border px-3 py-6 text-center text-sm text-muted-foreground">
              Нет сезонов.
            </div>
          )}
          <nav className="flex flex-col gap-1">
            {seasons.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSlug(s.slug)}
                className={cn(
                  'flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors',
                  selectedSlug === s.slug
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <span className="truncate">{s.name}</span>
                <Badge variant="outline" className="ml-2 shrink-0">
                  {SEASON_STATUS_LABEL[s.status]}
                </Badge>
              </button>
            ))}
          </nav>
        </aside>

        {/* Right: champions */}
        <section className="space-y-4">
          {!selectedSlug && (
            <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
              Выберите сезон слева.
            </div>
          )}

          {selectedSlug && championsQ.isLoading && (
            <Skeleton className="h-60 w-full" />
          )}

          {selectedSlug && championsQ.isError && (
            <div className="text-sm text-destructive">
              Не удалось загрузить чемпионов:{' '}
              {championsQ.error?.message ?? 'unknown error'}
            </div>
          )}

          {selectedSlug && championsQ.data && champions.length === 0 && (
            <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
              В этом сезоне пока нет чемпионов.
            </div>
          )}

          {champions.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {champions.map((c) => (
                <Card key={c.tournamentId}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">
                        <Link
                          to={`/tournaments/${c.tournamentSlug}`}
                          className="hover:underline"
                        >
                          {c.tournamentName}
                        </Link>
                      </CardTitle>
                      <Badge variant="outline" className="shrink-0">
                        {TOURNAMENT_FORMAT_LABEL[c.format]}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Завершён: {fmtDate(c.endsAt)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border bg-muted/30 px-4 py-3">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        Победитель
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span aria-hidden className="text-xl">
                          🏆
                        </span>
                        <Link
                          to={`/teams/${c.winnerTeam.id}`}
                          className="text-base font-semibold hover:underline"
                        >
                          {c.winnerTeam.name}{' '}
                          <span className="text-sm text-muted-foreground">
                            [{c.winnerTeam.tag}]
                          </span>
                        </Link>
                      </div>
                      {c.winnerTeam.avgMmr != null && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Средний MMR: {c.winnerTeam.avgMmr}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
