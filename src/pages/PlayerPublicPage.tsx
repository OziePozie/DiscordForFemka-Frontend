import { Link, useParams } from 'react-router-dom';
import { TeamNameLink } from '@/components/TeamNameLink';
import { PlayerRatingCard } from '@/components/PlayerRatingCard';
import { PlayerStats } from '@/components/PlayerStats';
import { PlayerMatchesTab } from '@/components/PlayerMatchesTab';
import { usePlayer, usePlayerHistory } from '@/lib/queries';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MMR_SOURCE_LABEL,
  POSITION_LABEL,
  TEAM_MEMBER_ROLE_LABEL,
  TOURNAMENT_STATUS_LABEL,
  type TournamentStatus,
} from '@/lib/api/types';
import { timeAgo } from '@/lib/utils';

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function fmtDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function tournamentStatusVariant(s: TournamentStatus) {
  switch (s) {
    case 'LIVE':
    case 'REGISTRATION_OPEN':
      return 'default' as const;
    case 'REGISTRATION_CLOSED':
    case 'ANNOUNCED':
      return 'secondary' as const;
    case 'CANCELLED':
      return 'destructive' as const;
    case 'FINISHED':
      return 'outline' as const;
  }
}

export default function PlayerPublicPage() {
  const { id } = useParams<{ id: string }>();
  const q = usePlayer(id);
  const historyQ = usePlayerHistory(id);

  if (q.isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }
  if (q.isError) {
    return (
      <div className="text-sm text-destructive">
        Не удалось загрузить игрока: {q.error?.message ?? 'unknown error'}
      </div>
    );
  }
  const p = q.data;
  if (!p) {
    return <div className="text-sm text-muted-foreground">Игрок не найден.</div>;
  }

  const initials = (p.nickname ?? '?').slice(0, 2).toUpperCase();
  const history = historyQ.data;
  const mmrTimeline = (history?.mmrTimeline ?? []).slice(0, 50);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {p.avatarUrl && <AvatarImage src={p.avatarUrl} alt="" />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">
                {p.nickname ?? 'Без ника'}
              </CardTitle>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {p.country && <Badge variant="outline">{p.country}</Badge>}
                {p.primaryRole && (
                  <Badge variant="secondary">
                    {POSITION_LABEL[p.primaryRole]}
                  </Badge>
                )}
                <Badge
                  variant={p.activity === 'ACTIVE' ? 'default' : 'outline'}
                >
                  {p.activity === 'ACTIVE' ? 'Активен' : 'Неактивен'}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {p.mmr && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">MMR:</span>
              <span className="text-lg font-semibold">{p.mmr.mmr}</span>
              <Badge variant="outline">{MMR_SOURCE_LABEL[p.mmr.source]}</Badge>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {p.discordId && (
              <Badge variant="secondary">Discord: {p.discordId}</Badge>
            )}
            {p.twitchLogin && (
              <Badge variant="secondary">Twitch: {p.twitchLogin}</Badge>
            )}
          </div>

          {p.createdAt && (
            <div className="text-sm text-muted-foreground">
              Присоединился: {timeAgo(p.createdAt)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Internal platform rating */}
      <PlayerRatingCard playerId={id} />

      {/* Career stats: winrate, KDA, favorite heroes, streaks */}
      <PlayerStats playerId={id} />

      {/* Played matches with post-game stats */}
      <PlayerMatchesTab playerId={id} />

      {/* Tournaments history */}
      <Card>
        <CardHeader>
          <CardTitle>История турниров</CardTitle>
          <CardDescription>
            {historyQ.isLoading
              ? 'Загрузка…'
              : `${history?.tournaments.length ?? 0} турниров`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyQ.isLoading && <Skeleton className="h-32 w-full" />}
          {historyQ.isError && (
            <div className="text-sm text-destructive">
              Не удалось загрузить историю турниров.
            </div>
          )}
          {history && history.tournaments.length === 0 && (
            <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
              Игрок ещё не участвовал в турнирах.
            </div>
          )}
          {history && history.tournaments.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium">Турнир</th>
                    <th className="px-4 py-2 font-medium">Команда</th>
                    <th className="px-4 py-2 font-medium">Статус</th>
                    <th className="px-4 py-2 font-medium">Период</th>
                    <th className="px-4 py-2 text-center font-medium">
                      Победа
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.tournaments.map((t) => (
                    <tr
                      key={`${t.tournamentId}-${t.teamId}`}
                      className="border-t"
                    >
                      <td className="px-4 py-2">
                        <Link
                          to={`/tournaments/${t.tournamentSlug}`}
                          className="hover:underline"
                        >
                          {t.tournamentName}
                        </Link>
                      </td>
                      <td className="px-4 py-2">
                        <TeamNameLink
                          teamId={t.teamId}
                          name={t.teamName}
                          tag={t.teamTag}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant={tournamentStatusVariant(t.status)}>
                          {TOURNAMENT_STATUS_LABEL[t.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {fmtDate(t.startsAt)} — {fmtDate(t.endsAt)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {t.wasWinner ? (
                          <span aria-label="чемпион" title="Чемпион">
                            🏆
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teams history */}
      <Card>
        <CardHeader>
          <CardTitle>Команды</CardTitle>
          <CardDescription>
            {historyQ.isLoading
              ? 'Загрузка…'
              : `${history?.teams.length ?? 0} записей`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyQ.isLoading && <Skeleton className="h-24 w-full" />}
          {history && history.teams.length === 0 && (
            <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
              Игрок не состоял ни в одной команде.
            </div>
          )}
          {history && history.teams.length > 0 && (
            <ul className="space-y-2">
              {history.teams.map((te) => {
                const active = te.leftAt == null;
                return (
                  <li
                    key={`${te.teamId}-${te.joinedAt}`}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-4 py-2 ${
                      active ? 'bg-accent/40' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <TeamNameLink
                        teamId={te.teamId}
                        name={te.teamName}
                        tag={te.teamTag}
                        className="font-medium"
                      />
                      <Badge variant="outline">
                        {TEAM_MEMBER_ROLE_LABEL[te.role]}
                      </Badge>
                      {active && (
                        <Badge variant="default">текущая</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {fmtDate(te.joinedAt)} —{' '}
                      {te.leftAt ? fmtDate(te.leftAt) : 'настоящее время'}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* MMR history */}
      <Card>
        <CardHeader>
          <CardTitle>MMR</CardTitle>
          <CardDescription>
            {historyQ.isLoading
              ? 'Загрузка…'
              : `Последние ${mmrTimeline.length} записей`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyQ.isLoading && <Skeleton className="h-24 w-full" />}
          {history && mmrTimeline.length === 0 && (
            <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
              История MMR пуста.
            </div>
          )}
          {mmrTimeline.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium">MMR</th>
                    <th className="px-4 py-2 font-medium">Источник</th>
                    <th className="px-4 py-2 font-medium">Загружено</th>
                    <th className="px-4 py-2 font-medium">Подтверждено</th>
                  </tr>
                </thead>
                <tbody>
                  {mmrTimeline.map((row, i) => (
                    <tr key={`${row.fetchedAt}-${i}`} className="border-t">
                      <td className="px-4 py-2 font-mono">
                        {row.mmr ?? '—'}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline">
                          {MMR_SOURCE_LABEL[row.source]}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {fmtDateTime(row.fetchedAt)}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {fmtDateTime(row.confirmedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
