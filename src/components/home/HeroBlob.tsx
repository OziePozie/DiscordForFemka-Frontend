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
      className="relative flex h-[38.75rem] items-center justify-center"
    >
      <img
        src="/hero-blob.png"
        alt=""
        className="relative max-h-[37.5rem] w-auto select-none drop-shadow-[0_2.5rem_5.625rem_rgba(140,100,255,0.35)]"
        draggable={false}
      />
    </div>
  );
}
