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

function statusPillClass(s: SeasonStatus): string {
  switch (s) {
    case 'ACTIVE':
      return 'bg-purple-600 text-white';
    case 'PLANNED':
      return 'bg-sky-100 text-sky-700 ring-1 ring-sky-200';
    case 'FINISHED':
      return 'bg-slate-200 text-slate-700';
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
    <div className="relative -my-8 ml-[calc(50%-50vw)] w-screen min-h-[calc(100vh-3.5rem)] overflow-hidden bg-[#f5f3ff] text-[#10142d]">
      <div className="mx-auto max-w-7xl px-10 py-12">
        {/* Шапка */}
        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-5xl font-black tracking-[-2px] text-[#0f1533] md:text-6xl">
              <span className="ps-gradient-text">Сцены</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#5b6284]">
              Сцены — это лиги и серии турниров от разных организаторов.
              У каждой сцены свои правила, форматы и условия участия.
              Выбирай свою сцену!
            </p>
          </div>
          <div className="text-sm font-medium text-purple-700/70">
            {q.data?.totalItems ?? 0} всего
          </div>
        </header>

        {/* Панель управления */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = filter === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    'rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300',
                    active
                      ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-[0_10px_30px_rgba(126,91,255,0.25)]'
                      : 'border border-purple-100 bg-white/70 text-[#5b6284] backdrop-blur-xl hover:border-purple-300 hover:text-purple-700',
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
              className="h-11 rounded-2xl border-purple-100 bg-white/70 pr-10 backdrop-blur-xl placeholder:text-[#9aa0bc] focus-visible:ring-purple-300"
            />
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0bc]"
            />
          </div>
        </div>

        {/* Контент */}
        {q.isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[380px] rounded-3xl" />
            ))}
          </div>
        )}

        {q.isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
            Не удалось загрузить сцены: {q.error?.message ?? 'unknown error'}
          </div>
        )}

        {q.data && filtered.length === 0 && (
          <div className="rounded-3xl border border-purple-100 bg-white/60 px-4 py-16 text-center text-sm text-[#5b6284] backdrop-blur-xl">
            {items.length === 0
              ? 'Сцен пока нет.'
              : 'Ничего не нашлось. Попробуй изменить фильтр или запрос.'}
          </div>
        )}

        {q.data && filtered.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              Страница {(q.data.page ?? page) + 1} из {q.data.totalPages}
            </div>
            <Button
              variant="outline"
              className="rounded-2xl border-purple-200 bg-white/70 text-purple-700 hover:bg-white"
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
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-purple-100 bg-white/70 shadow-[0_15px_40px_rgba(126,91,255,0.08)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(126,91,255,0.18)]">
      <div className="relative">
        {season.bannerUrl ? (
          <img
            src={season.bannerUrl}
            alt=""
            className="aspect-[16/8] w-full object-cover"
          />
        ) : (
          <div className="aspect-[16/8] w-full bg-gradient-to-br from-purple-400 via-fuchsia-400 to-blue-400" />
        )}
        <span
          className={cn(
            'absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide',
            statusPillClass(season.status),
          )}
        >
          {SEASON_STATUS_LABEL[season.status]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <h3 className="line-clamp-2 text-xl font-bold text-[#141938]">
          {season.name}
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
            <Swords className="h-3.5 w-3.5" aria-hidden="true" />
            Dota 2
          </span>
        </div>

        {season.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-[#5b6284]">
            {season.description}
          </p>
        )}

        <div className="mt-auto flex items-center gap-2 text-sm text-[#5b6284]">
          <CalendarDays className="h-4 w-4 text-purple-500" aria-hidden="true" />
          {fmtDate(season.startsAt)} — {fmtDate(season.endsAt)}
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="w-full rounded-2xl border border-purple-200 bg-white/70 px-5 py-3 text-sm font-semibold text-purple-700 transition-all duration-300 hover:bg-purple-600 hover:text-white"
        >
          {actionLabel(season.status)} <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}
