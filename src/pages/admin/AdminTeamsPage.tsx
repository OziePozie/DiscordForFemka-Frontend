import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useAdminTeams,
  useHideTeam,
  useUnhideTeam,
} from '@/lib/queries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  TEAM_STATUS_LABEL,
  type TeamPublicDto,
  type TeamStatus,
} from '@/lib/api/types';
import { timeAgo } from '@/lib/utils';

const PAGE_SIZE = 25;

const TEAM_STATUSES: TeamStatus[] = ['ACTIVE', 'INACTIVE', 'DISBANDED'];

type StatusFilter = 'ALL' | TeamStatus;
type HiddenFilter = 'ALL' | 'HIDDEN' | 'VISIBLE';

function describeError(e: unknown): string {
  if (e instanceof ProblemDetailError) {
    return `${e.title}${e.detail ? `: ${e.detail}` : ''}`;
  }
  if (e instanceof Error) return e.message;
  return 'Неизвестная ошибка';
}

function statusVariant(s: TeamStatus) {
  switch (s) {
    case 'ACTIVE':
      return 'default' as const;
    case 'INACTIVE':
      return 'secondary' as const;
    case 'DISBANDED':
      return 'outline' as const;
  }
}

export default function AdminTeamsPage() {
  const { toast } = useToast();

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [hiddenFilter, setHiddenFilter] = useState<HiddenFilter>('ALL');
  const [page, setPage] = useState(0);

  const query = useAdminTeams({
    q: q.trim() || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    hidden: hiddenFilter === 'ALL' ? undefined : hiddenFilter === 'HIDDEN',
    page,
    size: PAGE_SIZE,
  });

  const hideMut = useHideTeam();
  const unhideMut = useUnhideTeam();
  const mutating = hideMut.isPending || unhideMut.isPending;

  async function handleToggleHidden(t: TeamPublicDto) {
    try {
      if (t.hidden) {
        await unhideMut.mutateAsync(t.id);
        toast({ title: 'Команда показана' });
      } else {
        await hideMut.mutateAsync(t.id);
        toast({ title: 'Команда скрыта' });
      }
    } catch (e) {
      toast({
        title: 'Не удалось изменить видимость',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Команды</h1>
        <div className="text-sm text-muted-foreground">
          {query.data?.totalItems ?? 0} всего
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="at-q">Поиск</Label>
          <Input
            id="at-q"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Название или тег"
          />
        </div>
        <div className="space-y-1">
          <Label>Статус</Label>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as StatusFilter);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Все</SelectItem>
              {TEAM_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {TEAM_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Видимость</Label>
          <Select
            value={hiddenFilter}
            onValueChange={(v) => {
              setHiddenFilter(v as HiddenFilter);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Все</SelectItem>
              <SelectItem value="HIDDEN">Скрытые</SelectItem>
              <SelectItem value="VISIBLE">Видимые</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {query.isLoading && <Skeleton className="h-80 w-full" />}

      {query.isError && (
        <div className="text-sm text-destructive">
          Не удалось загрузить команды: {query.error?.message ?? 'unknown error'}
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
                <th className="px-4 py-2 font-medium">Команда</th>
                <th className="px-4 py-2 font-medium">Статус</th>
                <th className="px-4 py-2 font-medium">MMR</th>
                <th className="px-4 py-2 font-medium">Участники</th>
                <th className="px-4 py-2 font-medium">Видимость</th>
                <th className="px-4 py-2 font-medium">Создана</th>
                <th className="px-4 py-2 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {query.data.items!.map((t) => (
                <tr key={t.id} className="border-t align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.tag}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(t.status)}>
                      {TEAM_STATUS_LABEL[t.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {t.avgMmr ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.memberCount}
                  </td>
                  <td className="px-4 py-3">
                    {t.hidden ? (
                      <Badge variant="secondary">Скрыта</Badge>
                    ) : (
                      <Badge variant="outline">Видима</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {timeAgo(t.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" disabled={mutating}>
                          Действия
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleHidden(t)}>
                          {t.hidden ? 'Показать' : 'Скрыть'}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/teams/${t.id}`}>Открыть страницу</Link>
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
    </div>
  );
}
