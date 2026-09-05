import { useNavigate } from 'react-router-dom';
import type { TournamentDto, TournamentStatus } from '@/lib/api/types';
import {
  TOURNAMENT_FORMAT_LABEL,
  TOURNAMENT_STATUS_LABEL,
} from '@/lib/api/types';

interface TournamentCardProps {
  tournament: TournamentDto;
  index: number;
}

function fmtDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

function statusPresentation(status: TournamentStatus): {
  color: string;
  text: string;
} {
  switch (status) {
    case 'REGISTRATION_OPEN':
      return { color: 'hsl(var(--success))', text: 'Регистрация открыта' };
    case 'LIVE':
      return { color: 'hsl(var(--live))', text: 'Идёт сейчас' };
    default:
      return {
        color: 'hsl(var(--ink-faint))',
        text: TOURNAMENT_STATUS_LABEL[status],
      };
  }
}

/**
 * Ячейка редакционной сетки «Активные турниры»: номер · название · две
 * строки меты · статус-строка с цветной точкой. Без рамок и заливок —
 * разделение обеспечивают вертикальные линии сетки в родителе.
 */
export default function TournamentCard({
  tournament,
  index,
}: TournamentCardProps) {
  const navigate = useNavigate();
  const { color, text } = statusPresentation(tournament.status);

  const teamsLine = tournament.maxTeams
    ? `${TOURNAMENT_FORMAT_LABEL[tournament.format]} · до ${tournament.maxTeams} команд`
    : TOURNAMENT_FORMAT_LABEL[tournament.format];

  const dateLine = tournament.startsAt
    ? `Старт ${fmtDate(tournament.startsAt)}${
        tournament.endsAt ? ` – ${fmtDate(tournament.endsAt)}` : ''
      }`
    : tournament.registrationOpensAt
      ? `Регистрация с ${fmtDate(tournament.registrationOpensAt)}`
      : 'Даты уточняются';

  return (
    <button
      type="button"
      onClick={() => navigate(`/tournaments/${tournament.slug}`)}
      aria-label={`К турниру «${tournament.name}»`}
      className="group flex w-full flex-col items-start py-7 text-left md:px-8"
    >
      <span className="ec-num text-[0.75rem] text-ink-faint">
        {String(index + 1).padStart(2, '0')}
      </span>

      <h3 className="ec-display mt-3 line-clamp-2 text-[1.3125rem] leading-tight text-ink transition-colors group-hover:text-brand">
        {tournament.name}
      </h3>

      <div className="mt-3 space-y-1 text-[0.875rem] leading-snug text-ink-muted">
        <div>{teamsLine}</div>
        <div className="ec-num text-[0.8125rem]">{dateLine}</div>
      </div>

      <div className="mt-5 flex items-center gap-2 text-[0.8125rem] font-semibold">
        <span className="ec-dot" style={{ backgroundColor: color }} />
        <span style={{ color }}>{text}</span>
      </div>
    </button>
  );
}
