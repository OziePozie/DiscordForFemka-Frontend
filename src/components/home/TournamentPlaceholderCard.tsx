interface TournamentPlaceholderCardProps {
  index: number;
}

/**
 * Заглушка редакционной сетки «Активные турниры», когда реальных турниров
 * меньше трёх. Повторяет структуру ячейки, но приглушёнными цветами и без
 * интерактива — «Скоро анонс».
 */
export default function TournamentPlaceholderCard({
  index,
}: TournamentPlaceholderCardProps) {
  return (
    <div className="flex w-full flex-col items-start py-7 md:px-8">
      <span className="ec-num text-[0.75rem] text-ink-disabled">
        {String(index + 1).padStart(2, '0')}
      </span>

      <h3 className="ec-display mt-3 text-[1.3125rem] leading-tight text-ink-disabled">
        Скоро анонс
      </h3>

      <div className="mt-3 space-y-1 text-[0.875rem] leading-snug text-ink-faint">
        <div>Место для нового турнира</div>
        <div>Даты уточняются</div>
      </div>

      <div className="mt-5 flex items-center gap-2 text-[0.8125rem] font-semibold text-ink-faint">
        <span className="ec-dot" style={{ backgroundColor: '#c3c6d4' }} />
        <span>Ожидание</span>
      </div>
    </div>
  );
}
