import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { HeroIcon } from './HeroIcon';
import { ItemIcon } from './ItemIcon';
import { PlayerNameLink } from '@/components/PlayerNameLink';
import { formatGameTime } from '@/lib/dota/format';
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            LIVE — ожидаем данные…
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            LIVE · {formatGameTime(snapshot.gameTime)}
          </CardTitle>
          <div className="font-mono text-2xl font-bold">
            <span>{snapshot.radiant.score}</span>
            <span className="px-2 text-muted-foreground">:</span>
            <span>{snapshot.dire.score}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <TeamSection
          label={`${teamName(sideTeam(match, snapshot.radiantTeamId, 'radiant'))} (Radiant)`}
          team={snapshot.radiant}
          meId={meId}
        />
        <TeamSection
          label={`${teamName(sideTeam(match, snapshot.direTeamId, 'dire'))} (Dire)`}
          team={snapshot.dire}
          meId={meId}
        />
      </CardContent>
    </Card>
  );
}

function TeamSection({
  label,
  team,
  meId,
}: {
  label: string;
  team: TeamLiveDto;
  meId?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="font-semibold">{label}</div>
        <Badge variant="outline">
          NW: {team.netWorth.toLocaleString('ru-RU')}
        </Badge>
      </div>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-2 py-1 text-left">Игрок</th>
              <th className="px-2 py-1 text-center">Lvl</th>
              <th className="px-2 py-1 text-center">K/D/A</th>
              <th className="px-2 py-1 text-center">LH/DN</th>
              <th className="px-2 py-1 text-center">NW</th>
              <th className="px-2 py-1 text-left">Items</th>
            </tr>
          </thead>
          <tbody>
            {team.players.map((p) => (
              <PlayerRow key={p.steamAccountId} p={p} meId={meId} />
            ))}
            {team.players.length === 0 && (
              <tr>
                <td colSpan={6} className="px-2 py-3 text-center text-muted-foreground">
                  Нет данных
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlayerRow({ p, meId }: { p: PlayerLiveDto; meId?: string }) {
  const isMe = meId && p.playerId === meId;
  return (
    <tr className={`border-t ${isMe ? 'bg-accent/40' : ''}`}>
      <td className="px-2 py-1">
        <div className="flex items-center gap-2">
          <HeroIcon heroId={p.heroId} size={28} />
          <PlayerNameLink
            playerId={p.playerId}
            nickname={p.name}
            className="truncate max-w-[8.75rem]"
          />
        </div>
      </td>
      <td className="px-2 py-1 text-center font-mono">{p.level}</td>
      <td className="px-2 py-1 text-center font-mono">
        {p.kills}/{p.deaths}/{p.assists}
      </td>
      <td className="px-2 py-1 text-center font-mono">
        {p.lastHits}/{p.denies}
      </td>
      <td className="px-2 py-1 text-center font-mono">
        {p.netWorth.toLocaleString('ru-RU')}
      </td>
      <td className="px-2 py-1">
        <div className="flex flex-wrap gap-0.5">
          {p.items.slice(0, 6).map((id, i) => (
            <ItemIcon key={`inv-${i}`} itemId={id} size={22} />
          ))}
        </div>
      </td>
    </tr>
  );
}
