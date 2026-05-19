/**
 * Декоративный фоновый слой главной: два больших размытых градиентных пятна
 * и четыре плавающие сферы. Рендерится один раз на уровне HomePage с
 * absolute inset-0 pointer-events-none.
 */
export default function BackgroundDecor() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-purple-300/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-blue-300/20 blur-3xl" />

      <div className="ps-sphere left-[52%] top-[12%] h-10 w-10" />
      <div className="ps-sphere left-[42%] top-[30%] h-16 w-16" />
      <div className="ps-sphere left-[60%] top-[50%] h-8 w-8" />
      <div className="ps-sphere right-[10%] top-[20%] h-12 w-12" />
    </div>
  );
}
