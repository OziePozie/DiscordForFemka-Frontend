/**
 * Hero-блоб — иридисцентная 3D S-форма (PNG-рендер из брендового лого).
 * Рендерится в правой колонке HomeHero. Полностью декоративный, aria-hidden.
 *
 * Фон PNG'а вычищен через alpha-threshold (см. PowerShell-скрипт при сборке
 * ассета), плюс key-out магенты от «stage»-текста — изображение чисто
 * впечатывается в страничный фон, мягкий drop-shadow даёт глубину.
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
        className="relative max-h-[600px] w-auto select-none drop-shadow-[0_40px_90px_rgba(140,100,255,0.35)]"
        draggable={false}
      />
    </div>
  );
}
