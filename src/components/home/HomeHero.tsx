import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import type { SeasonDto } from '@/lib/api/types';
import { SEASON_STATUS_LABEL } from '@/lib/api/types';

interface HomeHeroProps {
  season?: SeasonDto;
  seasonLoading: boolean;
}

/**
 * Hero-секция главной в стиле «Editorial Clean»: кикер + крупный заголовок,
 * под ним строка «подзаголовок слева / CTA справа». Никакого декора —
 * только типографика на чистом фоне, снизу отделяется тонкой линией.
 */
export default function HomeHero({ season, seasonLoading }: HomeHeroProps) {
  const navigate = useNavigate();

  const kicker = season
    ? `${season.name} · ${SEASON_STATUS_LABEL[season.status]}`
    : 'Play Stage · Киберспорт';

  return (
    <section className="border-b border-line px-10 pb-16 pt-14">
      <div className="mx-auto max-w-7xl">
        <div className="ec-kicker text-[0.8125rem] text-brand">{kicker}</div>

        <h1 className="ec-display mt-6 text-[4rem] leading-[0.98] text-ink [letter-spacing:-0.03em] md:text-[4.75rem]">
          Твоя сцена.
          <br />
          Твоя <span className="text-brand">победа.</span>
        </h1>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-8">
          <p className="max-w-[27.5rem] text-[1.1875rem] leading-relaxed text-ink-muted">
            Создавай турниры, собирай команды, соревнуйся и сияй.
          </p>

          <div className="flex flex-wrap gap-3">
            {seasonLoading ? (
              <Skeleton className="h-[3rem] w-[11.25rem] rounded-pill" />
            ) : (
              <button
                type="button"
                className="ec-btn ec-btn-dark"
                disabled={!season}
                onClick={() => navigate(`/scenes/${season!.slug}`)}
              >
                {season ? 'Открыть сцену' : 'Скоро'}
              </button>
            )}

            <button
              type="button"
              className="ec-btn ec-btn-outline"
              onClick={() => navigate('/scenes')}
            >
              К турнирам
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
