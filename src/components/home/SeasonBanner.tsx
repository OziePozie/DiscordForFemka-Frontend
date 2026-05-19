import { useNavigate } from 'react-router-dom';
import type { SeasonDto } from '@/lib/api/types';
import { SEASON_STATUS_LABEL } from '@/lib/api/types';

interface SeasonBannerProps {
  season?: SeasonDto;
}

/**
 * Широкая баннер-секция между hero и "Активные турниры". Показывает
 * залитый админом баннер текущего сезона + название и статус. Кликабельна:
 * ведёт на страницу деталей сезона.
 *
 * Если у сезона нет bannerUrl — секция не рендерится (возвращает null).
 */
export default function SeasonBanner({ season }: SeasonBannerProps) {
  const navigate = useNavigate();

  if (!season?.bannerUrl) return null;

  return (
    <section className="relative z-10 px-10 pb-12">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => navigate(`/seasons/${season.slug}`)}
          aria-label={`Открыть сезон ${season.name}`}
          className="group relative block w-full overflow-hidden rounded-[40px] border border-white/50 shadow-[0_20px_80px_rgba(120,100,255,0.15)] transition-transform duration-500 hover:-translate-y-1"
        >
          <div className="aspect-[21/9] w-full">
            <img
              src={season.bannerUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          </div>

          {/* затемняющий градиент слева для читаемости текста */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent"
          />

          {/* подпись поверх баннера */}
          <div className="absolute inset-y-0 left-0 flex max-w-md flex-col justify-center px-10 text-left">
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/85">
              Текущий сезон · {SEASON_STATUS_LABEL[season.status]}
            </span>
            <h2 className="mt-3 text-4xl font-black text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
              {season.name}
            </h2>
            <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
              Подробнее →
            </span>
          </div>
        </button>
      </div>
    </section>
  );
}
