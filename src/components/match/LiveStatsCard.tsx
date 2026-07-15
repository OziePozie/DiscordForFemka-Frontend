import { Skeleton } from '@/components/ui/skeleton';
import { HeroIcon } from './HeroIcon';
import { ItemIcon } from './ItemIcon';
import { PlayerNameLink } from '@/components/PlayerNameLink';
import { formatGameTime, heroName } from '@/lib/dota/format';
import { teamName } from '@/lib/format';
import type {
  MatchDto,
  MatchLiveSnapshotDto,
  PlayerLiveDto,
  TeamLiveDto,
} from '@/lib/api/types';

interface Props {
  match: MatchDto;
  snapshot: MatchLiveSnapshotDto | null | undefined;
  meId?: string;
}

/** Единый шаблон колонок шапки и строк обеих команд (см. ResultStatsCard). */
const GRID_COLS =
  'grid grid-cols-[46px_140px_40px_64px_56px_66px_1fr] [column-gap:8px] items-center';

/**
 * Resolve which platform team is on a given Dota side. The backend attributes each
 * side to teamA/teamB via {@code radiantTeamId}/{@code direTeamId}, which stays correct
 * even when a coin toss flips sides mid-lobby. Falls back to the historical static
 * mapping (Radiant = teamA, Dire = teamB) when the id is absent or unrecognised.
 */
function sideTeam(
  match: MatchDto,
  teamId: string | null | undefined,
  side: 'radiant' | 'dire',
) {
  if (teamId) {
    if (match.teamA?.id === teamId) return match.teamA;
    if (match.teamB?.id === teamId) return match.teamB;
  }
  return side === 'radiant' ? match.teamA : match.teamB;
}

export function LiveStatsCard({ match, snapshot, meId }: Props) {
  if (!snapshot) {
    return (
      <div className="space-y-4">
        <div className="ec-kicker flex items-center gap-2 text-[0.75rem] text-live [letter-spacing:0.1em]">
          <span className="ec-dot animate-pulse bg-live" />
          LIVE — ожидаем данные…
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
        <div className="ec-kicker flex items-center gap-2 text-[0.75rem] text-live [letter-spacing:0.1em]">
          <span className="ec-dot animate-pulse bg-live" />
          LIVE · {formatGameTime(snapshot.gameTime)}
        </div>
        <div className="ec-num flex items-baseline gap-2 text-[1.5rem] text-ink">
          <span>{snapshot.radiant.score}</span>
          <span className="text-line-num">—</span>
          <span>{snapshot.dire.score}</span>
        </div>
      </div>

      <TeamSection
        teamName={teamName(sideTeam(match, snapshot.radiantTeamId, 'radiant'))}
        sideLabel="Radiant"
        team={snapshot.radiant}
        meId={meId}
      />
      <TeamSection
        teamName={teamName(sideTeam(match, snapshot.direTeamId, 'dire'))}
        sideLabel="Dire"
        team={snapshot.dire}
        meId={meId}
      />
    </div>
  );
}

function TeamSection({
  teamName,
  sideLabel,
  team,
  meId,
}: {
  teamName: string;
  sideLabel: string;
  team: TeamLiveDto;
  meId?: string;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <h3 className="ec-display text-[1.0625rem] text-ink">{teamName}</h3>
        <span className="ec-kicker text-[0.75rem] text-ink-faint [letter-spacing:0.1em]">
          {sideLabel.toUpperCase()}
        </span>
        <span className="ec-num ml-auto text-[0.8125rem] font-bold text-brand">
          NW {team.netWorth.toLocaleString('ru-RU')}
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          <div
            className={`${GRID_COLS} ec-kicker border-b-[1.5px] border-ink pb-2 text-[0.6875rem] text-ink-faint [letter-spacing:0.1em]`}
          >
            <span />
            <span>Игрок</span>
            <span className="text-right">LVL</span>
            <span className="text-right">K/D/A</span>
            <span className="text-right">LH/DN</span>
            <span className="text-right">NW</span>
            <span>Предметы</span>
          </div>

          {team.players.map((p) => (
            <PlayerRow key={p.steamAccountId} p={p} meId={meId} />
          ))}

          {team.players.length === 0 && (
            <div className="py-3 text-center text-sm text-ink-muted">
              Нет данных
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerRow({ p, meId }: { p: PlayerLiveDto; meId?: string }) {
  const isMe = !!meId && p.playerId === meId;
  return (
    <div className={`${GRID_COLS} border-b border-line py-[9px]`}>
      <span title={heroName(p.heroId)} className="inline-flex">
        <HeroIcon heroId={p.heroId} width={42} height={24} className="!rounded-[4px]" />
      </span>
      <div className="flex min-w-0 items-center gap-1" title={p.name}>
        <PlayerNameLink
          playerId={p.playerId}
          nickname={p.name}
          className={`min-w-0 flex-1 truncate font-semibold ${
            isMe ? 'text-brand' : 'text-ink'
          }`}
        />
      </div>
      <span className="ec-num text-right text-[0.78125rem] font-semibold text-ink">
        {p.level}
      </span>
      <span className="ec-num text-right text-[0.78125rem] font-semibold text-ink">
        {p.kills}/{p.deaths}/{p.assists}
      </span>
      <span className="ec-num text-right text-[0.78125rem] text-ink-muted">
        {p.lastHits}/{p.denies}
      </span>
      <span className="ec-num text-right text-[0.78125rem] font-bold text-brand">
        {p.netWorth.toLocaleString('ru-RU')}
      </span>
      <div className="flex flex-wrap gap-[3px]">
        {p.items.slice(0, 6).map((id, i) => (
          <ItemIcon key={`inv-${i}`} itemId={id} size={26} />
        ))}
      </div>
    </div>
  );
}
