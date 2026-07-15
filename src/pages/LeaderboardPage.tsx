import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';

import {
  useCurrentSeason,
  useLeaderboard,
  useSeasonsList,
} from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RankBadge } from '@/components/RankBadge';
import { PlayerNameLink } from '@/components/PlayerNameLink';
import type { LeaderboardEntryDto, SeasonDto } from '@/lib/api/types';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 25;

export default function LeaderboardPage() {
  const [page, setPage] = useState(0);
  const [selectedSlug, setSelectedSlug] = useState<string>('');

  const seasonsQ = useSeasonsList({ size: 50 });
  const seasons: SeasonDto[] = seasonsQ.data?.items ?? [];
  const currentQ = useCurrentSeason();

  // Default to the current (ACTIVE) season, else the most recent one.
  useEffect(() => {
    if (selectedSlug) return;
    const fallback = currentQ.data?.slug ?? seasons[0]?.slug;
    if (fallback) setSelectedSlug(fallback);
  }, [currentQ.data, seasons, selectedSlug]);

  const q = useLeaderboard({
    season: selectedSlug || undefined,
    page,
    size: PAGE_SIZE,
  });

  const items = q.data?.items ?? [];
  const totalPages = q.data?.totalPages ?? 0;

  const seasonsResolved = seasonsQ.isFetched && currentQ.isFetched;
  const noSeasons = seasonsResolved && !selectedSlug && seasons.length === 0;
  const resolvingSeason = !selectedSlug && !noSeasons;

  function changeSeason(slug: string) {
    setSelectedSlug(slug);
    setPage(0);
  }

  return (
    <div className="relative -my-8 ml-[calc(50%-50vw)] w-screen min-h-[calc(100vh-4.25rem)] bg-background text-ink">
      <div className="mx-auto max-w-5xl px-6 py-14 sm:px-10">
        <header className="mb-10 flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="ec-kicker text-[0.75rem] text-brand">
              Рейтинг платформы
            </div>
            <h1 className="ec-display mt-3 text-[3rem] leading-tight text-ink [letter-spacing:-0.03em] md:text-[3.5rem]">
              Рейтинг
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
              Внутренний рейтинг игроков в рамках выбранной сцены. Каждый стартует
              с 1000 очков — побеждай на турнирных матчах сцены, чтобы подняться
              выше.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Select
              value={selectedSlug}
              onValueChange={changeSeason}
              disabled={seasons.length === 0}
            >
              <SelectTrigger className="w-[220px] rounded-pill">
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
            <div className="ec-num text-sm text-ink-faint">
              {q.data?.totalItems ?? 0} игроков
            </div>
          </div>
        </header>

        {(q.isLoading || resolvingSeason) && !noSeasons && (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-md" />
            ))}
          </div>
        )}

        {noSeasons && (
          <div className="rounded-lg border border-line px-4 py-16 text-center text-sm text-ink-muted">
            Сцен пока нет.
          </div>
        )}

        {q.isError && (
          <div className="rounded-lg border border-live/40 bg-live/5 px-4 py-6 text-sm text-live">
            Не удалось загрузить рейтинг: {q.error?.message ?? 'unknown error'}
          </div>
        )}

        {q.data && items.length === 0 && (
          <div className="rounded-lg border border-line px-4 py-16 text-center text-sm text-ink-muted">
            В этой сцене пока никто не сыграл ни одного матча.
          </div>
        )}

        {q.data && items.length > 0 && (
          <div>
            <div className="ec-kicker hidden items-center gap-4 border-b-[1.5px] border-ink px-2 py-2 text-[0.6875rem] text-ink-faint [letter-spacing:0.1em] sm:flex">
              <div className="w-12 text-center">#</div>
              <div className="flex-1">Игрок</div>
              <div className="w-28 text-center">Ранг</div>
              <div className="w-24 text-center">В / П</div>
              <div className="w-20 text-right">Рейтинг</div>
            </div>
            <ul>
              {items.map((entry) => (
                <LeaderboardRow key={entry.playerId} entry={entry} />
              ))}
            </ul>
          </div>
        )}

        {q.data && totalPages > 1 && (
          <div className="mt-12 flex items-center justify-between">
            <Button
              variant="outline"
              className="rounded-pill"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Назад
            </Button>
            <div className="ec-num text-sm text-ink-muted">
              Страница {(q.data.page ?? page) + 1} из {totalPages}
            </div>
            <Button
              variant="outline"
              className="rounded-pill"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Дальше
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntryDto }) {
  const isTop = entry.rank === 1;
  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-line px-2 py-4 transition-colors hover:bg-accent sm:flex-nowrap sm:gap-4">
      <div
        className={cn(
          'ec-num flex w-12 items-center justify-center gap-1 text-lg font-bold',
          entry.rank <= 3 ? 'text-ink' : 'text-ink-faint',
        )}
      >
        {isTop && (
          <Trophy className="h-4 w-4 text-brand" aria-hidden="true" />
        )}
        {entry.rank}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        {entry.avatarUrl ? (
          <img
            src={entry.avatarUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-line"
          />
        ) : (
          <div className="h-9 w-9 shrink-0 rounded-full bg-secondary" />
        )}
        <PlayerNameLink
          playerId={entry.playerId}
          nickname={entry.nickname}
          className="truncate font-semibold text-ink"
        />
      </div>

      <div className="w-28 text-center">
        <RankBadge tier={entry.rankTier} />
      </div>

      <div className="ec-num w-24 text-center text-sm text-ink-muted">
        <span className="font-semibold text-success">{entry.wins}</span>
        {' / '}
        <span className="font-semibold text-live">{entry.losses}</span>
      </div>

      <div className="ec-num w-20 text-right text-lg font-bold text-brand">
        {entry.rating}
      </div>
    </li>
  );
}
