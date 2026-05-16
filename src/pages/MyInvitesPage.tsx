import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useAcceptInvite,
  useDeclineInvite,
  useMyInvites,
} from '@/lib/queries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  INVITE_STATUS_LABEL,
  TEAM_MEMBER_ROLE_LABEL,
  type TeamInviteDto,
} from '@/lib/api/types';

const PAGE_SIZE = 12;

function timeUntil(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return '—';
  if (ms <= 0) return 'истекло';
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  if (m < 60) return `осталось ${m} мин`;
  const h = Math.floor(m / 60);
  if (h < 24) return `осталось ${h} ч`;
  const d = Math.floor(h / 24);
  return `осталось ${d} дн`;
}

export default function MyInvitesPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING');
  const [page, setPage] = useState(0);

  const q = useMyInvites({ status: filter, page, size: PAGE_SIZE });
  const acceptInvite = useAcceptInvite();
  const declineInvite = useDeclineInvite();

  // Backend doesn't (yet) accept a status query param on /me/invites — apply
  // the filter client-side so the UI works against the existing contract.
  const items = useMemo<TeamInviteDto[]>(() => {
    const list = q.data?.items ?? [];
    if (filter === 'PENDING') return list.filter((i) => i.status === 'PENDING');
    return list;
  }, [q.data, filter]);

  function describeError(e: unknown): string {
    if (e instanceof ProblemDetailError) {
      return `${e.title}${e.detail ? `: ${e.detail}` : ''}`;
    }
    return e instanceof Error ? e.message : 'Неизвестная ошибка';
  }

  async function handleAccept(id: string) {
    try {
      await acceptInvite.mutateAsync(id);
      toast({ title: 'Приглашение принято' });
    } catch (e) {
      toast({
        title: 'Не удалось принять',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  async function handleDecline(id: string) {
    try {
      await declineInvite.mutateAsync(id);
      toast({ title: 'Приглашение отклонено' });
    } catch (e) {
      toast({
        title: 'Не удалось отклонить',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Приглашения</h1>
        <div className="flex items-center gap-3">
          <Select
            value={filter}
            onValueChange={(v) => {
              setFilter(v as 'PENDING' | 'ALL');
              setPage(0);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Только ожидающие</SelectItem>
              <SelectItem value="ALL">Все</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {q.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      )}

      {q.isError && (
        <div className="text-sm text-destructive">
          Не удалось загрузить приглашения:{' '}
          {q.error?.message ?? 'unknown error'}
        </div>
      )}

      {q.data && items.length === 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          {filter === 'PENDING'
            ? 'Нет активных приглашений.'
            : 'История приглашений пуста.'}
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((inv) => {
            const isPending = inv.status === 'PENDING';
            return (
              <Card key={inv.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg">
                        <Link
                          to={`/teams/${inv.team.id}`}
                          className="hover:underline"
                        >
                          {inv.team.name}{' '}
                          <span className="text-sm text-muted-foreground">
                            [{inv.team.tag}]
                          </span>
                        </Link>
                      </CardTitle>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant={isPending ? 'default' : 'secondary'}
                        >
                          {INVITE_STATUS_LABEL[inv.status]}
                        </Badge>
                        <Badge variant="outline">
                          {TEAM_MEMBER_ROLE_LABEL[inv.proposedRole]}
                        </Badge>
                        {isPending && (
                          <span className="text-xs text-muted-foreground">
                            {timeUntil(inv.expiresAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    {isPending && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleDecline(inv.id)}
                          disabled={
                            declineInvite.isPending || acceptInvite.isPending
                          }
                        >
                          Отклонить
                        </Button>
                        <Button
                          onClick={() => handleAccept(inv.id)}
                          disabled={
                            acceptInvite.isPending || declineInvite.isPending
                          }
                        >
                          Принять
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <div>
                    Пригласил:{' '}
                    <span className="text-foreground">
                      {inv.inviter.nickname ?? 'Без ника'}
                    </span>
                  </div>
                  <div>Создано: {new Date(inv.createdAt).toLocaleString()}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {q.data && (q.data.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Назад
          </Button>
          <div className="text-sm text-muted-foreground">
            Страница {(q.data.page ?? page) + 1} из {q.data.totalPages}
          </div>
          <Button
            variant="outline"
            disabled={page + 1 >= (q.data.totalPages ?? 1)}
            onClick={() => setPage((p) => p + 1)}
          >
            Дальше
          </Button>
        </div>
      )}
    </div>
  );
}
