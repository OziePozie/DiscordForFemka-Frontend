import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  useRecreateLobby,
  useUpdateAdminMatch,
} from '@/lib/queries';
import {
  getSeasonsPage,
  getSeasonBySlug,
  getTournamentMatchesPage,
} from '@/lib/api/endpoints';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ProblemDetailError } from '@/lib/api/client';
import {
  GAME_MODES,
  GAME_MODE_LABEL,
  MATCH_FORMAT_LABEL,
  MATCH_STATUS_LABEL,
  REGIONS,
  REGION_LABEL,
  type GameMode,
  type MatchDto,
  type MatchStatus,
  type Region,
  type SeasonDto,
  type TournamentDto,
} from '@/lib/api/types';

const PAGE_SIZE = 25;
const NONE = '__none__';

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

type DialogState =
  | { kind: 'settings'; match: MatchDto }
  | { kind: 'recreate'; match: MatchDto }
  | { kind: 'reset-ready'; match: MatchDto }
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

export default function AdminMatchesPage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Seasons → tournaments selectors (mirrors AdminTournamentsPage).
  const seasonsQ = useQuery({
    queryKey: ['admin-matches-seasons'],
    queryFn: () => getSeasonsPage({ size: 50 }),
    staleTime: 60_000,
  });
  const seasons: SeasonDto[] = seasonsQ.data?.items ?? [];

  const [seasonSlug, setSeasonSlug] = useState<string>('');
  const [tournamentId, setTournamentId] = useState<string>('');

  useEffect(() => {
    if (!seasonSlug && seasons.length > 0) {
      setSeasonSlug(seasons[0].slug);
    }
  }, [seasons, seasonSlug]);

  const seasonDetailsQ = useQuery({
    queryKey: ['admin-matches-season-details', seasonSlug],
    queryFn: () => getSeasonBySlug(seasonSlug),
    enabled: !!seasonSlug,
  });

  const tournaments: TournamentDto[] = seasonDetailsQ.data?.tournaments ?? [];

  useEffect(() => {
    setTournamentId('');
  }, [seasonSlug]);

  const [page, setPage] = useState(0);
  useEffect(() => {
    setPage(0);
  }, [tournamentId]);

  const matchesQ = useQuery({
    queryKey: ['admin-tournament-matches', tournamentId, page],
    queryFn: () =>
      getTournamentMatchesPage(tournamentId, { page, size: PAGE_SIZE }),
    enabled: !!tournamentId,
  });

  const matches: MatchDto[] = matchesQ.data?.items ?? [];
  const totalPages = matchesQ.data?.totalPages ?? 1;

  // Mutations.
  const updateMut = useUpdateAdminMatch();
  const recreateMut = useRecreateLobby();
  const mutating = updateMut.isPending || recreateMut.isPending;

  // Dialog state.
  const [dialog, setDialog] = useState<DialogState>(null);
  const [form, setForm] = useState<SettingsForm>({
    gameMode: NONE,
    region: NONE,
    coinToss: true,
    autoLaunch: false,
  });

  function openSettings(m: MatchDto) {
    setForm(settingsFromMatch(m));
    setDialog({ kind: 'settings', match: m });
  }

  function closeDialog() {
    setDialog(null);
  }

  async function handleSaveSettings() {
    if (!dialog || dialog.kind !== 'settings') return;
    try {
      await updateMut.mutateAsync({
        id: dialog.match.id,
        patch: {
          gameMode: form.gameMode === NONE ? null : (form.gameMode as GameMode),
          region: form.region === NONE ? null : (form.region as Region),
          coinToss: form.coinToss,
          autoLaunch: form.autoLaunch,
        },
      });
      toast({ title: 'Настройки лобби обновлены' });
      // Refresh current matches list.
      await matchesQ.refetch();
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
      await recreateMut.mutateAsync(dialog.match.id);
      toast({ title: 'Лобби пересоздано' });
      await matchesQ.refetch();
      closeDialog();
    } catch (e) {
      toast({
        title: 'Не удалось пересоздать лобби',
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
        id: dialog.match.id,
        patch: { teamAReadyAt: null, teamBReadyAt: null },
      });
      toast({ title: 'Готовность сброшена' });
      await matchesQ.refetch();
      closeDialog();
    } catch (e) {
      toast({
        title: 'Не удалось сбросить готовность',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Матчи</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor="season-filter" className="text-sm">
          Сцена:
        </Label>
        <Select
          value={seasonSlug || undefined}
          onValueChange={(v) => setSeasonSlug(v)}
        >
          <SelectTrigger id="season-filter" className="w-56">
            <SelectValue placeholder="Выберите сцену" />
          </SelectTrigger>
          <SelectContent>
            {seasons.map((s) => (
              <SelectItem key={s.id} value={s.slug}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Label htmlFor="tournament-filter" className="text-sm">
          Турнир:
        </Label>
        <Select
          value={tournamentId || undefined}
          onValueChange={(v) => setTournamentId(v)}
          disabled={tournaments.length === 0}
        >
          <SelectTrigger id="tournament-filter" className="w-72">
            <SelectValue placeholder="Выберите турнир" />
          </SelectTrigger>
          <SelectContent>
            {tournaments.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(seasonsQ.isLoading || seasonDetailsQ.isLoading) && (
        <Skeleton className="h-40 w-full" />
      )}

      {seasonsQ.data && seasons.length === 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          Нет сцен.
        </div>
      )}

      {seasonDetailsQ.data && tournaments.length === 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          На этой сцене нет турниров.
        </div>
      )}

      {!tournamentId && tournaments.length > 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          Выберите турнир, чтобы увидеть его матчи.
        </div>
      )}

      {matchesQ.isLoading && tournamentId && (
        <Skeleton className="h-60 w-full" />
      )}

      {matchesQ.isError && (
        <div className="text-sm text-destructive">
          Не удалось загрузить матчи:{' '}
          {matchesQ.error?.message ?? 'unknown error'}
        </div>
      )}

      {tournamentId && matchesQ.data && matches.length === 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          У этого турнира пока нет матчей.
        </div>
      )}

      {matches.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Команда A</th>
                <th className="px-4 py-2 font-medium">Команда B</th>
                <th className="px-4 py-2 font-medium">Статус</th>
                <th className="px-4 py-2 font-medium">Формат</th>
                <th className="px-4 py-2 font-medium">Готовность</th>
                <th className="px-4 py-2 font-medium">Лобби</th>
                <th className="px-4 py-2 font-medium">Время</th>
                <th className="px-4 py-2 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => {
                const finished =
                  m.status === 'FINISHED' || m.status === 'CANCELLED';
                const aReady = !!m.teamAReadyAt;
                const bReady = !!m.teamBReadyAt;
                return (
                  <tr
                    key={m.id}
                    className="cursor-pointer border-t align-top hover:bg-muted/40"
                    onClick={() => navigate(`/matches/${m.id}`)}
                  >
                    <td className="px-4 py-3">
                      {m.teamA.name}{' '}
                      <span className="text-muted-foreground">
                        [{m.teamA.tag}]
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.teamB.name}{' '}
                      <span className="text-muted-foreground">
                        [{m.teamB.tag}]
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(m.status)}>
                        {MATCH_STATUS_LABEL[m.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">
                        {MATCH_FORMAT_LABEL[m.format]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <span className={aReady ? 'text-green-700' : ''}>
                        {aReady ? '✓' : '—'}
                      </span>
                      <span className="px-1 text-muted-foreground">/</span>
                      <span className={bReady ? 'text-green-700' : ''}>
                        {bReady ? '✓' : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {m.lobbyId ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {finished
                        ? fmtDateTime(m.finishedAt)
                        : fmtDateTime(m.scheduledAt)}
                    </td>
                    <td
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!finished && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={mutating}
                            >
                              Действия
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openSettings(m)}>
                              Настройки лобби
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setDialog({ kind: 'recreate', match: m })
                              }
                            >
                              Пересоздать лобби
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setDialog({ kind: 'reset-ready', match: m })
                              }
                              disabled={!aReady && !bReady}
                            >
                              Сбросить готовность
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tournamentId && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Назад
          </Button>
          <div className="text-sm text-muted-foreground">
            Страница {page + 1} из {totalPages}
          </div>
          <Button
            variant="outline"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Дальше
          </Button>
        </div>
      )}

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
              {dialog?.kind === 'settings'
                ? `${dialog.match.teamA.name} vs ${dialog.match.teamB.name}`
                : ''}
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
    </div>
  );
}
