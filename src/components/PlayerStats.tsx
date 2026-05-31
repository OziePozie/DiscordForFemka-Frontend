import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { HeroIcon } from '@/components/match/HeroIcon';
import { usePlayerStats } from '@/lib/queries';
import { heroName } from '@/lib/dota/format';

interface Props {
  playerId: string | undefined;
}

function pct(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

function StatBox({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: 'win' | 'loss' | null;
}) {
  const color =
    accent === 'win'
      ? 'text-green-600'
      : accent === 'loss'
        ? 'text-red-600'
        : '';
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function PlayerStats({ playerId }: Props) {
  const q = usePlayerStats(playerId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Статистика</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {q.isLoading && <Skeleton className="h-32 w-full" />}
        {q.isError && (
          <div className="text-sm text-destructive">
            Не удалось загрузить статистику.
          </div>
        )}
        {q.data && q.data.games === 0 && (
          <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
            Пока нет сыгранных матчей со статистикой.
          </div>
        )}
        {q.data && q.data.games > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatBox
                label="Винрейт"
                value={pct(q.data.winrate)}
                sub={`${q.data.wins}П / ${q.data.losses}П`}
                accent={q.data.winrate >= 0.5 ? 'win' : 'loss'}
              />
              <StatBox label="Матчей" value={String(q.data.games)} />
              <StatBox
                label="Средний KDA"
                value={q.data.avgKda.toFixed(2)}
                sub={`${q.data.avgKills.toFixed(1)} / ${q.data.avgDeaths.toFixed(
                  1,
                )} / ${q.data.avgAssists.toFixed(1)}`}
              />
              <StatBox
                label="Турниров"
                value={String(q.data.tournamentsPlayed)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
              <StatBox
                label="Текущий стрик"
                value={
                  q.data.currentStreak === 0
                    ? '—'
                    : `${Math.abs(q.data.currentStreak)} ${
                        q.data.currentStreak > 0 ? 'побед' : 'поражений'
                      }`
                }
                accent={
                  q.data.currentStreak > 0
                    ? 'win'
                    : q.data.currentStreak < 0
                      ? 'loss'
                      : null
                }
              />
              <StatBox
                label="Лучший винстрик"
                value={String(q.data.bestWinStreak)}
                accent={q.data.bestWinStreak > 0 ? 'win' : null}
              />
            </div>

            {q.data.favoriteHeroes.length > 0 && (
              <div>
                <div className="mb-2 text-sm font-medium">Любимые герои</div>
                <div className="flex flex-wrap gap-3">
                  {q.data.favoriteHeroes.map((h) => (
                    <div
                      key={h.heroId}
                      className="flex items-center gap-2 rounded-md border px-2 py-1.5"
                      title={heroName(h.heroId)}
                    >
                      <HeroIcon heroId={h.heroId} size={36} />
                      <div className="leading-tight">
                        <div className="max-w-[8rem] truncate text-sm font-medium">
                          {heroName(h.heroId)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {h.games} игр ·{' '}
                          <Badge
                            variant="outline"
                            className="px-1 py-0 text-[10px]"
                          >
                            {pct(h.winrate)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
