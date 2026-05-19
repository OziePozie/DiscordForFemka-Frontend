import { useCurrentSeason, useSeason } from '@/lib/queries';
import BackgroundDecor from '@/components/home/BackgroundDecor';
import HomeHero from '@/components/home/HomeHero';
import ActiveTournaments from '@/components/home/ActiveTournaments';
import FeaturesRow from '@/components/home/FeaturesRow';

/**
 * Главная страница v2 — Y2K/iridescent landing. Тонкий orchestrator:
 * только data fetching и композиция секций.
 *
 * Layout даёт max-w-7xl + px-6 + py-8; мы компенсируем -mx-6 -my-8,
 * чтобы фоновый цвет и декор лились до края экрана.
 * min-h-[calc(100vh-3.5rem)] вычитает высоту Header'a (h-14 = 3.5rem),
 * чтобы страница точно занимала viewport без вертикального гэпа.
 */
export default function HomePage() {
  const currentSeason = useCurrentSeason();
  const seasonDetails = useSeason(currentSeason.data?.slug);

  const season = currentSeason.data ?? undefined;
  const tournaments = seasonDetails.data?.tournaments ?? [];

  return (
    <div className="relative -mx-6 -my-8 min-h-[calc(100vh-3.5rem)] overflow-hidden bg-[#f5f3ff] font-sans text-[#10142d]">
      <BackgroundDecor />

      <HomeHero
        season={season}
        seasonLoading={currentSeason.isLoading}
      />

      <ActiveTournaments
        tournaments={tournaments}
        loading={seasonDetails.isLoading}
        seasonSlug={season?.slug}
      />

      <FeaturesRow />
    </div>
  );
}
