import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Search, Swords } from 'lucide-react';
import { useSeasonsList } from '@/lib/queries';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SEASON_STATUS_LABEL,
  type SeasonDto,
  type SeasonStatus,
} from '@/lib/api/types';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;

type FilterValue = 'ALL' | SeasonStatus;

const FILTERS: Array<{ value: FilterValue; label: string }> = [
  { value: 'ALL', label: 'Все' },
  { value: 'ACTIVE', label: 'Активные' },
  { value: 'PLANNED', label: 'Запланированные' },
  { value: 'FINISHED', label: 'Завершённые' },
];

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function statusColor(s: SeasonStatus): string {
  switch (s) {
    case 'ACTIVE':
      return 'hsl(var(--success))';
    case 'PLANNED':
      return 'hsl(var(--brand))';
    case 'FINISHED':
      return 'hsl(var(--ink-faint))';
  }
}

function actionLabel(s: SeasonStatus): string {
  switch (s) {
    case 'ACTIVE':
      return 'Открыть сцену';
    case 'PLANNED':
      return 'Подробнее';
    case 'FINISHED':
      return 'Итоги сцены';
  }
}

export default function SeasonsListPage() {
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<FilterValue>('ALL');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const q = useSeasonsList({ page, size: PAGE_SIZE });

  const items = q.data?.items ?? [];

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru-RU');
    return items.filter((s) => {
      if (filter !== 'ALL' && s.status !== filter) return false;
      if (query && !s.name.toLocaleLowerCase('ru-RU').includes(query)) {
        return false;
      }
      return true;
    });
  }, [items, filter, search]);

  return (
    <div className="relative -my-8 ml-[calc(50%-50vw)] w-screen min-h-[calc(100vh-4.25rem)] bg-background text-ink">
      <div className="mx-auto max-w-7xl px-10 py-14">
        {/* Шапка */}
        <header className="mb-10 flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="ec-kicker text-[0.75rem] text-brand">
              Лиги и серии турниров
            </div>
            <h1 className="ec-display mt-3 text-[3rem] leading-tight text-ink [letter-spacing:-0.03em] md:text-[3.5rem]">
              Сцены
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
              Сцены — это лиги и серии турниров от разных организаторов.
              У каждой сцены свои правила, форматы и условия участия.
              Выбирай свою сцену!
            </p>
          </div>
          <div className="ec-num text-sm text-ink-faint">
            {q.data?.totalItems ?? 0} всего
          </div>
        </header>

        {/* Панель управления — текстовые табы + поиск */}
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-6 border-b border-line">
            {FILTERS.map((f) => {
              const active = filter === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    '-mb-px border-b-[1.5px] py-2 text-sm font-medium transition-colors',
                    active
                      ? 'border-ink text-ink'
                      : 'border-transparent text-ink-muted hover:text-ink',
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Input
              placeholder="Поиск сцен…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-md border-line pr-10 placeholder:text-ink-faint focus-visible:ring-brand"
            />
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            />
          </div>
        </div>

        {/* Контент */}
        {q.isLoading && (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[20rem] rounded-lg" />
            ))}
          </div>
        )}

        {q.isError && (
          <div className="rounded-lg border border-live/40 bg-live/5 px-4 py-6 text-sm text-live">
            Не удалось загрузить сцены: {q.error?.message ?? 'unknown error'}
          </div>
        )}

        {q.data && filtered.length === 0 && (
          <div className="rounded-lg border border-line px-4 py-16 text-center text-sm text-ink-muted">
            {items.length === 0
              ? 'Сцен пока нет.'
              : 'Ничего не нашлось. Попробуй изменить фильтр или запрос.'}
          </div>
        )}

        {q.data && filtered.length > 0 && (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <SeasonCard
                key={s.id}
                season={s}
                onOpen={() => navigate(`/scenes/${s.slug}`)}
              />
            ))}
          </div>
        )}

        {q.data && (q.data.totalPages ?? 0) > 1 && (
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
              Страница {(q.data.page ?? page) + 1} из {q.data.totalPages}
            </div>
            <Button
              variant="outline"
              className="rounded-pill"
              disabled={page + 1 >= (q.data.totalPages ?? 1)}
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

interface SeasonCardProps {
  season: SeasonDto;
  onOpen: () => void;
}

function SeasonCard({ season, onOpen }: SeasonCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-line bg-card">
      <div className="aspect-[16/8] w-full overflow-hidden">
        {season.bannerUrl ? (
          <img
            src={season.bannerUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary">
            <Swords className="h-8 w-8 text-ink-disabled" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <h3 className="ec-display line-clamp-2 text-[1.3125rem] leading-tight text-ink">
          {season.name}
        </h3>

        <div className="flex items-center gap-2 text-[0.8125rem] font-semibold">
          <span
            className="ec-dot"
            style={{ backgroundColor: statusColor(season.status) }}
          />
          <span style={{ color: statusColor(season.status) }}>
            {SEASON_STATUS_LABEL[season.status]}
          </span>
          <span className="text-ink-faint">· Dota 2</span>
        </div>

        {season.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-ink-muted">
            {season.description}
          </p>
        )}

        <div className="ec-num mt-auto flex items-center gap-2 text-[0.8125rem] text-ink-faint">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          {fmtDate(season.startsAt)} — {fmtDate(season.endsAt)}
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-brand transition-opacity hover:opacity-70"
        >
          {actionLabel(season.status)} <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}
