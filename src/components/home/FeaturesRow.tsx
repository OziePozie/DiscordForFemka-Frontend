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
 * Нижний маркетинговый блок: 4 карточки с градиентной иконкой и статичным
 * описанием. Никакой логики — чистая презентация.
 */
export default function FeaturesRow() {
  return (
    <section className="relative z-10 px-10 pb-20">
      <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-4">
        {FEATURES.map(({ title, desc }) => (
          <div
            key={title}
            className="rounded-[1.75rem] border border-white/60 bg-white/55 p-6 shadow-[0_0.625rem_2.5rem_rgba(120,100,255,0.06)] backdrop-blur-xl"
          >
            <div className="mb-5 h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-300 to-blue-300" />
            <h3 className="mb-3 text-xl font-bold text-[#141938]">{title}</h3>
            <p className="text-sm leading-relaxed text-[#6a7191]">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
