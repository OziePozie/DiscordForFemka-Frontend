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
      <img
        src="/hero-blob.png"
        alt=""
        className="relative max-h-[600px] w-auto select-none drop-shadow-[0_30px_80px_rgba(170,120,255,0.35)]"
        draggable={false}
        style={{
          // Плавно гасим правый край PNG, чтобы не было видимой границы,
          // которая раньше пересекала caption "Организуй. Соревнуйся. Сияй."
          WebkitMaskImage:
            'linear-gradient(to right, black 0%, black 78%, transparent 100%)',
          maskImage:
            'linear-gradient(to right, black 0%, black 78%, transparent 100%)',
        }}
      />
    </div>
  );
}
