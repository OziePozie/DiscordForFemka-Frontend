import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TeamNameLink } from '@/components/TeamNameLink';
import { Loader2 } from 'lucide-react';
import {
  useMatch,
  useMarkMatchReady,
  useMarkMatchUnready,
  useRecreateLobby,
  useMe,
} from '@/lib/queries';
import { useMatchLive, useMatchResult } from '@/lib/queries';
import { LiveStatsCard } from '@/components/match/LiveStatsCard';
import { ResultStatsCard } from '@/components/match/ResultStatsCard';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { ProblemDetailError } from '@/lib/api/client';
import {
  GAME_MODE_LABEL,
  MATCH_FORMAT_LABEL,
  MATCH_KIND_LABEL,
  MATCH_STATUS_LABEL,
  REGION_LABEL,
  currentGame,
  type GameMode,
  type MatchDto,
  type MatchStatus,
  type Region,
  type TeamPublicDto,
} from '@/lib/api/types';

function statusVariant(s: MatchStatus) {
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

function describeError(e: unknown): string {
  if (e instanceof ProblemDetailError) {
    return `${e.title}${e.detail ? `: ${e.detail}` : ''}`;
  }
  if (e instanceof Error) return e.message;
  return 'Неизвестная ошибка';
}

function TeamBlock({
  team,
  align,
  highlight,
}: {
  team: TeamPublicDto;
  align: 'left' | 'right';
  highlight: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col gap-1 ${
        align === 'right' ? 'items-end text-right' : 'items-start text-left'
      }`}
    >
      <TeamNameLink
        teamId={team.id}
        name={team.name}
        className={`truncate text-xl font-semibold ${
          highlight ? 'text-green-700' : ''
        }`}
      />
      <div className="text-sm text-muted-foreground">[{team.tag}]</div>
      {team.avgMmr != null && (
        <div className="text-xs text-muted-foreground">
          Средний MMR: {team.avgMmr}
        </div>
      )}
    </div>
  );
}

interface ReadinessSideProps {
  team: TeamPublicDto;
  align: 'left' | 'right';
  readyAt: string | null | undefined;
  isMyTeam: boolean;
  disabled: boolean;
  onReady: () => void;
  onUnready: () => void;
  pending: boolean;
}

function ReadinessSide({
  team,
  align,
  readyAt,
  isMyTeam,
  disabled,
  onReady,
  onUnready,
  pending,
}: ReadinessSideProps) {
  const isReady = !!readyAt;
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col gap-2 ${
        align === 'right' ? 'items-end text-right' : 'items-start text-left'
      }`}
    >
      <TeamNameLink
        teamId={team.id}
        name={team.name}
        tag={team.tag}
        className="truncate text-base font-semibold"
      />
      {isReady ? (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-base font-semibold text-green-700">
            <span aria-hidden>✓</span>
            <span>Готова</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {fmtDateTime(readyAt)}
          </div>
        </div>
      ) : (
        <div className="text-base font-medium text-muted-foreground">
          Ожидает подтверждения
        </div>
      )}
      {isMyTeam && (
        <Button
          size="sm"
          variant={isReady ? 'outline' : 'default'}
          disabled={disabled || pending}
          onClick={isReady ? onUnready : onReady}
        >
          {pending
            ? 'Сохранение…'
            : isReady
              ? 'Отменить готовность'
              : 'Подтвердить готовность'}
        </Button>
      )}
    </div>
  );
}

interface LobbyCardProps {
  match: MatchDto;
  isAdmin: boolean;
}

function LobbyCard({ match, isAdmin }: LobbyCardProps) {
  const { toast } = useToast();
  const recreate = useRecreateLobby();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const lobbyId = currentGame(match)?.lobbyId ?? '';
  const createdAt = currentGame(match)?.createdAt;
  const gameMode = match.gameMode as GameMode | null | undefined;
  const region = match.region as Region | null | undefined;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(lobbyId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({
        title: 'Не удалось скопировать',
        variant: 'destructive',
      });
    }
  }

  async function handleRecreate() {
    try {
      await recreate.mutateAsync(match.id);
      toast({ title: 'Лобби пересоздано' });
      setConfirmOpen(false);
    } catch (e) {
      toast({
        title: 'Не удалось пересоздать лобби',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="text-lg">Лобби Dota 2</CardTitle>
          {isAdmin && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmOpen(true)}
              disabled={recreate.isPending}
            >
              Пересоздать лобби
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            ID лобби
          </div>
          <div className="mt-1 flex items-center gap-2">
            <code className="rounded-md bg-muted px-3 py-2 font-mono text-2xl font-bold tracking-wider">
              {lobbyId}
            </code>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? 'Скопировано' : 'Копировать'}
            </Button>
          </div>
          {createdAt && (
            <div className="mt-1 text-xs text-muted-foreground">
              Создано: {fmtDateTime(createdAt)}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {gameMode && (
            <Badge variant="secondary">{GAME_MODE_LABEL[gameMode]}</Badge>
          )}
          {region && <Badge variant="outline">{REGION_LABEL[region]}</Badge>}
          <Badge variant="outline">
            Coin toss: {match.coinToss ? '✓' : '—'}
          </Badge>
          <Badge variant="outline">
            Auto-launch: {match.autoLaunch ? '✓' : '—'}
          </Badge>
        </div>

        {match.tournamentId && (
          <div className="text-sm text-muted-foreground">
            Турнир:{' '}
            {match.tournamentSlug ? (
              <Link
                to={`/tournaments/${match.tournamentSlug}`}
                className="text-foreground hover:underline"
              >
                {match.tournamentSlug}
              </Link>
            ) : (
              <span className="font-mono text-foreground">
                {match.tournamentId}
              </span>
            )}
          </div>
        )}

        <div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          В клиенте Dota 2 → Custom Lobbies → найди ID или жди приглашения.
        </div>
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Пересоздать лобби?</DialogTitle>
            <DialogDescription>
              Текущий ID будет недействителен, бот создаст новое лобби.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleRecreate}
              disabled={recreate.isPending}
            >
              {recreate.isPending ? 'Пересоздание…' : 'Пересоздать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

interface LobbyPendingCardProps {
  match: MatchDto;
  isAdmin: boolean;
}

function LobbyPendingCard({ match, isAdmin }: LobbyPendingCardProps) {
  const { toast } = useToast();
  const recreate = useRecreateLobby();
  const startedAt = match.lobbyCreateStartedAt
    ? new Date(match.lobbyCreateStartedAt).getTime()
    : null;
  const deadline = startedAt != null ? startedAt + 5 * 60 * 1000 : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const remainingMs = deadline != null ? deadline - now : 0;
  let timerLabel = 'Завершение…';
  if (deadline != null && remainingMs > 0) {
    const totalSec = Math.floor(remainingMs / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    timerLabel = `Истекает через ${m}:${s.toString().padStart(2, '0')}`;
  }

  const attempts = match.lobbyCreateAttempts ?? 0;

  async function handleRetry() {
    try {
      await recreate.mutateAsync(match.id);
      toast({ title: 'Запрошен повтор создания лобби' });
    } catch (e) {
      toast({
        title: 'Не удалось запросить повтор',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2
            className="h-10 w-10 animate-spin text-muted-foreground"
            aria-hidden
          />
          <div className="text-2xl font-semibold">Создаётся лобби…</div>
          {attempts > 0 && (
            <div className="text-sm text-muted-foreground">
              Попытка {attempts} из ~10
            </div>
          )}
          <div className="text-sm text-muted-foreground">{timerLabel}</div>
          {isAdmin && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              disabled={recreate.isPending}
              className="mt-2"
            >
              {recreate.isPending ? 'Запрос…' : 'Запросить повтор'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface LobbyFailedBannerProps {
  match: MatchDto;
}

function LobbyFailedBanner({ match }: LobbyFailedBannerProps) {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-lg text-destructive">
          Не удалось создать лобби
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>{match.lobbyCreateFailedReason ?? 'Неизвестная ошибка'}</p>
        <p className="text-muted-foreground">
          Готовность обеих команд сброшена. Подтвердите снова, чтобы попробовать
          ещё раз.
        </p>
      </CardContent>
    </Card>
  );
}

interface GameResultCardProps {
  matchId: string;
  match: MatchDto;
  gameNumber: number;
  meId?: string;
}

function GameResultCard({
  matchId,
  match,
  gameNumber,
  meId,
}: GameResultCardProps) {
  const q = useMatchResult(matchId, true, gameNumber);
  if (q.isLoading) return <Skeleton className="h-60 w-full" />;
  if (q.isError || !q.data) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Результат этой игры недоступен.
        </CardContent>
      </Card>
    );
  }
  return <ResultStatsCard match={match} result={q.data} meId={meId} />;
}

export default function MatchDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const me = useMe();
  const { toast } = useToast();
  const [pollMs, setPollMs] = useState<number | undefined>(undefined);
  // Poll every 5s while we're waiting for the bot to create a lobby. Polling
  // auto-stops once a new state arrives (lobbyId set or failure recorded).
  const q = useMatch(id, pollMs);
  const markReady = useMarkMatchReady();
  const markUnready = useMarkMatchUnready();

  const cur = q.data;
  const isLobbyPending =
    !!cur &&
    !currentGame(cur)?.lobbyId &&
    !!cur.lobbyCreateStartedAt &&
    !cur.lobbyCreateFailedAt &&
    cur.status === 'SCHEDULED';
  const isLive = !!cur && cur.status === 'LIVE';
  useEffect(() => {
    // Poll while waiting for the bot OR while the match is live — catches the
    // LIVE → FINISHED transition triggered by the auto-finish scheduler.
    setPollMs(isLobbyPending || isLive ? 5000 : undefined);
  }, [isLobbyPending, isLive]);

  const live = useMatchLive(
    id,
    q.data?.status === 'LIVE' && !!currentGame(q.data)?.lobbyId,
  );
  const result = useMatchResult(id, q.data?.status === 'FINISHED');
  const meId = me.data?.profile.id;

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="text-sm text-destructive">
        Не удалось загрузить матч: {q.error?.message ?? 'unknown error'}
      </div>
    );
  }

  const m = q.data;

  if (!m.teamA || !m.teamB) {
    // Bracket shell: this match's slot(s) aren't filled yet — it's awaiting an
    // upstream result, or that result was just cancelled. Nothing team-specific
    // to render until the bracket propagates teams in.
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant(m.status)}>
            {MATCH_STATUS_LABEL[m.status]}
          </Badge>
          <Badge variant="outline">{MATCH_FORMAT_LABEL[m.format]}</Badge>
          <Badge variant="secondary">{MATCH_KIND_LABEL[m.kind]}</Badge>
        </div>
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Команды ещё не определены — матч ожидает результатов предыдущего
            раунда.
          </CardContent>
        </Card>
      </div>
    );
  }

  const finished = m.status === 'FINISHED';
  const aWin = finished && m.winnerTeamId === m.teamA.id;
  const bWin = finished && m.winnerTeamId === m.teamB.id;

  const isAdmin = !!session?.roles?.includes('ADMIN');
  const captainOfA = !!me.data?.teams?.some(
    (t) => t.role === 'CAPTAIN' && t.teamId === m.teamA?.id,
  );
  const captainOfB = !!me.data?.teams?.some(
    (t) => t.role === 'CAPTAIN' && t.teamId === m.teamB?.id,
  );

  const curGameOfM = currentGame(m);
  const canToggleReady =
    m.status === 'SCHEDULED' &&
    !curGameOfM?.lobbyId &&
    (captainOfA || captainOfB);

  async function handleToggle(side: 'A' | 'B') {
    if (!m) return;
    const readyAt = side === 'A' ? m.teamAReadyAt : m.teamBReadyAt;
    try {
      if (readyAt) {
        await markUnready.mutateAsync(m.id);
        toast({ title: 'Готовность отменена' });
      } else {
        await markReady.mutateAsync(m.id);
        toast({ title: 'Готовность подтверждена' });
      }
    } catch (e) {
      toast({
        title: 'Ошибка',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  const showLobby = !!curGameOfM?.lobbyId;
  const showPending =
    m.status === 'SCHEDULED' &&
    !curGameOfM?.lobbyId &&
    !!m.lobbyCreateStartedAt &&
    !m.lobbyCreateFailedAt;
  const showFailed =
    m.status === 'SCHEDULED' && !curGameOfM?.lobbyId && !!m.lobbyCreateFailedAt;
  // Hide readiness card while the «creating lobby…» card is showing — captains
  // can't toggle ready during that window anyway, and the buttons are
  // visually replaced by the pending card.
  const showReadiness =
    m.status === 'SCHEDULED' && !curGameOfM?.lobbyId && !showPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={statusVariant(m.status)}>
          {MATCH_STATUS_LABEL[m.status]}
        </Badge>
        <Badge variant="outline">{MATCH_FORMAT_LABEL[m.format]}</Badge>
        <Badge variant="secondary">{MATCH_KIND_LABEL[m.kind]}</Badge>
        {m.tournamentId && (
          m.tournamentSlug ? (
            <Link to={`/tournaments/${m.tournamentSlug}`}>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                title={m.tournamentId}
              >
                Турнир
              </Badge>
            </Link>
          ) : (
            <Badge variant="outline" title={m.tournamentId}>
              Турнир
            </Badge>
          )
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <TeamBlock team={m.teamA} align="left" highlight={aWin} />
            <div className="flex flex-col items-center gap-1">
              <div className="font-mono text-4xl font-bold tracking-tight">
                <span className={aWin ? 'text-green-700' : ''}>
                  {m.scoreA}
                </span>
                <span className="px-2 text-muted-foreground">:</span>
                <span className={bWin ? 'text-green-700' : ''}>
                  {m.scoreB}
                </span>
              </div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {MATCH_FORMAT_LABEL[m.format]}
              </div>
            </div>
            <TeamBlock team={m.teamB} align="right" highlight={bWin} />
          </div>
        </CardContent>
      </Card>

      {(() => {
        const isSeries = m.format === 'BO3' || m.format === 'BO5';
        const games = m.games ?? [];

        if (!isSeries || games.length === 0) {
          // BO1 (и вырожденный случай без каток) — прежнее поведение.
          return (
            <>
              {m.status === 'LIVE' && curGameOfM?.lobbyId && (
                <LiveStatsCard match={m} snapshot={live.data} meId={meId} />
              )}
              {m.status === 'FINISHED' && result.data && (
                <ResultStatsCard match={m} result={result.data} meId={meId} />
              )}
            </>
          );
        }

        const defaultTab = String(
          curGameOfM?.gameNumber ?? games[games.length - 1].gameNumber,
        );

        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Счёт серии:</span>
              <span className="font-semibold tabular-nums">
                {m.scoreA} : {m.scoreB}
              </span>
            </div>
            <Tabs defaultValue={defaultTab}>
              <TabsList>
                {games.map((g) => (
                  <TabsTrigger key={g.gameNumber} value={String(g.gameNumber)}>
                    Игра {g.gameNumber}
                  </TabsTrigger>
                ))}
              </TabsList>
              {games.map((g) => (
                <TabsContent key={g.gameNumber} value={String(g.gameNumber)}>
                  {g.status === 'LIVE' ? (
                    <LiveStatsCard match={m} snapshot={live.data} meId={meId} />
                  ) : g.status === 'FINISHED' ? (
                    <GameResultCard
                      matchId={m.id}
                      match={m}
                      gameNumber={g.gameNumber}
                      meId={meId}
                    />
                  ) : (
                    <Card>
                      <CardContent className="pt-6 text-sm text-muted-foreground">
                        Игра ещё не началась.
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        );
      })()}

      {showPending && <LobbyPendingCard match={m} isAdmin={isAdmin} />}

      {showFailed && <LobbyFailedBanner match={m} />}

      {showReadiness && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Готовность команд</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-stretch gap-6 sm:flex-nowrap">
              <ReadinessSide
                team={m.teamA}
                align="left"
                readyAt={m.teamAReadyAt}
                isMyTeam={canToggleReady && captainOfA}
                disabled={!canToggleReady}
                onReady={() => handleToggle('A')}
                onUnready={() => handleToggle('A')}
                pending={
                  (markReady.isPending || markUnready.isPending) && captainOfA
                }
              />
              <div className="hidden self-stretch border-l sm:block" />
              <ReadinessSide
                team={m.teamB}
                align="right"
                readyAt={m.teamBReadyAt}
                isMyTeam={canToggleReady && captainOfB}
                disabled={!canToggleReady}
                onReady={() => handleToggle('B')}
                onUnready={() => handleToggle('B')}
                pending={
                  (markReady.isPending || markUnready.isPending) && captainOfB
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {showLobby && <LobbyCard match={m} isAdmin={isAdmin} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Детали</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <div className="text-muted-foreground">Запланирован</div>
            <div>{fmtDateTime(m.scheduledAt)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Завершён</div>
            <div>{fmtDateTime(m.finishedAt)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Тип</div>
            <div>{MATCH_KIND_LABEL[m.kind]}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Формат</div>
            <div>{MATCH_FORMAT_LABEL[m.format]}</div>
          </div>
        </CardContent>
      </Card>

      {m.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Заметки</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{m.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
