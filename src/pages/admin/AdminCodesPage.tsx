import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAdminCodes, useRevokeAccessCode } from '@/lib/queries';
import { ProblemDetailError } from '@/lib/api/client';
import {
  CODE_STATUS_LABEL,
  CODE_TYPE_LABEL,
  type CodeStatus,
  type CodeType,
} from '@/lib/api/types';
import { timeAgo } from '@/lib/utils';

const PAGE_SIZE = 25;

type StatusFilter = 'ALL' | CodeStatus;
type TypeFilter = 'ALL' | CodeType;

function describeError(err: unknown): string {
  if (err instanceof ProblemDetailError) return err.detail ?? err.title;
  if (err instanceof Error) return err.message;
  return 'неизвестная ошибка';
}

function statusClass(status: CodeStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'border-transparent bg-emerald-500/15 text-emerald-400';
    case 'USED':
      return 'border-transparent bg-muted text-muted-foreground';
    case 'REVOKED':
      return 'border-transparent bg-destructive/15 text-destructive';
    case 'EXPIRED':
      return 'border-transparent bg-amber-500/15 text-amber-400';
  }
}

export default function AdminCodesPage() {
  const { toast } = useToast();
  const [playerId, setPlayerId] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [type, setType] = useState<TypeFilter>('ALL');
  const [page, setPage] = useState(0);

  const codes = useAdminCodes({
    playerId: playerId.trim() || undefined,
    status: status === 'ALL' ? undefined : status,
    type: type === 'ALL' ? undefined : type,
    page,
    size: PAGE_SIZE,
  });
  const revoke = useRevokeAccessCode();

  const items = codes.data?.items ?? [];
  const totalPages = codes.data?.totalPages ?? 1;

  function onRevoke(id: string) {
    revoke
      .mutateAsync(id)
      .then(() => toast({ title: 'Код отозван' }))
      .catch((err) =>
        toast({
          title: 'Не удалось отозвать',
          description: describeError(err),
          variant: 'destructive',
        }),
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Коды доступа</h1>
        <div className="text-sm text-muted-foreground">
          {codes.data?.totalItems ?? 0} кодов
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Код выдаётся на карточке игрока (раздел «Игроки») и показывается ровно один раз. В базе
        хранится только хеш — восстановить код нельзя, можно лишь выпустить новый.
      </p>

      <div className="flex flex-wrap gap-3">
        <Input
          value={playerId}
          onChange={(e) => {
            setPlayerId(e.target.value);
            setPage(0);
          }}
          placeholder="ID игрока"
          className="w-72"
        />
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as StatusFilter);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Любой статус</SelectItem>
            {(['ACTIVE', 'USED', 'REVOKED', 'EXPIRED'] as CodeStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {CODE_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={type}
          onValueChange={(v) => {
            setType(v as TypeFilter);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Тип" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Любой тип</SelectItem>
            {(['AUTH', 'START_RATING', 'TOURNAMENT_RATING'] as CodeType[]).map((t) => (
              <SelectItem key={t} value={t}>
                {CODE_TYPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {codes.isLoading && <Skeleton className="h-80 w-full" />}

      {!codes.isLoading && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Игрок</th>
                <th className="px-3 py-2 font-medium">Тип</th>
                <th className="px-3 py-2 font-medium">Статус</th>
                <th className="px-3 py-2 font-medium">Выдан</th>
                <th className="px-3 py-2 font-medium">Истекает</th>
                <th className="px-3 py-2 font-medium">Telegram</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{c.playerId}</td>
                  <td className="px-3 py-2">{CODE_TYPE_LABEL[c.codeType]}</td>
                  <td className="px-3 py-2">
                    <Badge className={statusClass(c.status)}>{CODE_STATUS_LABEL[c.status]}</Badge>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {c.createdAt ? timeAgo(c.createdAt) : '—'}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleString('ru-RU') : '—'}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                    {c.usedTelegramId ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {c.status === 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={revoke.isPending}
                        onClick={() => onRevoke(c.id)}
                      >
                        Отозвать
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                    Кодов не найдено
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Вперёд
          </Button>
        </div>
      )}
    </div>
  );
}
