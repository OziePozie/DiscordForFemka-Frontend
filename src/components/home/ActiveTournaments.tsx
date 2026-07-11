import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import type { TournamentDto, TournamentStatus } from '@/lib/api/types';
import TournamentCard from './TournamentCard';
import TournamentPlaceholderCard from './TournamentPlaceholderCard';

interface ActiveTournamentsProps {
  tournaments: TournamentDto[];
  loading: boolean;
  seasonSlug?: string;
}

const ACTIVE_STATUSES: TournamentStatus[] = [
  'LIVE',
  'REGISTRATION_OPEN',
  'ANNOUNCED',
];

const MAX_CARDS = 3;

/**
 * Секция "Активные турниры" в стиле «Editorial Clean» — заголовок,
 * текстовая ссылка «Все турниры» и редакционная сетка из ровно 3 ячеек,
 * разделённых тонкими линиями. Если активных < 3, добиваем плейсхолдерами.
 */
export default function ActiveTournaments({
  tournaments,
  loading,
  seasonSlug,
}: ActiveTournamentsProps) {
  const navigate = useNavigate();
  const target = seasonSlug ? `/scenes/${seasonSlug}` : '/scenes';

  const active = tournaments
    .filter((t) => ACTIVE_STATUSES.includes(t.status))
    .slice(0, MAX_CARDS);
  const placeholders = Math.max(0, MAX_CARDS - active.length);

  return (
    <section className="border-b border-line px-10 py-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="ec-display text-[1.625rem] text-ink">
            Активные турниры
          </h2>
          <button
            className="text-[0.9375rem] font-semibold text-brand transition-opacity hover:opacity-70 [text-decoration-line:underline] [text-decoration-thickness:1.5px] [text-underline-offset:4px]"
            onClick={() => navigate(target)}
          >
            Все турниры
          </button>
        </div>

        <div className="grid border-t border-line divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0 md:[&>*:first-child]:pl-0">
          {loading
            ? Array.from({ length: MAX_CARDS }).map((_, i) => (
                <div key={i} className="py-7 md:px-8">
                  <Skeleton className="h-[10rem] w-full rounded-md" />
                </div>
              ))
            : (
              <>
                {active.map((t, i) => (
                  <TournamentCard key={t.id} tournament={t} index={i} />
                ))}
                {Array.from({ length: placeholders }).map((_, i) => (
                  <TournamentPlaceholderCard
                    key={`placeholder-${i}`}
                    index={active.length + i}
                  />
                ))}
              </>
            )}
        </div>
      </div>
    </section>
  );
}
