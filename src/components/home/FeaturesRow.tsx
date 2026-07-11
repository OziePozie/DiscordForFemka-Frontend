const FEATURES = [
  {
    title: 'Удобные инструменты',
    desc: 'Сетки, расписание, автоматизация и инструменты для турниров.',
  },
  {
    title: 'Экосистема команд',
    desc: 'Команды, игроки, статистика и матчи в одном месте.',
  },
  {
    title: 'Профили организаторов',
    desc: 'Репутация, история турниров и отзывы участников.',
  },
  {
    title: 'Безопасность',
    desc: 'Честные матчи, защита данных и прозрачные правила.',
  },
] as const;

/**
 * Нижний маркетинговый блок в стиле «Editorial Clean»: четыре колонки,
 * разделённые тонкими линиями, нумерация JetBrains Mono, без заливок.
 */
export default function FeaturesRow() {
  return (
    <section className="px-10 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid border-t border-line divide-y divide-line md:grid-cols-4 md:divide-x md:divide-y-0 md:[&>*:first-child]:pl-0">
          {FEATURES.map(({ title, desc }, i) => (
            <div key={title} className="py-7 md:px-8">
              <span className="ec-num text-[0.75rem] text-ink-faint">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="ec-display mt-3 text-[1.125rem] leading-tight text-ink">
                {title}
              </h3>
              <p className="mt-3 text-[0.875rem] leading-relaxed text-ink-muted">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
