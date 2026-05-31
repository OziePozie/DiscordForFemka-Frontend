import { useState } from 'react';
import { Trophy } from 'lucide-react';

import { useLeaderboard } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RankBadge } from '@/components/RankBadge';
import { PlayerNameLink } from '@/components/PlayerNameLink';
import type { LeaderboardEntryDto } from '@/lib/api/types';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 25;

function medalClass(rank: number): string {
  switch (rank) {
    case 1:
      return 'text-amber-500';
    case 2:
      return 'text-slate-400';
    case 3:
      return 'text-orange-500';
    default:
      return 'text-[#9aa0bc]';
  }
}

export default function LeaderboardPage() {
  const [page, setPage] = useState(0);
  const q = useLeaderboard({ page, size: PAGE_SIZE });

  const items = q.data?.items ?? [];
  const totalPages = q.data?.totalPages ?? 0;

  return (
    <div className="relative -my-8 ml-[calc(50%-50vw)] w-screen min-h-[calc(100vh-3.5rem)] overflow-hidden bg-[#f5f3ff] text-[#10142d]">
      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-5xl font-black tracking-[-2px] text-[#0f1533] md:text-6xl">
              <span className="ps-gradient-text">Рейтинг</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#5b6284]">
              Внутренний рейтинг игроков платформы. Каждый стартует с 1000 очков —
              побеждай на матчах платформы, чтобы подняться выше.
            </p>
          </div>
          <div className="text-sm font-medium text-purple-700/70">
            {q.data?.totalItems ?? 0} игроков
          </div>
        </header>

        {q.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        )}

        {q.isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
            Не удалось загрузить рейтинг: {q.error?.message ?? 'unknown error'}
          </div>
        )}

        {q.data && items.length === 0 && (
          <div className="rounded-3xl border border-purple-100 bg-white/60 px-4 py-16 text-center text-sm text-[#5b6284] backdrop-blur-xl">
            В рейтинге пока никого нет.
          </div>
        )}

        {q.data && items.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-purple-100 bg-white/70 shadow-[0_15px_40px_rgba(126,91,255,0.08)] backdrop-blur-xl">
            <div className="hidden items-center gap-4 border-b border-purple-100 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#9aa0bc] sm:flex">
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
          <div className="mt-10 flex items-center justify-between">
            <Button
              variant="outline"
              className="rounded-2xl border-purple-200 bg-white/70 text-purple-700 hover:bg-white"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Назад
            </Button>
            <div className="text-sm text-[#5b6284]">
              Страница {(q.data.page ?? page) + 1} из {totalPages}
            </div>
            <Button
              variant="outline"
              className="rounded-2xl border-purple-200 bg-white/70 text-purple-700 hover:bg-white"
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
  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-purple-50 px-6 py-4 last:border-b-0 transition-colors hover:bg-purple-50/40 sm:flex-nowrap sm:gap-4">
      <div
        className={cn(
          'flex w-12 items-center justify-center gap-1 text-lg font-black',
          medalClass(entry.rank),
        )}
      >
        {entry.rank <= 3 && <Trophy className="h-4 w-4" aria-hidden="true" />}
        {entry.rank}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        {entry.avatarUrl ? (
          <img
            src={entry.avatarUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-purple-100"
          />
        ) : (
          <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-purple-300 to-blue-300" />
        )}
        <PlayerNameLink
          playerId={entry.playerId}
          nickname={entry.nickname}
          className="truncate font-semibold text-[#141938]"
        />
      </div>

      <div className="w-28 text-center">
        <RankBadge tier={entry.rankTier} />
      </div>

      <div className="w-24 text-center text-sm text-[#5b6284]">
        <span className="font-semibold text-emerald-600">{entry.wins}</span>
        {' / '}
        <span className="font-semibold text-red-500">{entry.losses}</span>
      </div>

      <div className="w-20 text-right text-lg font-black text-purple-700">
        {entry.rating}
      </div>
    </li>
  );
}
