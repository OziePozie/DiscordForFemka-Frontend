import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useStandings, useTournamentMatches } from '@/lib/queries';
import type {
  GroupStandingsDto,
  MatchDto,
  StageConfigDto,
} from '@/lib/api/types';

const groupLetter = (groupNo: number) => String.fromCharCode(65 + groupNo);

// Standings-таблица + матчи по турам для всех групп турнира.
// Рендерится только когда у турнира есть GROUP-стадия (решает родитель).
export function GroupStageBlock({
  tournamentId,
  groupConfig,
}: {
  tournamentId: string;
  groupConfig: StageConfigDto | null | undefined;
}) {
  const standingsQ = useStandings(tournamentId);
  // Бэк ограничивает размер страницы сотней записей; этого хватает —
  // макс. реалистичное число матчей турнира ~80.
  const matchesQ = useTournamentMatches(tournamentId, { page: 0, size: 100 });

  if (standingsQ.isLoading || matchesQ.isLoading)
    return <Skeleton className="h-60 w-full" />;
  if (standingsQ.isError)
    return (
      <div className="text-sm text-destructive">
        Не удалось загрузить таблицу групп:{' '}
        {standingsQ.error?.message ?? 'unknown error'}
      </div>
    );

  const groups = standingsQ.data ?? [];
  const groupMatches = (matchesQ.data?.items ?? []).filter(
    (m) => m.groupNo != null,
  );
  if (groups.length === 0) return null;

  const advUpper = groupConfig?.advanceToUpper ?? 0;
  const advLower = groupConfig?.advanceToLower ?? 0;

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <GroupCard
          key={g.groupNo}
          group={g}
          matches={groupMatches.filter((m) => m.groupNo === g.groupNo)}
          advUpper={advUpper}
          advLower={advLower}
        />
      ))}
      {(advUpper > 0 || advLower > 0) && (
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          {advUpper > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-green-500/70" />
              выход в верхнюю сетку (топ-{advUpper})
            </span>
          )}
          {advLower > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-500/70" />
              выход в нижнюю сетку (следующие {advLower})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function GroupCard({
  group,
  matches,
  advUpper,
  advLower,
}: {
  group: GroupStandingsDto;
  matches: MatchDto[];
  advUpper: number;
  advLower: number;
}) {
  const rounds = new Map<number, MatchDto[]>();
  for (const m of matches) {
    const r = m.groupRound ?? 0;
    if (!rounds.has(r)) rounds.set(r, []);
    rounds.get(r)!.push(m);
  }
  const sortedRounds = [...rounds.entries()].sort(([a], [b]) => a - b);

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="text-sm font-medium">
        Группа {groupLetter(group.groupNo)}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-1.5 pr-2 font-normal">#</th>
              <th className="py-1.5 pr-2 font-normal">Команда</th>
              <th className="py-1.5 pr-2 text-right font-normal">Очки</th>
              <th className="py-1.5 pr-2 text-right font-normal">Серии</th>
              <th className="py-1.5 pr-2 text-right font-normal">Игры</th>
              <th className="py-1.5 text-right font-normal">±</th>
            </tr>
          </thead>
          <tbody>
            {group.rows.map((row) => {
              const toUpper = row.rank <= advUpper;
              const toLower = !toUpper && row.rank <= advUpper + advLower;
              const stripe = toUpper
                ? 'border-l-2 border-l-green-500/70'
                : toLower
                  ? 'border-l-2 border-l-amber-500/70'
                  : 'border-l-2 border-l-transparent';
              return (
                <tr key={row.rank} className={`border-b last:border-b-0 ${stripe}`}>
                  <td className="py-1.5 pl-2 pr-2 font-mono text-xs">
                    {row.rank}
                  </td>
                  <td className="py-1.5 pr-2">
                    <span className="truncate">{row.team?.name ?? '—'}</span>
                    {row.tied && (
                      <span
                        className="ml-1.5 text-xs text-muted-foreground"
                        title="Равенство по тай-брейкам"
                      >
                        =
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 pr-2 text-right font-semibold">
                    {row.points}
                  </td>
                  <td className="py-1.5 pr-2 text-right font-mono text-xs">
                    {row.seriesWon}–{row.seriesLost}
                  </td>
                  <td className="py-1.5 pr-2 text-right font-mono text-xs">
                    {row.gamesWon}–{row.gamesLost}
                  </td>
                  <td className="py-1.5 text-right font-mono text-xs">
                    {row.gameDiff > 0 ? `+${row.gameDiff}` : row.gameDiff}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {sortedRounds.length > 0 && (
        <div className="space-y-2">
          {sortedRounds.map(([round, ms]) => (
            <div key={round} className="space-y-1">
              <div className="text-xs text-muted-foreground">Тур {round}</div>
              {[...ms]
                .sort(
                  (a, b) =>
                    (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? '') ||
                    a.id.localeCompare(b.id),
                )
                .map((m) => (
                  <GroupMatchRow key={m.id} m={m} />
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupMatchRow({ m }: { m: MatchDto }) {
  const finished = m.status === 'FINISHED';
  const aWin = finished && m.winnerTeamId === m.teamA?.id;
  const bWin = finished && m.winnerTeamId === m.teamB?.id;
  return (
    <Link
      to={`/matches/${m.id}`}
      className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted/50"
    >
      <span className={`truncate ${aWin ? 'font-semibold text-green-700' : ''}`}>
        {m.teamA?.name ?? '—'}
      </span>
      <span className="shrink-0 font-mono text-xs">
        {m.scoreA}:{m.scoreB}
      </span>
      <span
        className={`truncate text-right ${bWin ? 'font-semibold text-green-700' : ''}`}
      >
        {m.teamB?.name ?? '—'}
      </span>
    </Link>
  );
}
