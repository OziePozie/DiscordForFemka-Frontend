import { useState } from 'react';
import { PlayerNameLink } from '@/components/PlayerNameLink';
import {
  useAdminPlayers,
  useCreateAdminPlayer,
  useBanAdminPlayer,
  useUnbanAdminPlayer,
  useUpdateAdminPlayer,
  useSetAdminPlayerFemaleVerified,
} from '@/lib/queries';
import { VerifiedFemaleBadge } from '@/components/VerifiedFemaleBadge';
import { useAuth } from '@/lib/auth';
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
import { Input } from '@/components/ui/input';
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
  PLAYER_ROLES,
  PLAYER_ROLE_LABEL,
  type ActivityStatus,
  type PlayerAdminDto,
  type PlayerRole,
} from '@/lib/api/types';
import { timeAgo } from '@/lib/utils';

const PAGE_SIZE = 25;

type BannedFilter = 'ALL' | 'TRUE' | 'FALSE';
type ActivityFilter = 'ALL' | ActivityStatus;
type RoleFilter = 'ALL' | PlayerRole;

type DialogState =
  | { kind: 'create' }
  | { kind: 'ban'; player: PlayerAdminDto }
  | { kind: 'edit'; player: PlayerAdminDto }
  | null;

function describeError(e: unknown): string {
  if (e instanceof ProblemDetailError) {
    return `${e.title}${e.detail ? `: ${e.detail}` : ''}`;
  }
  if (e instanceof Error) return e.message;
  return 'Неизвестная ошибка';
}

export default function AdminPlayersPage() {
  const { toast } = useToast();
  const { session } = useAuth();
  const isAdmin = !!session?.roles?.includes('ADMIN');

  const [q, setQ] = useState('');
  const [banned, setBanned] = useState<BannedFilter>('ALL');
  const [activity, setActivity] = useState<ActivityFilter>('ALL');
  const [role, setRole] = useState<RoleFilter>('ALL');
  const [page, setPage] = useState(0);

  const query = useAdminPlayers({
    q: q.trim() || undefined,
    banned: banned === 'ALL' ? undefined : banned === 'TRUE',
    activity: activity === 'ALL' ? undefined : activity,
    role: role === 'ALL' ? undefined : role,
    page,
    size: PAGE_SIZE,
  });

  const createMut = useCreateAdminPlayer();
  const banMut = useBanAdminPlayer();
  const unbanMut = useUnbanAdminPlayer();
  const updateMut = useUpdateAdminPlayer();
  const verifyMut = useSetAdminPlayerFemaleVerified();
  const mutating =
    createMut.isPending ||
    banMut.isPending ||
    unbanMut.isPending ||
    updateMut.isPending ||
    verifyMut.isPending;

  const [dialog, setDialog] = useState<DialogState>(null);
  const [banReason, setBanReason] = useState('');
  const [editRoles, setEditRoles] = useState<PlayerRole[]>([]);
  const [editMmr, setEditMmr] = useState('');
  const [editMmrReason, setEditMmrReason] = useState('');
  const [createSteamId, setCreateSteamId] = useState('');
  const [createNickname, setCreateNickname] = useState('');
  const [createMmr, setCreateMmr] = useState('');

  function openCreate() {
    setCreateSteamId('');
    setCreateNickname('');
    setCreateMmr('');
    setDialog({ kind: 'create' });
  }

  function openBan(p: PlayerAdminDto) {
    setBanReason('');
    setDialog({ kind: 'ban', player: p });
  }

  function openEdit(p: PlayerAdminDto) {
    setEditRoles([...p.roles]);
    setEditMmr('');
    setEditMmrReason('');
    setDialog({ kind: 'edit', player: p });
  }

  function closeDialog() {
    setDialog(null);
    setBanReason('');
    setEditRoles([]);
    setEditMmr('');
    setEditMmrReason('');
    setCreateSteamId('');
    setCreateNickname('');
    setCreateMmr('');
  }

  async function handleCreate() {
    if (!dialog || dialog.kind !== 'create') return;
    const steamId = createSteamId.trim();
    const nickname = createNickname.trim();
    const mmrStr = createMmr.trim();
    if (!steamId) {
      toast({
        title: 'Нужен Steam ID',
        description: 'Укажите SteamID64 или 32-битный Dota account id',
        variant: 'destructive',
      });
      return;
    }
    if (!nickname) {
      toast({
        title: 'Нужен ник',
        description: 'Укажите отображаемый ник заглушки',
        variant: 'destructive',
      });
      return;
    }
    if (!/^\d+$/.test(mmrStr)) {
      toast({
        title: 'Невалидный MMR',
        description: 'MMR должен быть целым неотрицательным числом',
        variant: 'destructive',
      });
      return;
    }
    try {
      await createMut.mutateAsync({
        steamId,
        nickname,
        mmr: Number(mmrStr),
      });
      toast({ title: 'Заглушка создана' });
      closeDialog();
    } catch (e) {
      toast({
        title: 'Не удалось создать заглушку',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  async function handleBan() {
    if (!dialog || dialog.kind !== 'ban') return;
    if (!banReason.trim()) {
      toast({
        title: 'Нужна причина',
        description: 'Укажите причину блокировки',
        variant: 'destructive',
      });
      return;
    }
    try {
      await banMut.mutateAsync({
        id: dialog.player.profile.id,
        reason: banReason.trim(),
      });
      toast({ title: 'Игрок забанен' });
      closeDialog();
    } catch (e) {
      toast({
        title: 'Не удалось забанить',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  async function handleUnban(p: PlayerAdminDto) {
    try {
      await unbanMut.mutateAsync(p.profile.id);
      toast({ title: 'Бан снят' });
    } catch (e) {
      toast({
        title: 'Не удалось снять бан',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  async function handleToggleVerified(p: PlayerAdminDto) {
    const next = !p.profile.femaleVerified;
    try {
      await verifyMut.mutateAsync({ id: p.profile.id, verified: next });
      toast({
        title: next ? 'Статус выдан' : 'Статус снят',
      });
    } catch (e) {
      toast({
        title: 'Не удалось изменить статус',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  async function handleSaveEdit() {
    if (!dialog || dialog.kind !== 'edit') return;
    const mmrStr = editMmr.trim();
    if (mmrStr && !/^\d+$/.test(mmrStr)) {
      toast({
        title: 'Невалидный MMR',
        description: 'MMR должен быть целым неотрицательным числом',
        variant: 'destructive',
      });
      return;
    }
    if (mmrStr && !editMmrReason.trim()) {
      toast({
        title: 'Нужна причина',
        description: 'Укажите причину ручной корректировки MMR',
        variant: 'destructive',
      });
      return;
    }
    try {
      await updateMut.mutateAsync({
        id: dialog.player.profile.id,
        patch: {
          roles: editRoles,
          ...(mmrStr
            ? {
                overrideMmr: Number(mmrStr),
                overrideMmrReason: editMmrReason.trim(),
              }
            : {}),
        },
      });
      toast({ title: 'Игрок обновлён' });
      closeDialog();
    } catch (e) {
      toast({
        title: 'Не удалось сохранить',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  function toggleRole(r: PlayerRole) {
    setEditRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Игроки</h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {query.data?.totalItems ?? 0} всего
          </div>
          {isAdmin && (
            <Button size="sm" onClick={openCreate} disabled={mutating}>
              Создать заглушку
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="ap-q">Поиск</Label>
          <Input
            id="ap-q"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Ник или ID"
          />
        </div>
        <div className="space-y-1">
          <Label>Бан</Label>
          <Select
            value={banned}
            onValueChange={(v) => {
              setBanned(v as BannedFilter);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Все</SelectItem>
              <SelectItem value="TRUE">Забанены</SelectItem>
              <SelectItem value="FALSE">Без бана</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Активность</Label>
          <Select
            value={activity}
            onValueChange={(v) => {
              setActivity(v as ActivityFilter);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Все</SelectItem>
              <SelectItem value="ACTIVE">Активные</SelectItem>
              <SelectItem value="INACTIVE">Неактивные</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Роль</Label>
          <Select
            value={role}
            onValueChange={(v) => {
              setRole(v as RoleFilter);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Все</SelectItem>
              {PLAYER_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {PLAYER_ROLE_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {query.isLoading && <Skeleton className="h-80 w-full" />}

      {query.isError && (
        <div className="text-sm text-destructive">
          Не удалось загрузить игроков: {query.error?.message ?? 'unknown error'}
        </div>
      )}

      {query.data && (query.data.items?.length ?? 0) === 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          Ничего не найдено.
        </div>
      )}

      {query.data && (query.data.items?.length ?? 0) > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Ник</th>
                <th className="px-4 py-2 font-medium">MMR</th>
                <th className="px-4 py-2 font-medium">Роли</th>
                <th className="px-4 py-2 font-medium">Активность</th>
                <th className="px-4 py-2 font-medium">Бан</th>
                <th className="px-4 py-2 font-medium">Создан</th>
                <th className="px-4 py-2 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {query.data.items!.map((p) => (
                <tr key={p.profile.id} className="border-t align-top">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <PlayerNameLink
                        playerId={p.profile.id}
                        nickname={p.profile.nickname ?? 'Без ника'}
                        className="font-medium"
                      />
                      <VerifiedFemaleBadge
                        verified={p.profile.femaleVerified}
                      />
                      {p.stub ? (
                        <Badge
                          variant="outline"
                          className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400"
                          title="Профиль-заглушка: ещё не подхвачен реальным входом"
                        >
                          Заглушка
                        </Badge>
                      ) : p.claimedAt ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-400"
                          title={`Заглушка подхвачена при входе: ${new Date(p.claimedAt).toLocaleString()}`}
                        >
                          Заклеймлена
                        </Badge>
                      ) : null}
                    </span>
                    <div className="font-mono text-xs text-muted-foreground">
                      {p.steamId}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {p.mmr?.mmr ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.roles.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        p.roles.map((r) => (
                          <Badge key={r} variant="outline">
                            {PLAYER_ROLE_LABEL[r]}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.activity.status === 'ACTIVE' ? (
                      <Badge variant="default">Активен</Badge>
                    ) : (
                      <Badge variant="outline">Неактивен</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.banned ? (
                      <div className="space-y-1">
                        <Badge variant="destructive">Забанен</Badge>
                        {p.banReason && (
                          <div className="text-xs text-muted-foreground">
                            {p.banReason}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Badge variant="secondary">—</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {timeAgo(p.profile.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
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
                        {p.banned ? (
                          <DropdownMenuItem onClick={() => handleUnban(p)}>
                            Снять бан
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => openBan(p)}>
                            Бан
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleToggleVerified(p)}
                        >
                          {p.profile.femaleVerified
                            ? 'Снять верификацию'
                            : 'Выдать верификацию'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openEdit(p)}
                          disabled={!isAdmin}
                          title={
                            isAdmin
                              ? undefined
                              : 'Доступно только администраторам'
                          }
                        >
                          Изменить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {query.data && (query.data.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Назад
          </Button>
          <div className="text-sm text-muted-foreground">
            Страница {(query.data.page ?? page) + 1} из {query.data.totalPages}
          </div>
          <Button
            variant="outline"
            disabled={page + 1 >= (query.data.totalPages ?? 1)}
            onClick={() => setPage((p) => p + 1)}
          >
            Дальше
          </Button>
        </div>
      )}

      {/* Create stub dialog (ADMIN only) */}
      <Dialog
        open={dialog?.kind === 'create'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать профиль-заглушку</DialogTitle>
            <DialogDescription>
              Заглушку подхватит первый вход через Steam с этим Steam ID.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="create-steamid">Steam ID</Label>
              <Input
                id="create-steamid"
                inputMode="numeric"
                value={createSteamId}
                onChange={(e) => setCreateSteamId(e.target.value)}
                placeholder="76561198000000000"
              />
              <p className="text-xs text-muted-foreground">
                SteamID64 или 32-битный Dota account/friend id — нормализуется на
                сервере.
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-nickname">Ник</Label>
              <Input
                id="create-nickname"
                value={createNickname}
                maxLength={64}
                onChange={(e) => setCreateNickname(e.target.value)}
                placeholder="Отображаемый ник"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-mmr">MMR</Label>
              <Input
                id="create-mmr"
                type="number"
                min={0}
                value={createMmr}
                onChange={(e) => setCreateMmr(e.target.value)}
                placeholder="4200"
              />
              <p className="text-xs text-muted-foreground">
                Сохраняется как ручной подтверждённый MMR.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              Отмена
            </Button>
            <Button onClick={handleCreate} disabled={mutating}>
              {createMut.isPending ? 'Создание…' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban dialog */}
      <Dialog
        open={dialog?.kind === 'ban'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Забанить игрока</DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'ban'
                ? dialog.player.profile.nickname ?? 'Без ника'
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ban-reason">Причина (обязательно)</Label>
            <textarea
              id="ban-reason"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="min-h-[6.25rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Опишите причину блокировки"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleBan}
              disabled={mutating}
            >
              {banMut.isPending ? 'Применение…' : 'Забанить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog (ADMIN only) */}
      <Dialog
        open={dialog?.kind === 'edit'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать игрока</DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'edit'
                ? dialog.player.profile.nickname ?? 'Без ника'
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Роли</Label>
              <div className="flex flex-wrap gap-2">
                {PLAYER_ROLES.map((r) => {
                  const active = editRoles.includes(r);
                  return (
                    <Button
                      key={r}
                      type="button"
                      size="sm"
                      variant={active ? 'default' : 'outline'}
                      onClick={() => toggleRole(r)}
                    >
                      {PLAYER_ROLE_LABEL[r]}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-mmr">Override MMR (опционально)</Label>
              <Input
                id="edit-mmr"
                type="number"
                min={0}
                value={editMmr}
                onChange={(e) => setEditMmr(e.target.value)}
                placeholder="Оставьте пустым, чтобы не менять"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-mmr-reason">
                Причина override (обязательно при override)
              </Label>
              <textarea
                id="edit-mmr-reason"
                value={editMmrReason}
                onChange={(e) => setEditMmrReason(e.target.value)}
                className="min-h-[3.75rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              Отмена
            </Button>
            <Button onClick={handleSaveEdit} disabled={mutating}>
              {updateMut.isPending ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
