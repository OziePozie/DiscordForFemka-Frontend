import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeroIcon } from './HeroIcon';
import { ItemIcon } from './ItemIcon';
import { PlayerNameLink } from '@/components/PlayerNameLink';
import { formatGameTime, heroName } from '@/lib/dota/format';
import { teamName } from '@/lib/format';
import type {
  MatchDto,
  MatchPlayerStatDto,
  MatchResultDto,
} from '@/lib/api/types';

interface Props {
  match: MatchDto;
  result: MatchResultDto;
  meId?: string;
}

export function ResultStatsCard({ match, result, meId }: Props) {
  const radiantWon = result.winnerTeamId === match.teamA?.id;
  const winnerName = radiantWon ? teamName(match.teamA) : teamName(match.teamB);
  const mvpId = result.mvpSteamAccountId ?? null;

  return (
    <div className="space-y-4">
      {/* Winner banner with score + duration */}
      <Card className="overflow-hidden border-green-600/40">
        <div className="bg-gradient-to-r from-green-600/10 via-transparent to-transparent">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden>
                🏆
              </span>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Победитель
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {winnerName}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-3xl font-bold tracking-tight">
                <span className={radiantWon ? 'text-green-700' : ''}>
                  {result.radiantScore}
                </span>
                <span className="px-2 text-muted-foreground">:</span>
                <span className={!radiantWon ? 'text-green-700' : ''}>
                  {result.direScore}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Длительность {formatGameTime(result.durationSec)}
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      <ResultSide
        teamName={teamName(match.teamA)}
        sideLabel="Radiant"
        rows={result.radiant}
        won={radiantWon}
        meId={meId}
        mvpId={mvpId}
      />
      <ResultSide
        teamName={teamName(match.teamB)}
        sideLabel="Dire"
        rows={result.dire}
        won={!radiantWon}
        meId={meId}
        mvpId={mvpId}
      />
    </div>
  );
}

function ResultSide({
  teamName,
  sideLabel,
  rows,
  won,
  meId,
  mvpId,
}: {
  teamName: string;
  sideLabel: string;
  rows: MatchPlayerStatDto[];
  won: boolean;
  meId?: string;
  mvpId: number | null;
}) {
  return (
    <Card
      className={
        won ? 'border-green-600/40' : 'border-red-600/30 opacity-95'
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className={`text-lg ${won ? 'text-green-700' : ''}`}>
            {teamName}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              ({sideLabel})
            </span>
          </CardTitle>
          <Badge variant={won ? 'default' : 'destructive'}>
            {won ? 'Победа' : 'Поражение'}
          </Badge>
        </div>
        {/* Picks row — the heroes this side played, rendered as larger portraits */}
        <div className="mt-2 flex flex-wrap gap-2">
          {rows.map((r) => (
            <div
              key={`pick-${r.steamAccountId}`}
              className="relative"
              title={heroName(r.heroId)}
            >
              <HeroIcon
                heroId={r.heroId}
                size={48}
                className="ring-1 ring-border"
              />
              {mvpId != null && r.steamAccountId === mvpId && (
                <span
                  className="absolute -right-1 -top-1 rounded-full bg-yellow-400 px-1 text-[10px] font-bold text-black shadow"
                  title="MVP"
                >
                  MVP
                </span>
              )}
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResultTable rows={rows} meId={meId} mvpId={mvpId} />
      </CardContent>
    </Card>
  );
}

function ResultTable({
  rows,
  meId,
  mvpId,
}: {
  rows: MatchPlayerStatDto[];
  meId?: string;
  mvpId: number | null;
}) {
  return (
    <div className="rounded-md border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wider">
          <tr>
            <th className="px-2 py-1 text-left">Игрок</th>
            <th className="px-2 py-1 text-center">Lvl</th>
            <th className="px-2 py-1 text-center">K/D/A</th>
            <th className="px-2 py-1 text-center">LH/DN</th>
            <th className="px-2 py-1 text-center">GPM</th>
            <th className="px-2 py-1 text-center">XPM</th>
            <th className="px-2 py-1 text-center">NW</th>
            <th className="px-2 py-1 text-center">HD</th>
            <th className="px-2 py-1 text-center">TD</th>
            <th className="px-2 py-1 text-center">HH</th>
            <th className="px-2 py-1 text-left">Items</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isMe = meId && r.playerId === meId;
            const isMvp = mvpId != null && r.steamAccountId === mvpId;
            return (
              <tr
                key={r.steamAccountId}
                className={`border-t ${isMe ? 'bg-accent/40' : ''} ${
                  isMvp ? 'bg-yellow-400/10' : ''
                }`}
              >
                <td className="px-2 py-1">
                  <div className="flex items-center gap-2">
                    <HeroIcon heroId={r.heroId} size={32} />
                    <PlayerNameLink
                      playerId={r.playerId}
                      nickname={r.playerName ?? `#${r.steamAccountId}`}
                      className="truncate max-w-[8.75rem]"
                    />
                    {isMvp && (
                      <span
                        className="text-yellow-500"
                        title="MVP"
                        aria-label="MVP"
                      >
                        ★
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-1 text-center font-mono">{r.level}</td>
                <td className="px-2 py-1 text-center font-mono">
                  {r.kills}/{r.deaths}/{r.assists}
                </td>
                <td className="px-2 py-1 text-center font-mono">
                  {r.lastHits}/{r.denies}
                </td>
                <td className="px-2 py-1 text-center font-mono">{r.gpm}</td>
                <td className="px-2 py-1 text-center font-mono">{r.xpm}</td>
                <td className="px-2 py-1 text-center font-mono">
                  {r.netWorth.toLocaleString('ru-RU')}
                </td>
                <td className="px-2 py-1 text-center font-mono">
                  {r.heroDamage.toLocaleString('ru-RU')}
                </td>
                <td className="px-2 py-1 text-center font-mono">
                  {r.towerDamage.toLocaleString('ru-RU')}
                </td>
                <td className="px-2 py-1 text-center font-mono">
                  {r.heroHealing.toLocaleString('ru-RU')}
                </td>
                <td className="px-2 py-1">
                  <div className="flex flex-wrap gap-0.5">
                    {r.items.slice(0, 6).map((id, i) => (
                      <ItemIcon key={`inv-${i}`} itemId={id} size={22} />
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={11}
                className="px-2 py-3 text-center text-muted-foreground"
              >
                Нет данных
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
