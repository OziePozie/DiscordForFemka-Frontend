import { useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getPlayersPage } from '@/lib/api/endpoints';
import { POSITION_LABEL, type PlayerPosition } from '@/lib/api/types';
import { PageTitle } from '../ui/Bits';

const POSITIONS: PlayerPosition[] = ['POS_1', 'POS_2', 'POS_3', 'POS_4', 'POS_5'];

/** Бакеты MMR — то, что в ТЗ показывалось как диапазоны рейтинга. */
const MMR_BUCKETS: { label: string; min?: number; max?: number }[] = [
  { label: '7000+', min: 7000 },
  { label: '6000–7000', min: 6000, max: 6999 },
  { label: '5000–6000', min: 5000, max: 5999 },
  { label: '3000–5000', min: 3000, max: 4999 },
  { label: 'до 3000', max: 2999 },
];

const PAGE_SIZE = 20;

export default function PlayersPage() {
  const [q, setQ] = useState('');
  const [role, setRole] = useState<PlayerPosition | ''>('');
  const [bucket, setBucket] = useState<number | null>(null);

  const mmr: { min?: number; max?: number } = bucket === null ? {} : MMR_BUCKETS[bucket];

  const players = useInfiniteQuery({
    queryKey: ['tg', 'players', q, role, bucket],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getPlayersPage({
        q: q.trim() || undefined,
        role: role || undefined,
        mmrMin: mmr.min,
        mmrMax: mmr.max,
        page: pageParam,
        size: PAGE_SIZE,
      }),
    getNextPageParam: (last, pages) =>
      (last.items?.length ?? 0) < PAGE_SIZE ? undefined : pages.length,
  });

  const items = players.data?.pages.flatMap((p) => p.items ?? []) ?? [];

  return (
    <div className="py-2">
      <PageTitle title="Игроки" subtitle="Поиск идёт и по прежним никнеймам." />

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Никнейм"
        className="mt-4 w-full rounded-lg border border-line bg-transparent px-4 py-3 text-ink outline-none focus:border-brand"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {POSITIONS.map((pos) => (
          <Chip
            key={pos}
            active={role === pos}
            onClick={() => setRole(role === pos ? '' : pos)}
            label={POSITION_LABEL[pos].replace(/ \(.*\)/, '')}
          />
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {MMR_BUCKETS.map((b, i) => (
          <Chip
            key={b.label}
            active={bucket === i}
            onClick={() => setBucket(bucket === i ? null : i)}
            label={b.label}
          />
        ))}
      </div>

      <div className="mt-5 divide-y divide-line border-y border-line">
        {items.map((p) => (
          <Link
            key={p.id}
            to={`/players/${p.id}`}
            className="flex items-center justify-between gap-3 py-3"
          >
            <span className="text-sm font-medium text-ink">{p.nickname ?? 'Без никнейма'}</span>
            <span className="ec-num text-sm text-ink-muted">
              {p.mmr?.mmr != null ? p.mmr.mmr : '—'}
            </span>
          </Link>
        ))}
        {!players.isLoading && items.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-muted">Никого не нашли.</p>
        )}
      </div>

      {players.hasNextPage && (
        <button
          type="button"
          onClick={() => players.fetchNextPage()}
          disabled={players.isFetchingNextPage}
          className="ec-btn ec-btn-outline mt-5 w-full"
        >
          {players.isFetchingNextPage ? 'Загружаем…' : 'Показать ещё'}
        </button>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-pill border px-3 py-1.5 text-xs font-semibold transition-colors ' +
        (active
          ? 'border-transparent bg-primary text-primary-foreground'
          : 'border-line text-ink-muted hover:border-line-strong')
      }
    >
      {label}
    </button>
  );
}
