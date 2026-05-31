import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PlayerNameLink } from '@/components/PlayerNameLink';
import { VerifiedFemaleBadge } from '@/components/VerifiedFemaleBadge';
import {
  useCancelTeamInvite,
  useCreateTeamInvite,
  useDisbandTeam,
  useLeaveTeamMember,
  useMe,
  usePlayersSearch,
  useTeam,
  useTeamHistory,
  useTeamInvites,
  useTransferCaptaincy,
  useUpdateTeam,
  useUploadAttachment,
} from '@/lib/queries';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ProblemDetailError } from '@/lib/api/client';
import {
  INACTIVE_REASON_LABEL,
  INVITE_STATUS_LABEL,
  POSITION_LABEL,
  TEAM_MEMBER_ROLE_LABEL,
  TEAM_STATUS_LABEL,
  TOURNAMENT_STATUS_LABEL,
  type PlayerPosition,
  type TeamMemberRole,
  type TeamStatus,
  type TournamentStatus,
} from '@/lib/api/types';
import { timeAgo } from '@/lib/utils';

const TEAM_ROLES: TeamMemberRole[] = ['CAPTAIN', 'MAIN', 'SUB'];
const POSITIONS: PlayerPosition[] = ['POS_1', 'POS_2', 'POS_3', 'POS_4', 'POS_5'];

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

function statusVariant(s: TeamStatus) {
  switch (s) {
    case 'ACTIVE':
      return 'default' as const;
    case 'INACTIVE':
      return 'secondary' as const;
    case 'DISBANDED':
      return 'destructive' as const;
  }
}

export default function TeamDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const q = useTeam(id);
  const me = useMe();
  const disband = useDisbandTeam();
  const transfer = useTransferCaptaincy();
  const leaveMember = useLeaveTeamMember();
  const invites = useTeamInvites(id);
  const createInvite = useCreateTeamInvite();
  const cancelInvite = useCancelTeamInvite();
  const updateTeam = useUpdateTeam();
  const uploadAttachment = useUploadAttachment();
  const { toast } = useToast();

  const [disbandOpen, setDisbandOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [newCaptain, setNewCaptain] = useState<string>('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteSearchDebounced, setInviteSearchDebounced] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inviteInputRef = useRef<HTMLInputElement | null>(null);
  const [invitePicked, setInvitePicked] = useState<{ id: string; nickname: string } | null>(null);
  const [inviteRole, setInviteRole] = useState<TeamMemberRole>('MAIN');
  const [invitePosition, setInvitePosition] = useState<PlayerPosition | ''>('');
  const [leaveOpen, setLeaveOpen] = useState<{ playerId: string; nickname: string; self: boolean } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const editFileRef = useRef<HTMLInputElement | null>(null);

  const playersQ = usePlayersSearch({ q: inviteSearchDebounced, size: 8 });

  // Debounce 250ms — avoid firing /api/v1/players on every keystroke.
  // Clear debounced value below threshold so the query auto-disables.
  useEffect(() => {
    if (inviteSearch.length < 3) {
      setInviteSearchDebounced('');
      return;
    }
    const t = window.setTimeout(() => setInviteSearchDebounced(inviteSearch), 250);
    return () => window.clearTimeout(t);
  }, [inviteSearch]);
  const historyQ = useTeamHistory(id);

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (q.isError || !q.data) {
    return (
      <div className="text-sm text-destructive">
        Не удалось загрузить команду: {q.error?.message ?? 'unknown error'}
      </div>
    );
  }

  const team = q.data;
  const myId = me.data?.profile.id;
  const isCaptain = !!myId && team.captain.id === myId;
  const isMember = !!myId && team.members.some((m) => m.player.id === myId);
  const isMemberNonCaptain = isMember && !isCaptain;
  const initials = (team.tag ?? team.name ?? '?').slice(0, 2).toUpperCase();

  const transferCandidates = team.members.filter(
    (m) => m.player.id !== team.captain.id,
  );

  function describeError(e: unknown): string {
    if (e instanceof ProblemDetailError) {
      return `${e.title}${e.detail ? `: ${e.detail}` : ''}`;
    }
    return e instanceof Error ? e.message : 'Неизвестная ошибка';
  }

  async function handleInvite() {
    if (!id || !invitePicked) return;
    try {
      await createInvite.mutateAsync({
        teamId: id,
        body: {
          inviteePlayerId: invitePicked.id,
          proposedRole: inviteRole,
          ...(invitePosition ? { position: invitePosition } : {}),
        },
      });
      toast({ title: 'Приглашение отправлено', description: invitePicked.nickname });
      setInviteOpen(false);
      setInviteSearch('');
      setInvitePicked(null);
      setInvitePosition('');
    } catch (e) {
      toast({ title: 'Ошибка', description: describeError(e), variant: 'destructive' });
    }
  }

  async function handleCancelInvite(inviteId: string) {
    if (!id) return;
    try {
      await cancelInvite.mutateAsync({ teamId: id, inviteId });
      toast({ title: 'Приглашение отменено' });
    } catch (e) {
      toast({ title: 'Ошибка', description: describeError(e), variant: 'destructive' });
    }
  }

  async function handleLeave() {
    if (!id || !leaveOpen) return;
    try {
      await leaveMember.mutateAsync({ teamId: id, playerId: leaveOpen.playerId });
      toast({ title: leaveOpen.self ? 'Вы покинули команду' : 'Игрок удалён из команды' });
      setLeaveOpen(null);
      if (leaveOpen.self) navigate('/teams');
    } catch (e) {
      toast({ title: 'Ошибка', description: describeError(e), variant: 'destructive' });
    }
  }

  async function handleDisband() {
    if (!id) return;
    try {
      await disband.mutateAsync(id);
      toast({ title: 'Команда расформирована' });
      setDisbandOpen(false);
      navigate('/teams');
    } catch (e) {
      const msg =
        e instanceof ProblemDetailError
          ? `${e.title}${e.detail ? `: ${e.detail}` : ''}`
          : e instanceof Error
            ? e.message
            : 'Неизвестная ошибка';
      toast({
        title: 'Ошибка',
        description: msg,
        variant: 'destructive',
      });
    }
  }

  async function handleTransfer() {
    if (!id || !newCaptain) return;
    try {
      await transfer.mutateAsync({ teamId: id, newCaptainPlayerId: newCaptain });
      toast({ title: 'Капитанство передано' });
      setTransferOpen(false);
      setNewCaptain('');
    } catch (e) {
      const msg =
        e instanceof ProblemDetailError
          ? `${e.title}${e.detail ? `: ${e.detail}` : ''}`
          : e instanceof Error
            ? e.message
            : 'Неизвестная ошибка';
      toast({
        title: 'Ошибка',
        description: msg,
        variant: 'destructive',
      });
    }
  }

  function openEdit() {
    if (!q.data) return;
    setEditName(q.data.name);
    setEditLogoFile(null);
    setEditOpen(true);
  }

  function handleEditLogoPick(ev: ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0] ?? null;
    setEditLogoFile(f);
  }

  async function handleEditSave() {
    if (!id || !q.data) return;
    const trimmed = editName.trim();
    if (!trimmed) return;

    const body: { name?: string; logoAttachmentId?: string } = {};
    if (trimmed !== q.data.name) body.name = trimmed;

    try {
      if (editLogoFile) {
        const att = await uploadAttachment.mutateAsync({
          file: editLogoFile,
          kind: 'TEAM_LOGO',
        });
        body.logoAttachmentId = att.id;
      }
      if (Object.keys(body).length === 0) {
        setEditOpen(false);
        return;
      }
      await updateTeam.mutateAsync({ id, body });
      toast({ title: 'Команда обновлена' });
      setEditOpen(false);
      setEditLogoFile(null);
    } catch (e) {
      toast({
        title: 'Ошибка',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {team.logoUrl && <AvatarImage src={team.logoUrl} alt="" />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">
                  {team.name}{' '}
                  <span className="text-lg text-muted-foreground">
                    [{team.tag}]
                  </span>
                </CardTitle>
                <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant(team.status)}>
                    {TEAM_STATUS_LABEL[team.status]}
                  </Badge>
                  <span>
                    Капитан:{' '}
                    <PlayerNameLink
                      playerId={team.captain.id}
                      nickname={team.captain.nickname ?? 'Без ника'}
                      className="text-foreground"
                    />
                  </span>
                </CardDescription>
              </div>
            </div>
            {isCaptain && team.status !== 'DISBANDED' && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setInviteOpen(true)}>
                  Пригласить игрока
                </Button>
                <Button variant="outline" onClick={openEdit}>
                  Редактировать
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setTransferOpen(true)}
                  disabled={transferCandidates.length === 0}
                  title={
                    transferCandidates.length === 0
                      ? 'В команде нет других игроков'
                      : undefined
                  }
                >
                  Передать капитанство
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDisbandOpen(true)}
                >
                  Дисбэнд
                </Button>
              </div>
            )}
            {isMemberNonCaptain && team.status !== 'DISBANDED' && (
              <Button
                variant="outline"
                onClick={() =>
                  setLeaveOpen({
                    playerId: myId!,
                    nickname: me.data?.profile.nickname ?? 'Без ника',
                    self: true,
                  })
                }
              >
                Покинуть команду
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Средний MMR</div>
            <div className="text-2xl font-bold">{team.avgMmr ?? '—'}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Создана</div>
            <div className="text-sm">{timeAgo(team.createdAt)}</div>
          </div>
          {team.inactiveReasons && team.inactiveReasons.length > 0 && (
            <div className="sm:col-span-2">
              <div className="mb-1 text-sm text-muted-foreground">
                Причины неактивности
              </div>
              <div className="flex flex-wrap gap-1.5">
                {team.inactiveReasons.map((r) => (
                  <Badge key={r} variant="outline">
                    {INACTIVE_REASON_LABEL[r]}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Состав</CardTitle>
          <CardDescription>{team.members.length} игроков</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Игрок</th>
                  <th className="px-4 py-2 font-medium">Роль</th>
                  <th className="px-4 py-2 font-medium">Позиция</th>
                  <th className="px-4 py-2 font-medium">Присоединился</th>
                  {isCaptain && team.status !== 'DISBANDED' && (
                    <th className="px-4 py-2 text-right font-medium">Действия</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {team.members.map((m) => {
                  const isMe = m.player.id === myId;
                  const isMemberCaptain = m.player.id === team.captain.id;
                  return (
                    <tr key={m.player.id} className="border-t">
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center gap-1.5">
                          <PlayerNameLink
                            playerId={m.player.id}
                            nickname={m.player.nickname ?? 'Без ника'}
                          />
                          <VerifiedFemaleBadge
                            verified={m.player.femaleVerified}
                          />
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline">
                          {TEAM_MEMBER_ROLE_LABEL[m.role]}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {m.position ? POSITION_LABEL[m.position] : '—'}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {timeAgo(m.joinedAt)}
                      </td>
                      {isCaptain && team.status !== 'DISBANDED' && (
                        <td className="px-4 py-2 text-right">
                          {!isMemberCaptain ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                setLeaveOpen({
                                  playerId: m.player.id,
                                  nickname: m.player.nickname ?? 'Без ника',
                                  self: isMe,
                                })
                              }
                              disabled={leaveMember.isPending}
                            >
                              Удалить
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              капитан
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {isCaptain && team.status !== 'DISBANDED' && (
        <Card>
          <CardHeader>
            <CardTitle>Приглашения</CardTitle>
            <CardDescription>
              {invites.data && invites.data.length > 0
                ? `${invites.data.filter((i) => i.status === 'PENDING').length} ожидают ответа`
                : 'Нет активных приглашений'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invites.isLoading && <Skeleton className="h-16 w-full" />}
            {invites.data && invites.data.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-4 py-2 font-medium">Игрок</th>
                      <th className="px-4 py-2 font-medium">Роль</th>
                      <th className="px-4 py-2 font-medium">Статус</th>
                      <th className="px-4 py-2 font-medium">Истекает</th>
                      <th className="px-4 py-2 text-right font-medium">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites.data.map((inv) => (
                      <tr key={inv.id} className="border-t">
                        <td className="px-4 py-2">
                          <PlayerNameLink
                            playerId={inv.invitee.id}
                            nickname={inv.invitee.nickname ?? 'Без ника'}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant="outline">
                            {TEAM_MEMBER_ROLE_LABEL[inv.proposedRole]}
                          </Badge>
                        </td>
                        <td className="px-4 py-2">
                          <Badge
                            variant={inv.status === 'PENDING' ? 'default' : 'secondary'}
                          >
                            {INVITE_STATUS_LABEL[inv.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {timeAgo(inv.expiresAt)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {inv.status === 'PENDING' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelInvite(inv.id)}
                              disabled={cancelInvite.isPending}
                            >
                              Отменить
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
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
      )}

      {/* Tournaments history */}
      <Card>
        <CardHeader>
          <CardTitle>История турниров</CardTitle>
          <CardDescription>
            {historyQ.isLoading
              ? 'Загрузка…'
              : `${historyQ.data?.tournaments.length ?? 0} участий`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyQ.isLoading && <Skeleton className="h-24 w-full" />}
          {historyQ.isError && (
            <div className="text-sm text-destructive">
              Не удалось загрузить историю турниров.
            </div>
          )}
          {historyQ.data && historyQ.data.tournaments.length === 0 && (
            <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
              Команда ещё не участвовала в турнирах.
            </div>
          )}
          {historyQ.data && historyQ.data.tournaments.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium">Турнир</th>
                    <th className="px-4 py-2 font-medium">Статус</th>
                    <th className="px-4 py-2 font-medium">Сид</th>
                    <th className="px-4 py-2 font-medium">Завершён</th>
                    <th className="px-4 py-2 text-center font-medium">
                      Победа
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {historyQ.data.tournaments.map((t) => (
                    <tr key={t.tournamentId} className="border-t">
                      <td className="px-4 py-2">
                        <Link
                          to={`/tournaments/${t.tournamentSlug}`}
                          className="hover:underline"
                        >
                          {t.tournamentName}
                        </Link>
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant={tournamentStatusVariant(t.status)}>
                          {TOURNAMENT_STATUS_LABEL[t.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {t.seed ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {fmtDate(t.endsAt)}
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

      {/* Disband confirm */}
      <Dialog open={disbandOpen} onOpenChange={setDisbandOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Расформировать команду?</DialogTitle>
            <DialogDescription>
              Это действие необратимо. Все игроки покинут состав.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDisbandOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisband}
              disabled={disband.isPending}
            >
              {disband.isPending ? 'Удаляем…' : 'Расформировать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite dialog */}
      <Dialog
        open={inviteOpen}
        onOpenChange={(open) => {
          if (!open) {
            setInviteOpen(false);
            setInviteSearch('');
            setInvitePicked(null);
            setInvitePosition('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Пригласить игрока</DialogTitle>
            <DialogDescription>
              Найдите игрока по никнейму и отправьте приглашение в состав.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="inv-q">Никнейм</Label>
              {(() => {
                const filtered = (playersQ.data?.items ?? []).filter(
                  (p) =>
                    p.id !== team.captain.id &&
                    !team.members.some((m) => m.player.id === p.id),
                );
                const dropdownOpen =
                  inviteSearch.length >= 3 && !invitePicked;
                function pick(idx: number) {
                  const p = filtered[idx];
                  if (!p) return;
                  setInvitePicked({ id: p.id, nickname: p.nickname ?? 'Без ника' });
                  setHighlightedIndex(0);
                }
                return (
                  <div className="relative">
                    <Input
                      id="inv-q"
                      ref={inviteInputRef}
                      value={inviteSearch}
                      onChange={(e) => {
                        setInviteSearch(e.target.value);
                        setInvitePicked(null);
                        setHighlightedIndex(0);
                      }}
                      onKeyDown={(e) => {
                        if (!dropdownOpen || filtered.length === 0) return;
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setHighlightedIndex((i) => Math.max(i - 1, 0));
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          pick(highlightedIndex);
                        } else if (e.key === 'Escape') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      placeholder="введите минимум 3 символа"
                      autoComplete="off"
                      autoFocus
                    />
                    {dropdownOpen && (
                      <div
                        className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-md border bg-popover shadow-lg"
                        role="listbox"
                      >
                        {playersQ.isLoading && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            поиск…
                          </div>
                        )}
                        {!playersQ.isLoading && filtered.length === 0 && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            Никого не нашли (или все уже в команде).
                          </div>
                        )}
                        {filtered.map((p, idx) => (
                          <button
                            key={p.id}
                            type="button"
                            role="option"
                            aria-selected={idx === highlightedIndex}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            onClick={() => pick(idx)}
                            className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
                              idx === highlightedIndex ? 'bg-muted' : 'hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="truncate font-medium">
                                {p.nickname ?? 'Без ника'}
                              </span>
                              {p.country && (
                                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                                  {p.country}
                                </span>
                              )}
                            </div>
                            {p.mmr && (
                              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                {p.mmr.mmr} MMR
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
              {inviteSearch.length > 0 && inviteSearch.length < 3 && !invitePicked && (
                <p className="text-xs text-muted-foreground">
                  Введите минимум 3 символа.
                </p>
              )}
              {invitePicked && (
                <div className="rounded border bg-muted/50 px-3 py-2 text-sm">
                  Выбран: <strong>{invitePicked.nickname}</strong>
                  <button
                    type="button"
                    onClick={() => {
                      setInvitePicked(null);
                      setInviteSearch('');
                      inviteInputRef.current?.focus();
                    }}
                    className="ml-2 text-xs text-muted-foreground hover:underline"
                  >
                    сбросить
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Роль в команде</Label>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as TeamMemberRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_ROLES.filter((r) => r !== 'CAPTAIN').map((r) => (
                    <SelectItem key={r} value={r}>
                      {TEAM_MEMBER_ROLE_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Позиция (опционально)</Label>
              <Select
                value={invitePosition || 'none'}
                onValueChange={(v) =>
                  setInvitePosition(v === 'none' ? '' : (v as PlayerPosition))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Не указана</SelectItem>
                  {POSITIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {POSITION_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!invitePicked || createInvite.isPending}
            >
              {createInvite.isPending ? 'Отправка…' : 'Отправить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave/kick confirm */}
      <Dialog open={!!leaveOpen} onOpenChange={(open) => !open && setLeaveOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {leaveOpen?.self ? 'Покинуть команду?' : 'Удалить из команды?'}
            </DialogTitle>
            <DialogDescription>
              {leaveOpen?.self
                ? 'Вы выйдете из состава команды. Это действие можно отменить через новый инвайт от капитана.'
                : `Игрок ${leaveOpen?.nickname ?? ''} будет удалён из состава.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLeaveOpen(null)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeave}
              disabled={leaveMember.isPending}
            >
              {leaveMember.isPending
                ? 'Применение…'
                : leaveOpen?.self
                  ? 'Покинуть'
                  : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer captaincy */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Передать капитанство</DialogTitle>
            <DialogDescription>
              Выберите нового капитана из активных участников.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Select value={newCaptain} onValueChange={setNewCaptain}>
              <SelectTrigger>
                <SelectValue placeholder="Игрок" />
              </SelectTrigger>
              <SelectContent>
                {transferCandidates.map((m) => (
                  <SelectItem key={m.player.id} value={m.player.id}>
                    {m.player.nickname ?? 'Без ника'} (
                    {TEAM_MEMBER_ROLE_LABEL[m.role]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTransferOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!newCaptain || transfer.isPending}
            >
              {transfer.isPending ? 'Передаём…' : 'Передать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit team */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditOpen(false);
            setEditLogoFile(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать команду</DialogTitle>
            <DialogDescription>
              Измените название или загрузите новый логотип. Если файл не
              выбран, логотип не изменится.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Название</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={64}
                placeholder="Например, Femka eSports"
              />
            </div>
            <div className="space-y-2">
              <Label>Текущий логотип</Label>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {team.logoUrl && <AvatarImage src={team.logoUrl} alt="" />}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {team.logoUrl ? 'Загружен' : 'Не загружен'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-logo">Новый логотип (опционально)</Label>
              <Input
                id="edit-logo"
                ref={editFileRef}
                type="file"
                accept="image/*"
                onChange={handleEditLogoPick}
              />
              {editLogoFile && (
                <p className="text-xs text-muted-foreground">
                  Файл: {editLogoFile.name} (
                  {Math.round(editLogoFile.size / 1024)} KB)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={
                updateTeam.isPending ||
                uploadAttachment.isPending ||
                editName.trim().length === 0 ||
                (editName.trim() === team.name && !editLogoFile)
              }
            >
              {updateTeam.isPending || uploadAttachment.isPending
                ? 'Сохраняем…'
                : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
