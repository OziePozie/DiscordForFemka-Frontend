import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { MatchAdminMenu } from '@/components/MatchAdminMenu';
import { PlayerNameLink } from '@/components/PlayerNameLink';
import { TeamNameLink } from '@/components/TeamNameLink';
import { VerifiedFemaleBadge } from '@/components/VerifiedFemaleBadge';
import { GroupStageBlock } from '@/components/GroupStageBlock';
import {
  useBracket,
  useMe,
  useRegisterTournament,
  useStages,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ProblemDetailError } from '@/lib/api/client';
import { safeHttpUrl } from '@/lib/utils';
import { teamLabel } from '@/lib/format';
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

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const TOURNAMENT_TABS = [
  'overview',
  'regulations',
  'teams',
  'matches',
  'bracket',
] as const;
type TournamentTab = (typeof TOURNAMENT_TABS)[number];

export default function TournamentDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const q = useTournament(slug);

  // Активная вкладка живёт в URL (?tab=…), чтобы возврат назад со страницы матча
  // (или любой другой страницы) восстанавливал ту же вкладку, а не сбрасывал на
  // «Обзор». replace: true — переключение вкладок не плодит записи в истории.
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: TournamentTab = TOURNAMENT_TABS.includes(
    rawTab as TournamentTab,
  )
    ? (rawTab as TournamentTab)
    : 'overview';

  function handleTabChange(value: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === 'overview') {
          next.delete('tab');
        } else {
          next.set('tab', value);
        }
        return next;
      },
      { replace: true },
    );
  }

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

      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={handleTabChange}
      >
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="regulations">Регламент</TabsTrigger>
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

        <TabsContent value="regulations">
          <RegulationsTab tournament={tournament} />
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

  // All active teams the player captains, ordered deterministically so the
  // selector (and its default pick) don't depend on the DB's row order.
  const captainTeams = useMemo(
    () =>
      (me.data?.teams ?? [])
        .filter((t) => t.role === 'CAPTAIN' && t.teamStatus === 'ACTIVE')
        .sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    [me.data?.teams],
  );
  const userIsCaptainOfActive = captainTeams.length > 0;

  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  // Effective team = the explicit pick while it's still valid, otherwise the
  // first (alphabetical) captained team.
  const effectiveTeamId =
    captainTeams.find((t) => t.teamId === selectedTeamId)?.teamId ??
    captainTeams[0]?.teamId ??
    '';

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
    if (!effectiveTeamId) return;
    try {
      await register.mutateAsync({
        tournamentId: tournament.id,
        teamId: effectiveTeamId,
      });
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

  const regulationsHref = safeHttpUrl(tournament.regulationsUrl);

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
          <div className="flex items-center gap-2">
            {regulationsHref && (
              <Button variant="outline" asChild>
                <a
                  href={regulationsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Регламент
                </a>
              </Button>
            )}
            {captainTeams.length > 1 &&
              tournament.status === 'REGISTRATION_OPEN' && (
                <Select
                  value={effectiveTeamId}
                  onValueChange={setSelectedTeamId}
                  disabled={register.isPending}
                >
                  <SelectTrigger
                    className="w-[220px] rounded-pill"
                    aria-label="Команда для регистрации"
                  >
                    <SelectValue placeholder="Выберите команду" />
                  </SelectTrigger>
                  <SelectContent>
                    {captainTeams.map((t) => (
                      <SelectItem key={t.teamId} value={t.teamId}>
                        {teamLabel(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            <Button
              onClick={handleRegister}
              disabled={!canRegBtn || register.isPending}
              title={regHint || undefined}
            >
              {register.isPending ? 'Регистрируем…' : 'Зарегистрироваться'}
            </Button>
          </div>
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

function RegulationsTab({ tournament }: { tournament: TournamentDto }) {
  const url = tournament.regulationsUrl ?? null;
  const safeUrl = safeHttpUrl(url);
  const content = tournament.regulationsContent ?? null;
  const version = tournament.regulationsVersion ?? null;
  const updatedAt = tournament.regulationsUpdatedAt ?? null;
  const hasAny = !!url || !!content || !!version;

  if (!hasAny) {
    return (
      <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
        Регламент пока не опубликован.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg">Регламент турнира</CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {version && <Badge variant="outline">Версия: {version}</Badge>}
            <span>Обновлён: {fmtDate(updatedAt)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {safeUrl ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                Открыть регламент (PDF)
              </a>
            </Button>
            <a
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-xs text-muted-foreground underline"
            >
              {safeUrl}
            </a>
          </div>
        ) : (
          url && (
            <p className="break-all text-xs text-muted-foreground">{url}</p>
          )
        )}
        {content && (
          <div className="space-y-2">
            <p className="whitespace-pre-wrap">{content}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TeamsTab({ tournamentId }: { tournamentId: string }) {
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const q = useTournamentTeams(tournamentId, verifiedOnly);

  const filterToggle = (
    <div className="flex items-center justify-end">
      <Button
        size="sm"
        variant={verifiedOnly ? 'default' : 'outline'}
        onClick={() => setVerifiedOnly((v) => !v)}
        aria-pressed={verifiedOnly}
      >
        <VerifiedFemaleBadge verified className="mr-1.5" />
        Только verified
      </Button>
    </div>
  );

  if (q.isLoading)
    return (
      <div className="space-y-3">
        {filterToggle}
        <Skeleton className="h-60 w-full" />
      </div>
    );
  if (q.isError)
    return (
      <div className="space-y-3">
        {filterToggle}
        <div className="text-sm text-destructive">
          Не удалось загрузить команды: {q.error?.message ?? 'unknown error'}
        </div>
      </div>
    );

  const teams = q.data ?? [];

  return (
    <div className="space-y-3">
      {filterToggle}
      {teams.length === 0 ? (
        <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
          {verifiedOnly
            ? 'Нет команд с верифицированными игроками.'
            : 'Пока никто не зарегистрирован.'}
        </div>
      ) : (
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
                    <TeamNameLink
                      teamId={tt.team.id}
                      name={tt.team.name}
                      tag={tt.team.tag}
                      className="font-medium"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-1.5">
                      <PlayerNameLink
                        playerId={tt.team.captain.id}
                        nickname={tt.team.captain.nickname ?? 'Без ника'}
                      />
                      <VerifiedFemaleBadge
                        verified={tt.team.captain.femaleVerified}
                      />
                    </span>
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
      )}
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
  const aWin = finished && m.winnerTeamId === m.teamA?.id;
  const bWin = finished && m.winnerTeamId === m.teamB?.id;
  return (
    <Link
      to={`/matches/${m.id}`}
      className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center gap-3">
        <Badge variant="outline">{MATCH_FORMAT_LABEL[m.format]}</Badge>
        <span className={aWin ? 'font-semibold text-green-700' : ''}>
          {teamLabel(m.teamA)}
        </span>
        <span className="text-muted-foreground">vs</span>
        <span className={bWin ? 'font-semibold text-green-700' : ''}>
          {teamLabel(m.teamB)}
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
    </Link>
  );
}

function BracketTab({ tournamentId }: { tournamentId: string }) {
  const q = useBracket(tournamentId);
  const stagesQ = useStages(tournamentId);

  if (q.isLoading || stagesQ.isLoading)
    return <Skeleton className="h-60 w-full" />;
  if (q.isError)
    return (
      <div className="text-sm text-destructive">
        Не удалось загрузить сетку: {q.error?.message ?? 'unknown error'}
      </div>
    );

  // Ошибка стадий не валит вкладку — считаем, что стадий нет (старое поведение).
  const stages = stagesQ.data ?? [];
  const groupStage = stages.find((s) => s.stageType === 'GROUP');
  const playoffStage = stages.find((s) => s.stageType === 'PLAYOFF');

  const bracket = q.data;
  const hasBracket = Boolean(bracket && bracket.rounds.length > 0);

  // Турнир без стадий — старое поведение без изменений.
  if (!groupStage) {
    if (!hasBracket)
      return (
        <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
          Сетка ещё не сформирована.
        </div>
      );
    return <PlayoffBracket bracket={bracket!} />;
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-base font-semibold">Групповая стадия</h3>
        <GroupStageBlock
          tournamentId={tournamentId}
          groupConfig={groupStage.config}
        />
      </section>
      <section className="space-y-3">
        <h3 className="text-base font-semibold">Плей-офф</h3>
        {hasBracket ? (
          <PlayoffBracket bracket={bracket!} />
        ) : (
          <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
            {playoffStage?.status === 'PENDING'
              ? 'Плей-офф ещё не сгенерирован.'
              : 'Сетка ещё не сформирована.'}
          </div>
        )}
      </section>
    </div>
  );
}

function PlayoffBracket({
  bracket,
}: {
  bracket: NonNullable<ReturnType<typeof useBracket>['data']>;
}) {
  const wbRounds = bracket.rounds.filter((r) => r.section === 'WB');
  const lbRounds = bracket.rounds.filter((r) => r.section === 'LB');
  const gfRounds = bracket.rounds.filter((r) => r.section === 'GF');
  const isDoubleElim = bracket.format === 'DOUBLE_ELIM';

  if (!isDoubleElim) {
    return (
      <div className="max-h-[70vh] overflow-auto rounded-md border p-4">
        <ConnectedRounds rounds={wbRounds} />
      </div>
    );
  }

  // Вся сетка в одном прокручиваемом контейнере: верхняя и нижняя сетки сложены
  // одна над другой, а Grand Final стоит справа от их финалов — именно туда
  // приходят победители обеих веток, и к нему тянутся линии от WB- и LB-финала.
  return (
    <div className="max-h-[70vh] overflow-auto rounded-md border p-4">
      <DoubleElimBracket
        wbRounds={wbRounds}
        lbRounds={lbRounds}
        gfRounds={gfRounds}
      />
    </div>
  );
}

type BracketRound = NonNullable<
  ReturnType<typeof useBracket>['data']
>['rounds'][number];

const cellKey = (
  section: string,
  roundIndex: number,
  matchIndex: number,
): string => `${section}-${roundIndex}-${matchIndex}`;

function useRegisterCell() {
  const cellsRef = useRef(new Map<string, HTMLElement>());
  const registerCell = useCallback((key: string, el: HTMLElement | null) => {
    if (el) cellsRef.current.set(key, el);
    else cellsRef.current.delete(key);
  }, []);
  return { cellsRef, registerCell };
}

// Считает соединительные линии между ячейками сетки: от правого края
// матча-источника к левому краю матча, куда проходит его победитель.
//
// Внутри одной сетки соединяем WB→WB и LB→LB. Переход проигравшего из WB в LB
// НЕ рисуем — он пересекал бы всю сетку. Единственное исключение — Grand Final:
// в него линии идут из обеих веток (победители WB-финала и LB-финала).
function computeConnectorPaths(
  container: HTMLElement,
  cells: Map<string, HTMLElement>,
  rounds: BracketRound[],
): string[] {
  const cRect = container.getBoundingClientRect();
  const next: string[] = [];
  for (const round of rounds) {
    for (const cell of round.matches) {
      const targetEl = cells.get(
        cellKey(cell.section, cell.roundIndex, cell.matchIndex),
      );
      if (!targetEl) continue;
      for (const slot of [cell.slotA, cell.slotB]) {
        if (!slot.section) continue;
        const sameSection = slot.section === cell.section;
        // Между сетками соединяем только вход в Grand Final.
        if (!sameSection && cell.section !== 'GF') continue;
        if (slot.round == null || slot.matchIndex == null) continue;
        // `slot.round` может быть 0- или 1-индексным относительно
        // `roundIndex`; пробуем оба варианта. Внутри своей сетки источник
        // всегда в предыдущем раунде — этим и отсекаем неверный кандидат.
        let srcEl: HTMLElement | undefined;
        for (const cand of [slot.round, slot.round - 1]) {
          if (sameSection && cand >= cell.roundIndex) continue;
          srcEl = cells.get(cellKey(slot.section, cand, slot.matchIndex));
          if (srcEl) break;
        }
        if (!srcEl) continue;
        const s = srcEl.getBoundingClientRect();
        const t = targetEl.getBoundingClientRect();
        const x1 = s.right - cRect.left;
        const y1 = s.top + s.height / 2 - cRect.top;
        const x2 = t.left - cRect.left;
        const y2 = t.top + t.height / 2 - cRect.top;
        const midX = x1 + (x2 - x1) / 2;
        next.push(`M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`);
      }
    }
  }
  return next;
}

// `next` идентичен предыдущему набору путей? Нужно, чтобы не гонять setState в
// цикле (`rounds` — новый массив на каждый рендер).
const samePaths = (a: string[], b: string[]) =>
  a.length === b.length && a.every((p, i) => p === b[i]);

function useConnectorPaths(
  containerRef: React.RefObject<HTMLElement>,
  cellsRef: React.MutableRefObject<Map<string, HTMLElement>>,
  rounds: BracketRound[],
): string[] {
  const [paths, setPaths] = useState<string[]>([]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const compute = () => {
      const next = computeConnectorPaths(container, cellsRef.current, rounds);
      setPaths((prev) => (samePaths(prev, next) ? prev : next));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(container);
    window.addEventListener('resize', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, [containerRef, cellsRef, rounds]);

  return paths;
}

function ConnectorOverlay({ paths }: { paths: string[] }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full text-muted-foreground/50"
      aria-hidden
    >
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={2} />
      ))}
    </svg>
  );
}

// Single-elim (или любая одиночная сетка): одна лента раундов со связями.
function ConnectedRounds({ rounds }: { rounds: BracketRound[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { cellsRef, registerCell } = useRegisterCell();
  const paths = useConnectorPaths(containerRef, cellsRef, rounds);

  return (
    <div ref={containerRef} className="relative w-max min-w-full">
      <ConnectorOverlay paths={paths} />
      <RoundColumns rounds={rounds} registerCell={registerCell} />
    </div>
  );
}

const finalCellKey = (rounds: BracketRound[]): string | null => {
  for (let i = rounds.length - 1; i >= 0; i--) {
    const last = rounds[i].matches[rounds[i].matches.length - 1];
    if (last) return cellKey(last.section, last.roundIndex, last.matchIndex);
  }
  return null;
};

// Double-elim: WB сверху, LB снизу; обе ленты прижаты вправо, поэтому WB-финал и
// LB-финал стоят в одной колонке. Grand Final — правее их, и его сдвигаем ровно
// на середину между двумя финалами, чтобы линии к нему были симметричны.
function DoubleElimBracket({
  wbRounds,
  lbRounds,
  gfRounds,
}: {
  wbRounds: BracketRound[];
  lbRounds: BracketRound[];
  gfRounds: BracketRound[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { cellsRef, registerCell } = useRegisterCell();
  const [paths, setPaths] = useState<string[]>([]);
  // Вертикальный сдвиг ячейки Grand Final, чтобы она встала по центру между
  // WB- и LB-финалом (высоты веток разные, поэтому центр контейнера не подходит).
  const [gfShift, setGfShift] = useState(0);

  const allRounds = [...wbRounds, ...lbRounds, ...gfRounds];
  const wbFinalKey = finalCellKey(wbRounds);
  const lbFinalKey = finalCellKey(lbRounds);
  const gfCellKey = finalCellKey(gfRounds);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const cyOf = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2;
    };
    const recompute = () => {
      const cells = cellsRef.current;
      const wbEl = wbFinalKey ? cells.get(wbFinalKey) : null;
      const lbEl = lbFinalKey ? cells.get(lbFinalKey) : null;
      const gfEl = gfCellKey ? cells.get(gfCellKey) : null;
      if (wbEl && lbEl && gfEl) {
        const delta = (cyOf(wbEl) + cyOf(lbEl)) / 2 - cyOf(gfEl);
        if (Math.abs(delta) > 0.5) {
          // Двигаем GF и ждём перерисовки — линии посчитаем на осевшей позиции.
          setGfShift((prev) => prev + delta);
          return;
        }
      }
      const next = computeConnectorPaths(container, cells, allRounds);
      setPaths((prev) => (samePaths(prev, next) ? prev : next));
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(container);
    window.addEventListener('resize', recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recompute);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRounds, gfShift, wbFinalKey, lbFinalKey, gfCellKey]);

  const heading = 'text-sm font-semibold uppercase text-muted-foreground';

  return (
    <div ref={containerRef} className="relative w-max min-w-full pb-2">
      <ConnectorOverlay paths={paths} />
      <div className="flex items-stretch gap-10">
        <div className="flex flex-col gap-6">
          <section>
            <h3 className={`mb-2 ${heading}`}>Верхняя сетка</h3>
            <RoundColumns rounds={wbRounds} registerCell={registerCell} alignEnd />
          </section>
          {lbRounds.length > 0 && (
            <section>
              <h3 className={`mb-2 ${heading}`}>Нижняя сетка</h3>
              <RoundColumns rounds={lbRounds} registerCell={registerCell} alignEnd />
            </section>
          )}
        </div>
        {gfRounds.length > 0 && (
          <section
            className="flex shrink-0 flex-col justify-center"
            style={{ transform: `translateY(${gfShift}px)` }}
          >
            <h3 className={`mb-2 text-center ${heading}`}>Grand Final</h3>
            <RoundColumns rounds={gfRounds} registerCell={registerCell} />
          </section>
        )}
      </div>
    </div>
  );
}

function RoundColumns({
  rounds,
  registerCell,
  alignEnd,
}: {
  rounds: BracketRound[];
  registerCell?: (key: string, el: HTMLElement | null) => void;
  // Прижать раунды к правому краю: так финалы WB и LB встают в одну колонку,
  // даже если у веток разное число раундов.
  alignEnd?: boolean;
}) {
  const me = useMe();
  const isStaff =
    me.data?.roles?.some((r) => r === 'ADMIN' || r === 'MODERATOR') ?? false;
  return (
    <div className={`flex gap-4 ${alignEnd ? 'justify-end' : ''}`}>
      {rounds.map((round) => (
        <div
          key={`${round.section}-${round.roundIndex}`}
          className="flex w-72 shrink-0 flex-col gap-2"
        >
          <div className="text-sm font-medium">{round.title}</div>
          {/* justify-around раздвигает матчи по высоте так, чтобы матч
              следующего раунда вставал по центру между своими источниками —
              тогда соединительные линии образуют аккуратное «дерево». */}
          <div className="flex flex-1 flex-col justify-around gap-2">
            {round.matches.length === 0 ? (
              <div className="rounded-md border px-3 py-4 text-center text-xs text-muted-foreground">
                Нет матчей
              </div>
            ) : (
              round.matches.map((cell) => {
              // A cell is either a real materialized match (cell.match) or a
              // placeholder. A slot shows its team when known, otherwise the
              // source label ("Winner of WB R1 M2", "BYE", ...).
              const m = cell.match;
              const teamA = m?.teamA ?? cell.slotA.team ?? null;
              const teamB = m?.teamB ?? cell.slotB.team ?? null;
              const aWin =
                m != null && m.status === 'FINISHED' && m.winnerTeamId === m.teamA?.id;
              const bWin =
                m != null && m.status === 'FINISHED' && m.winnerTeamId === m.teamB?.id;
              const isLive = m?.status === 'LIVE';
              const key = `${cell.section}-${cell.roundIndex}-${cell.matchIndex}`;
              // Materialized cells (cell.match) link to the match page; live ones
              // get a red pulsing marker + ring so they stand out in the bracket.
              const cardClass = `relative block space-y-1 rounded-md border bg-card p-3 text-sm shadow-sm ${isLive ? 'border-red-500/60 ring-1 ring-red-500/40' : ''}`;
              const cardBody = (
                <>
                  {isStaff && cell.match ? (
                    // Keep the admin dropdown's clicks from triggering the card link.
                    <div
                      className="absolute bottom-1 right-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MatchAdminMenu match={cell.match} />
                    </div>
                  ) : null}
                  <div
                    className={`flex justify-between ${aWin ? 'font-semibold text-green-700' : ''} ${teamA ? '' : 'text-muted-foreground'}`}
                  >
                    <span className="truncate">
                      {teamA ? teamLabel(teamA) : cell.slotA.label}
                    </span>
                    {m ? <span className="font-mono">{m.scoreA}</span> : null}
                  </div>
                  <div
                    className={`flex justify-between ${bWin ? 'font-semibold text-green-700' : ''} ${teamB ? '' : 'text-muted-foreground'}`}
                  >
                    <span className="truncate">
                      {teamB ? teamLabel(teamB) : cell.slotB.label}
                    </span>
                    {m ? <span className="font-mono">{m.scoreB}</span> : null}
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 pr-7 text-xs text-muted-foreground">
                    {m ? (
                      <>
                        {isLive ? (
                          <span
                            className="relative flex h-2 w-2 shrink-0"
                            aria-hidden
                          >
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                          </span>
                        ) : null}
                        <span
                          className={`truncate ${isLive ? 'font-medium text-red-600' : ''}`}
                        >
                          {MATCH_STATUS_LABEL[m.status]} · {fmtDateTime(m.scheduledAt)}
                        </span>
                      </>
                    ) : (
                      '—'
                    )}
                  </div>
                </>
              );
              return m ? (
                <Link
                  key={key}
                  ref={(el) => registerCell?.(key, el)}
                  to={`/matches/${m.id}`}
                  className={`${cardClass} transition-colors hover:bg-muted/50`}
                >
                  {cardBody}
                </Link>
              ) : (
                <div
                  key={key}
                  ref={(el) => registerCell?.(key, el)}
                  className={cardClass}
                >
                  {cardBody}
                </div>
              );
            })
          )}
          </div>
        </div>
      ))}
    </div>
  );
}
