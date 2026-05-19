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
          // PNG имеет небольшую не-прозрачную «подложку» вокруг S, которая
          // была видна как прямоугольная граница на лавандовом фоне.
          // Радиальная маска гасит все 4 края разом: центр (где S) виден
          // полностью, а от ~55% радиуса плавный fade в прозрачность.
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 95% at 45% 50%, black 50%, transparent 90%)',
          maskImage:
            'radial-gradient(ellipse 80% 95% at 45% 50%, black 50%, transparent 90%)',
        }}
      />
    </div>
  );
}
