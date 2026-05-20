import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import HeroBlob from './HeroBlob';
import type { SeasonDto } from '@/lib/api/types';

interface HomeHeroProps {
  season?: SeasonDto;
  seasonLoading: boolean;
}

/**
 * Hero-секция главной. Левая колонка — текст + CTA, правая — анимированный
 * блоб с вертикальной подписью. CTA "Открыть сцену" уходит в /scenes/{slug};
 * если сцена ещё не загружена — показываем Skeleton; если сцены нет —
 * disabled "Скоро".
 */
export default function HomeHero({ season, seasonLoading }: HomeHeroProps) {
  const navigate = useNavigate();

  return (
    <section className="relative z-10 px-10 pb-20 pt-12">
      <div className="mx-auto grid min-h-[70vh] max-w-7xl items-center gap-10 lg:grid-cols-2">
        {/* LEFT */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 px-4 py-2 text-xs font-semibold tracking-wide text-purple-700 shadow-sm backdrop-blur-xl">
            ПЛАТФОРМА ДЛЯ ТУРНИРОВ И КИБЕРСПОРТА
          </div>

          <h1 className="mt-8 text-6xl font-black leading-[0.95] tracking-[-3px] text-[#0f1533] md:text-7xl">
            Твоя сцена.
            <br />
            <span className="ps-gradient-text">Твоя победа.</span>
          </h1>

          <p className="mt-8 max-w-xl text-xl leading-relaxed text-[#5b6284]">
            Создавай турниры, собирай команды, соревнуйся и сияй.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            {seasonLoading ? (
              <Skeleton className="h-[3.375rem] w-[12.5rem] rounded-[1.25rem]" />
            ) : (
              <button
                className="ps-main-button"
                disabled={!season}
                onClick={() => navigate(`/scenes/${season!.slug}`)}
              >
                {season ? 'Открыть сцену' : 'Скоро'}
              </button>
            )}

            <button
              className="ps-secondary-button"
              onClick={() => navigate('/scenes')}
            >
              К турнирам
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="relative flex items-center justify-center">
          <HeroBlob />
          <div
            aria-hidden="true"
            className="absolute right-0 top-1/2 -translate-y-1/2 text-right text-sm font-medium uppercase leading-8 tracking-[0.3em] text-purple-500/80"
          >
            Организуй.
            <br />
            Соревнуйся.
            <br />
            Сияй.
          </div>
        </div>
      </div>
    </section>
  );
}
