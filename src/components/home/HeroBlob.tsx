/**
 * Hero-блоб — иридисцентная 3D S-форма (PNG-рендер из брендового лого).
 * Рендерится в правой колонке HomeHero, обёрнут в круг с двумя декоративными
 * бордерами. Полностью декоративный, aria-hidden.
 *
 * Раньше тут был CSS-fake из 4 морфящихся shape'ов с goo-фильтром — выглядел
 * как «бабблы», заменили на реальный 3D-asset.
 */
export default function HeroBlob() {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-[620px] items-center justify-center"
    >
      <div className="absolute inset-0 rounded-full border border-purple-200/50" />
      <div className="absolute inset-12 rounded-full border border-purple-100/40" />

      <img
        src="/hero-blob.png"
        alt=""
        className="relative max-h-[600px] w-auto select-none drop-shadow-[0_30px_80px_rgba(170,120,255,0.35)]"
        draggable={false}
      />
    </div>
  );
}
