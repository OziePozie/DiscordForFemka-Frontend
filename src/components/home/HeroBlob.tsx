/**
 * Анимированный "лава-блоб" — четыре морфящихся shape'а, обёрнутые в круг
 * с двумя декоративными бордерами. Рендерится в правой колонке HomeHero.
 * Полностью декоративный, aria-hidden.
 */
export default function HeroBlob() {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-[620px] items-center justify-center"
    >
      <div className="absolute inset-0 rounded-full border border-purple-200/50" />
      <div className="absolute inset-12 rounded-full border border-purple-100/40" />

      <div className="relative h-[520px] w-[520px] blur-[1px]">
        <div className="ps-lava-shape ps-lava-shape-1" />
        <div className="ps-lava-shape ps-lava-shape-2" />
        <div className="ps-lava-shape ps-lava-shape-3" />
        <div className="ps-lava-shape ps-lava-shape-4" />
      </div>
    </div>
  );
}
