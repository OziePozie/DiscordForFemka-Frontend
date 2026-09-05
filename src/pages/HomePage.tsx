import { useCurrentSeason, useSeason } from '@/lib/queries';
import HomeHero from '@/components/home/HomeHero';
import SeasonBanner from '@/components/home/SeasonBanner';
import ActiveTournaments from '@/components/home/ActiveTournaments';
import FeaturesRow from '@/components/home/FeaturesRow';

/**
 * Главная страница — редизайн «Editorial Clean»: чистый тёплый фон,
 * никаких сфер/градиентов. Тонкий orchestrator: только data fetching
 * и композиция секций.
 *
 * Layout оборачивает контент в max-w-7xl + px-6 + py-8. Чтобы фон лился
 * до самого края viewport'a (full-bleed), используем CSS-трюк:
 * w-screen + ml-[calc(50%-50vw)] стягивает div к левому краю viewport'a
 * и растягивает на всю его ширину. -my-8 убирает вертикальные паддинги.
 * min-h-[calc(100vh-68px)] вычитает высоту Header'a (68px).
 */
export default function HomePage() {
  const currentSeason = useCurrentSeason();
  const seasonDetails = useSeason(currentSeason.data?.slug);

  const season = currentSeason.data ?? undefined;
  const tournaments = seasonDetails.data?.tournaments ?? [];

  return (
    <div className="relative -my-8 ml-[calc(50%-50vw)] w-screen min-h-[calc(100vh-68px)] bg-background font-sans text-ink">
      <HomeHero
        season={season}
        seasonLoading={currentSeason.isLoading}
      />

      <SeasonBanner season={season} />

      <ActiveTournaments
        tournaments={tournaments}
        loading={seasonDetails.isLoading}
        seasonSlug={season?.slug}
      />

      <FeaturesRow />
    </div>
  );
}
