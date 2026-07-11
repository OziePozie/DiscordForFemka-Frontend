import { useNavigate } from 'react-router-dom';
import type { SeasonDto } from '@/lib/api/types';
import { SEASON_STATUS_LABEL } from '@/lib/api/types';

interface SeasonBannerProps {
  season?: SeasonDto;
}

/**
 * Широкая баннер-секция между hero и "Активные турниры". Показывает
 * залитый админом баннер текущей сцены + название и статус. Кликабельна:
 * ведёт на страницу деталей сцены.
 *
 * Если у сцены нет bannerUrl — секция не рендерится (возвращает null).
 */
export default function SeasonBanner({ season }: SeasonBannerProps) {
  const navigate = useNavigate();

  if (!season?.bannerUrl) return null;

  return (
    <section className="border-b border-line px-10 py-14">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => navigate(`/scenes/${season.slug}`)}
          aria-label={`Открыть сцену ${season.name}`}
          className="group relative block w-full overflow-hidden rounded-lg border border-line"
        >
          <div className="aspect-[21/9] w-full">
            <img
              src={season.bannerUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
          </div>

          {/* затемняющий градиент слева — только для читаемости белого текста */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent"
          />

          {/* подпись поверх баннера */}
          <div className="absolute inset-y-0 left-0 flex max-w-md flex-col justify-center px-10 text-left">
            <span className="ec-kicker text-[0.6875rem] text-white/85">
              Текущая сцена · {SEASON_STATUS_LABEL[season.status]}
            </span>
            <h2 className="ec-display mt-3 text-[2.25rem] text-white">
              {season.name}
            </h2>
            <span className="mt-5 flex items-center gap-2 text-[0.8125rem] font-semibold text-white">
              Подробнее
              <span aria-hidden="true">→</span>
            </span>
          </div>
        </button>
      </div>
    </section>
  );
}
