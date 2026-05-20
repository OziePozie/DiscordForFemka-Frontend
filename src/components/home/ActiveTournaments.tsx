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
 * Секция "Активные турниры" — стеклянная панель с заголовком, кнопкой
 * "Смотреть все" и сеткой из ровно 3 карточек. Если активных < 3, добиваем
 * TournamentPlaceholderCard. Loading-состояние — 3 Skeleton-карточки.
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
    <section className="relative z-10 px-10 pb-12">
      <div className="mx-auto max-w-7xl rounded-[40px] border border-white/50 bg-white/55 p-8 shadow-[0_20px_80px_rgba(120,100,255,0.08)] backdrop-blur-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-[#141938]">
            Активные турниры
          </h2>
          <button
            className="font-semibold text-purple-600 transition-opacity hover:opacity-70"
            onClick={() => navigate(target)}
          >
            Смотреть все <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {loading
            ? Array.from({ length: MAX_CARDS }).map((_, i) => (
                <Skeleton key={i} className="h-[230px] rounded-[32px]" />
              ))
            : (
              <>
                {active.map((t) => (
                  <TournamentCard key={t.id} tournament={t} />
                ))}
                {Array.from({ length: placeholders }).map((_, i) => (
                  <TournamentPlaceholderCard
                    key={`placeholder-${i}`}
                    seasonSlug={seasonSlug}
                  />
                ))}
              </>
            )}
        </div>
      </div>
    </section>
  );
}
