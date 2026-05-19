import { useNavigate } from 'react-router-dom';

interface TournamentPlaceholderCardProps {
  /** Если есть текущий сезон, кнопка ведёт на него; иначе — на список сезонов. */
  seasonSlug?: string;
}

/**
 * Карточка-заглушка для секции "Активные турниры", когда реальных турниров
 * не хватает до 3. Дословно повторяет демку: ✦ + "Здесь мог быть ваш турнир".
 */
export default function TournamentPlaceholderCard({
  seasonSlug,
}: TournamentPlaceholderCardProps) {
  const navigate = useNavigate();
  const target = seasonSlug ? `/seasons/${seasonSlug}` : '/seasons';

  return (
    <div className="group flex min-h-[230px] flex-col items-center justify-center rounded-[32px] border border-purple-100 bg-white/60 p-8 text-center backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(139,92,246,0.12)]">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 to-blue-400 text-3xl text-white shadow-lg shadow-purple-300/40">
        ✦
      </div>

      <h3 className="text-2xl font-bold text-[#141938]">
        Здесь мог быть
        <br />
        ваш турнир
      </h3>

      <p className="mt-4 max-w-[260px] leading-relaxed text-[#6a7191]">
        Создайте турнир и соберите лучших игроков на своей сцене.
      </p>

      <button
        className="mt-6 rounded-2xl border border-purple-200 bg-white/70 px-5 py-3 text-sm font-semibold text-purple-700 transition-all duration-300 hover:bg-purple-600 hover:text-white"
        onClick={() => navigate(target)}
      >
        Создать турнир
      </button>
    </div>
  );
}
