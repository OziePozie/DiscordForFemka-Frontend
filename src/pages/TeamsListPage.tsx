import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeamsList } from '@/lib/queries';
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
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TEAM_STATUS_LABEL, type TeamStatus } from '@/lib/api/types';

const PAGE_SIZE = 12;

const STATUS_OPTIONS: Array<{ value: 'ALL' | TeamStatus; label: string }> = [
  { value: 'ALL', label: 'Все статусы' },
  { value: 'ACTIVE', label: TEAM_STATUS_LABEL.ACTIVE },
  { value: 'INACTIVE', label: TEAM_STATUS_LABEL.INACTIVE },
  { value: 'DISBANDED', label: TEAM_STATUS_LABEL.DISBANDED },
];

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

export default function TeamsListPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [status, setStatus] = useState<'ALL' | TeamStatus>('ALL');
  const [page, setPage] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(searchInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const q = useTeamsList({
    q: debouncedQ || undefined,
    status: status === 'ALL' ? undefined : status,
    page,
    size: PAGE_SIZE,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Команды</h1>
        <div className="text-sm text-muted-foreground">
          {q.data?.totalItems ?? 0} всего
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Поиск по названию или тегу"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as 'ALL' | TeamStatus);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {q.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}

      {q.isError && (
        <div className="text-sm text-destructive">
          Не удалось загрузить команды: {q.error?.message ?? 'unknown error'}
        </div>
      )}

      {q.data && (q.data.items?.length ?? 0) === 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          Команды не найдены.
        </div>
      )}

      {q.data && (q.data.items?.length ?? 0) > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.items!.map((team) => {
            const initials = (team.tag ?? team.name ?? '?')
              .slice(0, 2)
              .toUpperCase();
            return (
              <Card key={team.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      {team.logoUrl && (
                        <AvatarImage src={team.logoUrl} alt="" />
                      )}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-lg">
                        {team.name}{' '}
                        <span className="text-sm text-muted-foreground">
                          [{team.tag}]
                        </span>
                      </CardTitle>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant={statusVariant(team.status)}>
                          {TEAM_STATUS_LABEL[team.status]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto space-y-2 text-sm">
                  <div className="text-muted-foreground">
                    Капитан:{' '}
                    <span className="text-foreground">
                      {team.captain.nickname ?? 'Без ника'}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>MMR: {team.avgMmr ?? '—'}</span>
                    <span>Состав: {team.memberCount}</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/teams/${team.id}`)}
                  >
                    Открыть
                  </Button>
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
