import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useBracket,
  useMe,
  useRegisterTournament,
  useTournament,
  useTournamentMatches,
  useTournamentTeams,
} from '@/lib/queries';
import { useAuth } from '@/lib/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { ProblemDetailError } from '@/lib/api/client';
import {
  MATCH_FORMAT_LABEL,
  MATCH_STATUS_LABEL,
  TOURNAMENT_FORMAT_LABEL,
  TOURNAMENT_STATUS_LABEL,
  type TournamentStatus,
  type MatchStatus,
  type TournamentDto,
  type MatchDto,
} from '@/lib/api/types';

function statusVariant(s: TournamentStatus) {
  switch (s) {
    case 'LIVE':
      return 'default' as const;
    case 'REGISTRATION_OPEN':
    case 'REGISTRATION_CLOSED':
      return 'secondary' as const;
    case 'ANNOUNCED':
    case 'FINISHED':
      return 'outline' as const;
    case 'CANCELLED':
      return 'destructive' as const;
  }
}

function matchStatusVariant(s: MatchStatus) {
  switch (s) {
    case 'LIVE':
      return 'default' as const;
    case 'SCHEDULED':
      return 'secondary' as const;
    case 'FINISHED':
      return 'outline' as const;
    case 'CANCELLED':
      return 'destructive' as const;
  }
}

function fmtDateTime(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TournamentDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const q = useTournament(slug);

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="text-sm text-destructive">
        Не удалось загрузить турнир: {q.error?.message ?? 'unknown error'}
      </div>
    );
  }

  const { tournament, registeredTeamsCount, canRegister, rules } = q.data;

  return (
    <div className="space-y-6">
      <Header tournament={tournament} canRegister={canRegister} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="teams">Команды</TabsTrigger>
          <TabsTrigger value="matches">Матчи</TabsTrigger>
          <TabsTrigger value="bracket">Сетка</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            tournament={tournament}
            rules={rules}
            registeredTeamsCount={registeredTeamsCount}
          />
        </TabsContent>

        <TabsContent value="teams">
          <TeamsTab tournamentId={tournament.id} />
        </TabsContent>

        <TabsContent value="matches">
          <MatchesTab tournamentId={tournament.id} />
        </TabsContent>

        <TabsContent value="bracket">
          <BracketTab tournamentId={tournament.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Header({
  tournament,
  canRegister,
}: {
  tournament: TournamentDto;
  canRegister: boolean;
}) {
  const { isAuthenticated } = useAuth();
  const me = useMe();
  const register = useRegisterTournament();
  const { toast } = useToast();

  const userIsCaptainOfActive = !!me.data?.teams.find(
    (t) => t.role === 'CAPTAIN' && t.teamStatus === 'ACTIVE',
  );

  const canRegBtn =
    isAuthenticated &&
    userIsCaptainOfActive &&
    tournament.status === 'REGISTRATION_OPEN' &&
    canRegister;

  const regHint =
    tournament.status !== 'REGISTRATION_OPEN'
      ? 'Регистрация недоступна для текущего статуса турнира'
      : !isAuthenticated
        ? 'Войдите, чтобы зарегистрировать команду'
        : !userIsCaptainOfActive
          ? 'Только капитан активной команды может регистрировать'
          : !canRegister
            ? 'Регистрация для вашей команды недоступна'
            : '';

  async function handleRegister() {
    try {
      await register.mutateAsync(tournament.id);
      toast({ title: 'Команда зарегистрирована' });
    } catch (e) {
      const msg =
        e instanceof ProblemDetailError
          ? `${e.title}${e.detail ? `: ${e.detail}` : ''}`
          : e instanceof Error
            ? e.message
            : 'Неизвестная ошибка';
      toast({
        title: 'Ошибка регистрации',
        description: msg,
        variant: 'destructive',
      });
    }
  }

  return (
    <header className="space-y-4">
      {tournament.bannerUrl && (
        <img
          src={tournament.bannerUrl}
          alt=""
          className="max-h-64 w-full rounded-lg object-cover"
        />
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {tournament.name}
            </h1>
            <Badge variant={statusVariant(tournament.status)}>
              {TOURNAMENT_STATUS_LABEL[tournament.status]}
            </Badge>
            <Badge variant="outline">
              {TOURNAMENT_FORMAT_LABEL[tournament.format]}
            </Badge>
          </div>
          <div className="space-y-0.5 text-sm text-muted-foreground">
            {(tournament.registrationOpensAt ||
              tournament.registrationClosesAt) && (
              <div>
                Регистрация: {fmtDateTime(tournament.registrationOpensAt)} —{' '}
                {fmtDateTime(tournament.registrationClosesAt)}
              </div>
            )}
            {tournament.prizePoolText && (
              <div>Призовой фонд: {tournament.prizePoolText}</div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button
            onClick={handleRegister}
            disabled={!canRegBtn || register.isPending}
            title={regHint || undefined}
          >
            {register.isPending ? 'Регистрируем…' : 'Зарегистрироваться'}
          </Button>
          {regHint && (
            <span className="text-xs text-muted-foreground">{regHint}</span>
          )}
        </div>
      </div>
    </header>
  );
}

function OverviewTab({
  tournament,
  rules,
  registeredTeamsCount,
}: {
  tournament: TournamentDto;
  rules?: string | null;
  registeredTeamsCount: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Описание</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {tournament.description ? (
            <p className="whitespace-pre-wrap">{tournament.description}</p>
          ) : (
            <p className="text-muted-foreground">Описание не указано.</p>
          )}
          {rules && (
            <div className="space-y-2">
              <h3 className="font-medium">Правила</h3>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {rules}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Регистрация</CardTitle>
          <CardDescription>Слоты и сроки</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Команд:</span>{' '}
            <span className="font-semibold">{registeredTeamsCount}</span>
            {tournament.maxTeams ? ` / ${tournament.maxTeams}` : ''}
          </div>
          <div>
            <span className="text-muted-foreground">Открыта:</span>{' '}
            {fmtDateTime(tournament.registrationOpensAt)}
          </div>
          <div>
            <span className="text-muted-foreground">Закрыта:</span>{' '}
            {fmtDateTime(tournament.registrationClosesAt)}
          </div>
          <div>
            <span className="text-muted-foreground">Старт:</span>{' '}
            {fmtDateTime(tournament.startsAt)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TeamsTab({ tournamentId }: { tournamentId: string }) {
  const q = useTournamentTeams(tournamentId);

  if (q.isLoading) return <Skeleton className="h-60 w-full" />;
  if (q.isError)
    return (
      <div className="text-sm text-destructive">
        Не удалось загрузить команды: {q.error?.message ?? 'unknown error'}
      </div>
    );

  const teams = q.data ?? [];
  if (teams.length === 0)
    return (
      <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
        Пока никто не зарегистрирован.
      </div>
    );

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-4 py-2 font-medium">#</th>
            <th className="px-4 py-2 font-medium">Команда</th>
            <th className="px-4 py-2 font-medium">Капитан</th>
            <th className="px-4 py-2 font-medium">Состояние</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((tt) => (
            <tr key={tt.team.id} className="border-t">
              <td className="px-4 py-2 text-muted-foreground">
                {tt.seed ?? '—'}
              </td>
              <td className="px-4 py-2">
                <Link
                  to={`/teams/${tt.team.id}`}
                  className="font-medium hover:underline"
                >
                  {tt.team.name}
                </Link>{' '}
                <span className="text-muted-foreground">[{tt.team.tag}]</span>
              </td>
              <td className="px-4 py-2">
                <Link
                  to={`/players/${tt.team.captain.id}`}
                  className="hover:underline"
                >
                  {tt.team.captain.nickname ?? 'Без ника'}
                </Link>
              </td>
              <td className="px-4 py-2">
                {tt.withdrawn ? (
                  <Badge variant="destructive">Снялась</Badge>
                ) : (
                  <Badge variant="secondary">Заявлена</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatchesTab({ tournamentId }: { tournamentId: string }) {
  const [page, setPage] = useState(0);
  const q = useTournamentMatches(tournamentId, { page, size: 20 });

  if (q.isLoading) return <Skeleton className="h-60 w-full" />;
  if (q.isError)
    return (
      <div className="text-sm text-destructive">
        Не удалось загрузить матчи: {q.error?.message ?? 'unknown error'}
      </div>
    );

  const matches = q.data?.items ?? [];
  if (matches.length === 0)
    return (
      <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
        Матчей пока нет.
      </div>
    );

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        {matches.map((m) => (
          <MatchRow key={m.id} m={m} />
        ))}
      </div>
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

function MatchRow({ m }: { m: MatchDto }) {
  const finished = m.status === 'FINISHED';
  const aWin = finished && m.winnerTeamId === m.teamA.id;
  const bWin = finished && m.winnerTeamId === m.teamB.id;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm">
      <div className="flex items-center gap-3">
        <Badge variant="outline">{MATCH_FORMAT_LABEL[m.format]}</Badge>
        <span className={aWin ? 'font-semibold text-green-700' : ''}>
          {m.teamA.name} [{m.teamA.tag}]
        </span>
        <span className="text-muted-foreground">vs</span>
        <span className={bWin ? 'font-semibold text-green-700' : ''}>
          {m.teamB.name} [{m.teamB.tag}]
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono">
          {m.scoreA} : {m.scoreB}
        </span>
        <Badge variant={matchStatusVariant(m.status)}>
          {MATCH_STATUS_LABEL[m.status]}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {fmtDateTime(m.scheduledAt)}
        </span>
      </div>
    </div>
  );
}

function BracketTab({ tournamentId }: { tournamentId: string }) {
  const q = useBracket(tournamentId);

  if (q.isLoading) return <Skeleton className="h-60 w-full" />;
  if (q.isError)
    return (
      <div className="text-sm text-destructive">
        Не удалось загрузить сетку: {q.error?.message ?? 'unknown error'}
      </div>
    );

  const bracket = q.data;
  if (!bracket || bracket.rounds.length === 0)
    return (
      <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
        Сетка ещё не сформирована.
      </div>
    );

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {bracket.rounds.map((round) => (
        <div
          key={round.roundIndex}
          className="flex w-72 shrink-0 flex-col gap-2"
        >
          <div className="text-sm font-medium">{round.title}</div>
          {round.matches.length === 0 ? (
            <div className="rounded-md border px-3 py-4 text-center text-xs text-muted-foreground">
              Нет матчей
            </div>
          ) : (
            round.matches.map((m) => {
              const finished = m.status === 'FINISHED';
              const aWin = finished && m.winnerTeamId === m.teamA.id;
              const bWin = finished && m.winnerTeamId === m.teamB.id;
              return (
                <div
                  key={m.id}
                  className="space-y-1 rounded-md border bg-card p-3 text-sm shadow-sm"
                >
                  <div
                    className={`flex justify-between ${aWin ? 'font-semibold text-green-700' : ''}`}
                  >
                    <span className="truncate">
                      {m.teamA.name} [{m.teamA.tag}]
                    </span>
                    <span className="font-mono">{m.scoreA}</span>
                  </div>
                  <div
                    className={`flex justify-between ${bWin ? 'font-semibold text-green-700' : ''}`}
                  >
                    <span className="truncate">
                      {m.teamB.name} [{m.teamB.tag}]
                    </span>
                    <span className="font-mono">{m.scoreB}</span>
                  </div>
                  <div className="pt-1 text-xs text-muted-foreground">
                    {MATCH_STATUS_LABEL[m.status]} ·{' '}
                    {fmtDateTime(m.scheduledAt)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ))}
    </div>
  );
}
