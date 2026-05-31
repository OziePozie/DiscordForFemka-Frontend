import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeroIcon } from './HeroIcon';
import { ItemIcon } from './ItemIcon';
import { PlayerNameLink } from '@/components/PlayerNameLink';
import { formatGameTime } from '@/lib/dota/format';
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg">
            🏆 Победитель: {winnerName}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {formatGameTime(result.durationSec)} ·{' '}
            <span className="font-mono">
              {result.radiantScore}:{result.direScore}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResultTable
          label={`${teamName(match.teamA)} (Radiant)`}
          rows={result.radiant}
          won={radiantWon}
          meId={meId}
        />
        <ResultTable
          label={`${teamName(match.teamB)} (Dire)`}
          rows={result.dire}
          won={!radiantWon}
          meId={meId}
        />
      </CardContent>
    </Card>
  );
}

function ResultTable({
  label,
  rows,
  won,
  meId,
}: {
  label: string;
  rows: MatchPlayerStatDto[];
  won: boolean;
  meId?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <div className={`font-semibold ${won ? 'text-green-700' : ''}`}>
          {label}
        </div>
        {won && <Badge variant="default">WIN</Badge>}
      </div>
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
              return (
                <tr key={r.steamAccountId} className={`border-t ${isMe ? 'bg-accent/40' : ''}`}>
                  <td className="px-2 py-1">
                    <div className="flex items-center gap-2">
                      <HeroIcon heroId={r.heroId} size={28} />
                      <PlayerNameLink
                        playerId={r.playerId}
                        nickname={r.playerName ?? `#${r.steamAccountId}`}
                        className="truncate max-w-[8.75rem]"
                      />
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
                <td colSpan={11} className="px-2 py-3 text-center text-muted-foreground">
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
