/**
 * Анимированный иридисцентный блоб. Четыре морфящихся shape'а сливаются
 * в одну органическую форму через SVG goo-filter (blur + contrast),
 * обёрнутые в круг с двумя декоративными бордерами. Рендерится в правой
 * колонке HomeHero. Полностью декоративный, aria-hidden.
 */
export default function HeroBlob() {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-[620px] items-center justify-center"
    >
      {/* SVG-фильтр для "goo" эффекта — сливает соседние shape'ы в одну форму */}
      <svg className="absolute h-0 w-0" aria-hidden="true">
        <defs>
          <filter id="ps-blob-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -11"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="absolute inset-0 rounded-full border border-purple-200/50" />
      <div className="absolute inset-12 rounded-full border border-purple-100/40" />

      <div
        className="relative h-[520px] w-[520px]"
        style={{ filter: 'url(#ps-blob-goo)' }}
      >
        <div className="ps-lava-shape ps-lava-shape-1" />
        <div className="ps-lava-shape ps-lava-shape-2" />
        <div className="ps-lava-shape ps-lava-shape-3" />
        <div className="ps-lava-shape ps-lava-shape-4" />
      </div>
    </div>
  );
}
