import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useDisbandTeam,
  useMe,
  useTeam,
  useTransferCaptaincy,
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
import { useToast } from '@/components/ui/use-toast';
import { ProblemDetailError } from '@/lib/api/client';
import {
  INACTIVE_REASON_LABEL,
  POSITION_LABEL,
  TEAM_MEMBER_ROLE_LABEL,
  TEAM_STATUS_LABEL,
  type TeamStatus,
} from '@/lib/api/types';
import { timeAgo } from '@/lib/utils';

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
  const { toast } = useToast();

  const [disbandOpen, setDisbandOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [newCaptain, setNewCaptain] = useState<string>('');

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
  const initials = (team.tag ?? team.name ?? '?').slice(0, 2).toUpperCase();

  const transferCandidates = team.members.filter(
    (m) => m.player.id !== team.captain.id,
  );

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
                    <Link
                      to={`/players/${team.captain.id}`}
                      className="text-foreground hover:underline"
                    >
                      {team.captain.nickname ?? 'Без ника'}
                    </Link>
                  </span>
                </CardDescription>
              </div>
            </div>
            {isCaptain && team.status !== 'DISBANDED' && (
              <div className="flex flex-wrap gap-2">
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
                </tr>
              </thead>
              <tbody>
                {team.members.map((m) => (
                  <tr key={m.player.id} className="border-t">
                    <td className="px-4 py-2">
                      <Link
                        to={`/players/${m.player.id}`}
                        className="hover:underline"
                      >
                        {m.player.nickname ?? 'Без ника'}
                      </Link>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </div>
  );
}
