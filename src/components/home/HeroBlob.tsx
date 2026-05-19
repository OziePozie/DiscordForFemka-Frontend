interface HeroBlobProps {
  /**
   * Если у текущего сезона залит баннер — рендерим его на месте брендового
   * иридисцентного блоба. Если баннера нет — fallback на /hero-blob.png.
   */
  bannerUrl?: string | null;
}

/**
 * Hero-визуал. По умолчанию — иридисцентная 3D S-форма (PNG-рендер из лого).
 * Если у сезона есть баннер, показываем его вместо блоба (то же место, тот же
 * размер, со скруглением и тенью).
 *
 * Полностью декоративный, aria-hidden.
 */
export default function HeroBlob({ bannerUrl }: HeroBlobProps) {
  if (bannerUrl) {
    return (
      <div
        aria-hidden="true"
        className="relative flex h-[620px] items-center justify-center"
      >
        <img
          src={bannerUrl}
          alt=""
          className="relative h-[600px] w-[460px] select-none rounded-[40px] object-cover shadow-[0_30px_80px_rgba(140,100,255,0.3)] ring-1 ring-white/40"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="relative flex h-[620px] items-center justify-center"
    >
      <img
        src="/hero-blob.png"
        alt=""
        className="relative max-h-[600px] w-auto select-none drop-shadow-[0_40px_90px_rgba(140,100,255,0.35)]"
        draggable={false}
      />
    </div>
  );
}
