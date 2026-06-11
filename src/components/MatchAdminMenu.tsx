import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCancelMatchResult,
  useChangeMatchFormat,
  useFinishMatch,
  useLaunchLobby,
  useMoveMatchTeams,
  useRecreateLobby,
  useRepropagateMatch,
  useTechResultMatch,
  useTournamentTeams,
  useUpdateAdminMatch,
  useMe,
} from '@/lib/queries';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ProblemDetailError } from '@/lib/api/client';
import { teamLabel, teamName } from '@/lib/format';
import {
  GAME_MODES,
  GAME_MODE_LABEL,
  MATCH_FORMAT_LABEL,
  MATCH_FORMATS,
  MATCH_RESULT_TYPE_LABEL,
  REGIONS,
  REGION_LABEL,
  type GameMode,
  type MatchDto,
  type MatchFormat,
  type Region,
} from '@/lib/api/types';

// ─── Local helpers ────────────────────────────────────────────────────────────

const NONE = '__none__';

function describeError(e: unknown): string {
  if (e instanceof ProblemDetailError) {
    return `${e.title}${e.detail ? `: ${e.detail}` : ''}`;
  }
  if (e instanceof Error) return e.message;
  return 'Неизвестная ошибка';
}

// ─── Types / forms ────────────────────────────────────────────────────────────

type DialogState =
  | { kind: 'settings' }
  | { kind: 'recreate' }
  | { kind: 'launch' }
  | { kind: 'reset-ready' }
  | { kind: 'finish' }
  | { kind: 'repropagate' }
  | { kind: 'tech' }
  | { kind: 'cancel' }
  | { kind: 'move' }
  | { kind: 'format' }
  | null;

type SettingsForm = {
  gameMode: string; // GameMode | NONE
  region: string; // Region | NONE
  coinToss: boolean;
  autoLaunch: boolean;
};

function settingsFromMatch(m: MatchDto): SettingsForm {
  return {
    gameMode: m.gameMode ?? NONE,
    region: m.region ?? NONE,
    coinToss: m.coinToss ?? true,
    autoLaunch: m.autoLaunch ?? false,
  };
}

type FinishForm = { winner: 'A' | 'B'; scoreA: string; scoreB: string };

function defaultFinishForm(winner: 'A' | 'B'): FinishForm {
  return {
    winner,
    scoreA: winner === 'A' ? '1' : '0',
    scoreB: winner === 'B' ? '1' : '0',
  };
}

// Technical result: which side gets the win, framed as TECH_WIN (awarded to the
// chosen side) or TECH_LOSS (the chosen side loses by default → opponent wins).
type TechForm = { side: 'A' | 'B'; mode: 'TECH_WIN' | 'TECH_LOSS' };

// ─── Component ───────────────────────────────────────────────────────────────

export function MatchAdminMenu({ match }: { match: MatchDto }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const me = useMe();
  const roles = me.data?.roles ?? [];
  const isAdmin = roles.includes('ADMIN');

  // Mutations.
  const updateMut = useUpdateAdminMatch();
  const recreateMut = useRecreateLobby();
  const launchMut = useLaunchLobby();
  const finishMut = useFinishMatch();
  const repropagateMut = useRepropagateMatch();
  const techMut = useTechResultMatch();
  const cancelMut = useCancelMatchResult();
  const moveMut = useMoveMatchTeams();
  const formatMut = useChangeMatchFormat();
  const mutating =
    updateMut.isPending ||
    recreateMut.isPending ||
    launchMut.isPending ||
    finishMut.isPending ||
    repropagateMut.isPending ||
    techMut.isPending ||
    cancelMut.isPending ||
    moveMut.isPending ||
    formatMut.isPending;

  // Dialog state.
  const [dialog, setDialog] = useState<DialogState>(null);
  const [form, setForm] = useState<SettingsForm>({
    gameMode: NONE,
    region: NONE,
    coinToss: true,
    autoLaunch: false,
  });
  const [finishForm, setFinishForm] = useState<FinishForm>(
    defaultFinishForm('A'),
  );
  const [techForm, setTechForm] = useState<TechForm>({
    side: 'A',
    mode: 'TECH_WIN',
  });
  const [moveA, setMoveA] = useState<string>(NONE);
  const [moveB, setMoveB] = useState<string>(NONE);
  const [formatValue, setFormatValue] = useState<MatchFormat>('BO1');

  const teamsQ = useTournamentTeams(match.tournamentId ?? undefined);
  const tournamentTeams = (teamsQ.data ?? []).filter((t) => !t.withdrawn);

  // Derived state for dropdown visibility (mirrors AdminMatchesPage logic).
  const finished = match.status === 'FINISHED';
  const aReady = !!match.teamAReadyAt;
  const bReady = !!match.teamBReadyAt;
  const canRepropagate = finished && !!match.winnerTeamId;
  const canCancel = match.status === 'FINISHED';
  const showActions = !finished || canRepropagate || canCancel;

  function openSettings() {
    setForm(settingsFromMatch(match));
    setDialog({ kind: 'settings' });
  }

  function closeDialog() {
    setDialog(null);
  }

  // Refetch helper: invalidates admin-tournament-matches list used by AdminMatchesPage.
  async function refetchMatches() {
    await qc.invalidateQueries({ queryKey: ['admin-tournament-matches'] });
  }

  async function handleSaveSettings() {
    if (!dialog || dialog.kind !== 'settings') return;
    try {
      await updateMut.mutateAsync({
        id: match.id,
        patch: {
          gameMode: form.gameMode === NONE ? null : (form.gameMode as GameMode),
          region: form.region === NONE ? null : (form.region as Region),
          coinToss: form.coinToss,
          autoLaunch: form.autoLaunch,
        },
      });
      toast({ title: 'Настройки лобби обновлены' });
      await refetchMatches();
      closeDialog();
    } catch (e) {
      toast({
        title: 'Не удалось сохранить',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  async function handleRecreate() {
    if (!dialog || dialog.kind !== 'recreate') return;
    try {
      await recreateMut.mutateAsync(match.id);
      toast({ title: 'Лобби пересоздано' });
      await refetchMatches();
      closeDialog();
    } catch (e) {
      toast({
        title: 'Не удалось пересоздать лобби',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  async function handleLaunch() {
    if (!dialog || dialog.kind !== 'launch') return;
    try {
      await launchMut.mutateAsync(match.id);
      toast({ title: 'Запрос на старт отправлен в Dota' });
      await refetchMatches();
      closeDialog();
    } catch (e) {
      // For PLATFORM_LOBBY_LAUNCH_REJECTED Dota's own message (e.g.
      // "not enough players") is in ProblemDetail.detail — describeError
      // pulls it out so the admin sees the actual reason.
      toast({
        title: 'Dota отклонила запуск',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  async function handleResetReady() {
    if (!dialog || dialog.kind !== 'reset-ready') return;
    try {
      // TODO: backend UpdateMatchRequest must accept explicit nulls to clear
      // ready timestamps. If it doesn't yet, this call will be a no-op or
      // error — surface that to the admin via toast.
      await updateMut.mutateAsync({
        id: match.id,
        patch: { teamAReadyAt: null, teamBReadyAt: null },
      });
      toast({ title: 'Готовность сброшена' });
      await refetchMatches();
      closeDialog();
    } catch (e) {
      toast({
        title: 'Не удалось сбросить готовность',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  function openFinish() {
    setFinishForm(defaultFinishForm('A'));
    setDialog({ kind: 'finish' });
  }

  async function handleFinish() {
    if (!dialog || dialog.kind !== 'finish') return;
    const scoreA = Number(finishForm.scoreA);
    const scoreB = Number(finishForm.scoreB);
    if (
      !Number.isFinite(scoreA) ||
      !Number.isInteger(scoreA) ||
      scoreA < 0 ||
      !Number.isFinite(scoreB) ||
      !Number.isInteger(scoreB) ||
      scoreB < 0
    ) {
      toast({
        title: 'Некорректный счёт',
        description: 'Введите целые неотрицательные числа.',
        variant: 'destructive',
      });
      return;
    }
    const winnerTeamId =
      finishForm.winner === 'A' ? match.teamA?.id : match.teamB?.id;
    if (!winnerTeamId) return;
    try {
      await finishMut.mutateAsync({
        id: match.id,
        winnerTeamId,
        scoreA,
        scoreB,
      });
      toast({ title: 'Матч завершён' });
      await refetchMatches();
      closeDialog();
    } catch (e) {
      toast({
        title: 'Не удалось завершить матч',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  async function handleRepropagate() {
    if (!dialog || dialog.kind !== 'repropagate') return;
    try {
      await repropagateMut.mutateAsync(match.id);
      toast({ title: 'Победитель перепроброшен в сетку' });
      await refetchMatches();
      closeDialog();
    } catch (e) {
      toast({
        title: 'Не удалось перепровести победителя',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  function openTech() {
    setTechForm({ side: 'A', mode: 'TECH_WIN' });
    setDialog({ kind: 'tech' });
  }

  async function handleTech() {
    if (!dialog || dialog.kind !== 'tech') return;
    // TECH_WIN: chosen side wins. TECH_LOSS: chosen side loses → opponent wins.
    const chosenIsA = techForm.side === 'A';
    const winnerSideIsA =
      techForm.mode === 'TECH_WIN' ? chosenIsA : !chosenIsA;
    const winnerTeamId = winnerSideIsA ? match.teamA?.id : match.teamB?.id;
    if (!winnerTeamId) return;
    try {
      await techMut.mutateAsync({
        id: match.id,
        body: { winnerTeamId, resultType: techForm.mode },
      });
      toast({ title: 'Технический результат проставлен' });
      await refetchMatches();
      closeDialog();
    } catch (e) {
      toast({
        title: 'Не удалось проставить техрезультат',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  async function handleCancel() {
    if (!dialog || dialog.kind !== 'cancel') return;
    try {
      await cancelMut.mutateAsync(match.id);
      toast({ title: 'Результат матча отменён' });
      await refetchMatches();
      closeDialog();
    } catch (e) {
      toast({
        title: 'Не удалось отменить результат',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  async function handleMove() {
    if (!dialog || dialog.kind !== 'move') return;
    const teamAId = moveA === NONE ? null : moveA;
    const teamBId = moveB === NONE ? null : moveB;
    if (teamAId && teamBId && teamAId === teamBId) {
      toast({
        title: 'Нельзя поставить одну команду в оба слота',
        variant: 'destructive',
      });
      return;
    }
    try {
      await moveMut.mutateAsync({ id: match.id, body: { teamAId, teamBId } });
      toast({ title: 'Команды обновлены' });
      await refetchMatches();
      closeDialog();
    } catch (e) {
      toast({
        title: 'Не удалось обновить команды',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  function openFormat() {
    setFormatValue(match.format);
    setDialog({ kind: 'format' });
  }

  async function handleFormat() {
    if (!dialog || dialog.kind !== 'format') return;
    try {
      await formatMut.mutateAsync({
        id: match.id,
        body: { format: formatValue },
      });
      toast({ title: 'Формат серии изменён' });
      await refetchMatches();
      closeDialog();
    } catch (e) {
      toast({
        title: 'Не удалось изменить формат',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  if (!showActions) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Действия матча"
            disabled={mutating}
          >
            <span aria-hidden>⋯</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!finished && (
            <>
              <DropdownMenuItem onClick={() => openSettings()}>
                Настройки лобби
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem
                  onClick={() => setDialog({ kind: 'recreate' })}
                >
                  Пересоздать лобби
                </DropdownMenuItem>
              )}
              {isAdmin && (
                <DropdownMenuItem
                  onClick={() => setDialog({ kind: 'launch' })}
                  disabled={!match.lobbyId}
                >
                  Принудительно стартовать в Dota
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setDialog({ kind: 'reset-ready' })}
                disabled={!aReady && !bReady}
              >
                Сбросить готовность
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openFinish()}>
                Завершить матч
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openTech()}>
                Техвин / техлуз
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setMoveA(match.teamA?.id ?? NONE);
                  setMoveB(match.teamB?.id ?? NONE);
                  setDialog({ kind: 'move' });
                }}
              >
                Переставить команды
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openFormat()}>
                Изменить формат серии
              </DropdownMenuItem>
            </>
          )}
          {canCancel && (
            <DropdownMenuItem onClick={() => setDialog({ kind: 'cancel' })}>
              Отменить результат
            </DropdownMenuItem>
          )}
          {canRepropagate && (
            <DropdownMenuItem
              onClick={() => setDialog({ kind: 'repropagate' })}
            >
              Перепровести победителя в сетку
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings dialog */}
      <Dialog
        open={dialog?.kind === 'settings'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Настройки лобби</DialogTitle>
            <DialogDescription>
              {`${teamName(match.teamA)} vs ${teamName(match.teamB)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="m-gamemode">Режим игры</Label>
                <Select
                  value={form.gameMode}
                  onValueChange={(v) => setForm({ ...form, gameMode: v })}
                >
                  <SelectTrigger id="m-gamemode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— (по умолчанию)</SelectItem>
                    {GAME_MODES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {GAME_MODE_LABEL[g]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="m-region">Регион</Label>
                <Select
                  value={form.region}
                  onValueChange={(v) => setForm({ ...form, region: v })}
                >
                  <SelectTrigger id="m-region">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— (по умолчанию)</SelectItem>
                    {REGIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {REGION_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  checked={form.coinToss}
                  onChange={(e) =>
                    setForm({ ...form, coinToss: e.target.checked })
                  }
                />
                Coin toss
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  checked={form.autoLaunch}
                  onChange={(e) =>
                    setForm({ ...form, autoLaunch: e.target.checked })
                  }
                />
                Auto-launch
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              Отмена
            </Button>
            <Button onClick={handleSaveSettings} disabled={mutating}>
              {updateMut.isPending ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recreate confirm */}
      <Dialog
        open={dialog?.kind === 'recreate'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Пересоздать лобби?</DialogTitle>
            <DialogDescription>
              Текущий ID будет недействителен, бот создаст новое лобби.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleRecreate}
              disabled={mutating}
            >
              {recreateMut.isPending ? 'Пересоздание…' : 'Пересоздать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Force-launch confirm */}
      <Dialog
        open={dialog?.kind === 'launch'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Принудительно стартовать в Dota?</DialogTitle>
            <DialogDescription>
              Бот отправит запрос на старт уже созданного лобби в Dota2API.
              Учтите: Dota откажет, если в команде меньше игроков, чем требует
              выбранный режим (например, Captains Mode требует 5v5). Если
              увидите ошибку в стиле «not enough players» — это и значит, что
              слотов в Steam-лобби не хватает.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              Отмена
            </Button>
            <Button onClick={handleLaunch} disabled={mutating}>
              {launchMut.isPending ? 'Запуск…' : 'Стартовать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset readiness confirm */}
      <Dialog
        open={dialog?.kind === 'reset-ready'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сбросить готовность?</DialogTitle>
            <DialogDescription>
              Обе команды должны будут подтвердить готовность заново.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetReady}
              disabled={mutating}
            >
              {updateMut.isPending ? 'Сброс…' : 'Сбросить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finish match confirm */}
      <Dialog
        open={dialog?.kind === 'finish'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Завершить матч?</DialogTitle>
            <DialogDescription>
              {`${teamName(match.teamA)} vs ${teamName(match.teamB)}`}
            </DialogDescription>
          </DialogHeader>
          {dialog?.kind === 'finish' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Победитель</Label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="finish-winner"
                      className="h-4 w-4"
                      checked={finishForm.winner === 'A'}
                      onChange={() => setFinishForm(defaultFinishForm('A'))}
                    />
                    {teamLabel(match.teamA)}
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="finish-winner"
                      className="h-4 w-4"
                      checked={finishForm.winner === 'B'}
                      onChange={() => setFinishForm(defaultFinishForm('B'))}
                    />
                    {teamLabel(match.teamB)}
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="finish-score-a">Счёт A</Label>
                  <input
                    id="finish-score-a"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={finishForm.scoreA}
                    onChange={(e) =>
                      setFinishForm({ ...finishForm, scoreA: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="finish-score-b">Счёт B</Label>
                  <input
                    id="finish-score-b"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={finishForm.scoreB}
                    onChange={(e) =>
                      setFinishForm({ ...finishForm, scoreB: e.target.value })
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Действие необратимо. Очки начислятся победителю, следующий
                матч сетки заполнится автоматически.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleFinish}
              disabled={mutating}
            >
              {finishMut.isPending ? 'Завершение…' : 'Завершить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Re-propagate winner confirm */}
      <Dialog
        open={dialog?.kind === 'repropagate'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Перепровести победителя в сетку?</DialogTitle>
            <DialogDescription>
              {`${teamName(match.teamA)} vs ${teamName(match.teamB)}`}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Повторно протолкнёт победителя в следующий матч сетки. Безопасно —
            очки и аудит не задвоятся (событие «матч завершён» не публикуется
            повторно). Используйте, если сетка не обновилась автоматически
            после завершения матча.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              Отмена
            </Button>
            <Button onClick={handleRepropagate} disabled={mutating}>
              {repropagateMut.isPending ? 'Перепровод…' : 'Перепровести'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tech win/loss */}
      <Dialog
        open={dialog?.kind === 'tech'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Технический результат</DialogTitle>
            <DialogDescription>
              {`${teamName(match.teamA)} vs ${teamName(match.teamB)}`}
            </DialogDescription>
          </DialogHeader>
          {dialog?.kind === 'tech' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Тип</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="tech-mode"
                      className="h-4 w-4"
                      checked={techForm.mode === 'TECH_WIN'}
                      onChange={() =>
                        setTechForm({ ...techForm, mode: 'TECH_WIN' })
                      }
                    />
                    Техвин (победа выбранной)
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="tech-mode"
                      className="h-4 w-4"
                      checked={techForm.mode === 'TECH_LOSS'}
                      onChange={() =>
                        setTechForm({ ...techForm, mode: 'TECH_LOSS' })
                      }
                    />
                    Техлуз (поражение выбранной)
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Команда</Label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="tech-side"
                      className="h-4 w-4"
                      checked={techForm.side === 'A'}
                      onChange={() => setTechForm({ ...techForm, side: 'A' })}
                    />
                    {teamLabel(match.teamA)}
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="tech-side"
                      className="h-4 w-4"
                      checked={techForm.side === 'B'}
                      onChange={() => setTechForm({ ...techForm, side: 'B' })}
                    />
                    {teamLabel(match.teamB)}
                  </label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Матч завершится со счётом 1:0 в пользу победителя и пометкой{' '}
                {MATCH_RESULT_TYPE_LABEL[techForm.mode]}. Сетка обновится
                автоматически.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleTech}
              disabled={mutating}
            >
              {techMut.isPending ? 'Сохранение…' : 'Применить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel result */}
      <Dialog
        open={dialog?.kind === 'cancel'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отменить результат матча?</DialogTitle>
            <DialogDescription>
              {`${teamName(match.teamA)} vs ${teamName(match.teamB)}`}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Матч вернётся в статус «Запланирован», победитель и счёт будут
            очищены, а продвижение по сетке откатится. Если следующий матч уже
            начался или завершён — сначала отмените его.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={mutating}
            >
              {cancelMut.isPending ? 'Отмена…' : 'Отменить результат'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move / swap teams */}
      <Dialog
        open={dialog?.kind === 'move'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Переставить команды</DialogTitle>
            <DialogDescription>
              {`${teamName(match.teamA)} vs ${teamName(match.teamB)}`}
            </DialogDescription>
          </DialogHeader>
          {dialog?.kind === 'move' &&
            (() => {
              const optionMap = new Map<
                string,
                { id: string; name: string; tag: string }
              >();
              for (const t of tournamentTeams) optionMap.set(t.team.id, t.team);
              for (const slot of [match.teamA, match.teamB]) {
                if (slot?.id) optionMap.set(slot.id, slot);
              }
              const options = Array.from(optionMap.values());
              return (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Назначьте команды на слоты этого матча. Можно выбрать любую
                    команду турнира или оставить слот пустым. Готовность капитанов
                    будет сброшена.
                  </p>
                  {teamsQ.isLoading && (
                    <p className="text-sm text-muted-foreground">
                      Загрузка команд…
                    </p>
                  )}
                  <div className="space-y-1">
                    <Label>Команда A</Label>
                    <Select value={moveA} onValueChange={setMoveA}>
                      <SelectTrigger>
                        <SelectValue placeholder="Пусто (TBD)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Пусто (TBD)</SelectItem>
                        {options.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {teamLabel(t)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Команда B</Label>
                    <Select value={moveB} onValueChange={setMoveB}>
                      <SelectTrigger>
                        <SelectValue placeholder="Пусто (TBD)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Пусто (TBD)</SelectItem>
                        {options.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {teamLabel(t)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMoveA(moveB);
                      setMoveB(moveA);
                    }}
                  >
                    Поменять A ↔ B
                  </Button>
                </div>
              );
            })()}
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              Отмена
            </Button>
            <Button onClick={handleMove} disabled={mutating}>
              {moveMut.isPending ? 'Сохранение…' : 'Применить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change series format */}
      <Dialog
        open={dialog?.kind === 'format'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Формат серии</DialogTitle>
            <DialogDescription>
              {`${teamName(match.teamA)} vs ${teamName(match.teamB)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="m-format">Формат</Label>
            <Select
              value={formatValue}
              onValueChange={(v) => setFormatValue(v as MatchFormat)}
            >
              <SelectTrigger id="m-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATCH_FORMATS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {MATCH_FORMAT_LABEL[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              Отмена
            </Button>
            <Button onClick={handleFormat} disabled={mutating}>
              {formatMut.isPending ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
