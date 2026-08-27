import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlayerNameLink } from '@/components/PlayerNameLink';
import { useMixPlayers } from '@/lib/queries';
import { POSITION_LABEL, type PlayerPosition } from '@/lib/api/types';

// Ростер MIX — всегда пятёрка (см. комментарий EligibilityValidator на
// бэке: незаполненный expectedTeamSize тоже трактуется как 5). mixTeamCount
// — число составов, а не игроков, поэтому нужное число голов — mixTeamCount
// * ROSTER_SIZE.
const ROSTER_SIZE = 5;

// Публичный список записавшихся на MIX-турнир игроков. Живёт на месте
// «Команд» для TEAM-турниров (TournamentDetailsPage переключает вкладку по
// registrationMode) — тот же слот в навигации, тот же смысл: кто заявился.
export function MixPlayersList({
  tournamentId,
  mixTeamCount,
}: {
  tournamentId: string;
  mixTeamCount?: number | null;
}) {
  const [page, setPage] = useState(0);
  const q = useMixPlayers(tournamentId, { page, size: 20 });

  if (q.isLoading) return <Skeleton className="h-60 w-full" />;
  if (q.isError)
    return (
      <div className="text-sm text-destructive">
        Не удалось загрузить список игроков:{' '}
        {q.error?.message ?? 'unknown error'}
      </div>
    );

  const players = q.data?.items ?? [];
  const total = q.data?.totalItems ?? players.length;
  // null/undefined — организатор не зафиксировал число составов; тогда цели
  // нет и считать нечего, показываем только фактическую явку.
  const needed =
    mixTeamCount != null ? mixTeamCount * ROSTER_SIZE : null;

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        Записалось: <span className="font-semibold text-foreground">{total}</span>
        {needed != null && (
          <>
            {' '}из{' '}
            <span className="font-semibold text-foreground">{needed}</span>{' '}
            нужных
          </>
        )}
      </div>

      {players.length === 0 ? (
        <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
          Пока никто не зарегистрирован.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Игрок</th>
                <th className="px-4 py-2 font-medium">MMR</th>
                <th className="px-4 py-2 font-medium">Роли</th>
                <th className="px-4 py-2 font-medium">Чек-ин</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.playerId} className="border-t">
                  <td className="px-4 py-2">
                    <PlayerNameLink
                      playerId={p.playerId}
                      nickname={p.nickname}
                      className="font-medium"
                    />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {p.mmr ?? 'скрыт'}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {renderPositions(p.preferredPositions)}
                  </td>
                  <td className="px-4 py-2">
                    {p.checkedIn ? (
                      <Badge variant="secondary">Отметился</Badge>
                    ) : (
                      <Badge variant="outline">Не отметился</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(q.data?.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Назад
          </Button>
          <div className="text-sm text-muted-foreground">
            Страница {(q.data?.page ?? page) + 1} из {q.data?.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= (q.data?.totalPages ?? 1)}
            onClick={() => setPage((p) => p + 1)}
          >
            Дальше
          </Button>
        </div>
      )}
    </div>
  );
}

// null — игрок скрыл позиции в приватности профиля; [] — осознанное «любая
// роль» (не то же самое, что null — см. комментарий у MixPlayerDto на бэке);
// непустой список — ранжированное предпочтение, показываем с номером места.
function renderPositions(
  positions: PlayerPosition[] | null | undefined,
): string {
  if (positions == null) return 'скрыто';
  if (positions.length === 0) return 'любая роль';
  return positions.map((p, i) => `${i + 1}. ${POSITION_LABEL[p]}`).join(', ');
}
