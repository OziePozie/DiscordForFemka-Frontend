import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeasonsList } from '@/lib/queries';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SEASON_STATUS_LABEL, type SeasonStatus } from '@/lib/api/types';

const PAGE_SIZE = 12;

function statusVariant(s: SeasonStatus) {
  switch (s) {
    case 'ACTIVE':
      return 'default' as const;
    case 'PLANNED':
      return 'secondary' as const;
    case 'FINISHED':
      return 'outline' as const;
  }
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function SeasonsListPage() {
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const q = useSeasonsList({ page, size: PAGE_SIZE });

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Сезоны</h1>
        <div className="text-sm text-muted-foreground">
          {q.data?.totalItems ?? 0} всего
        </div>
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
          Не удалось загрузить сезоны: {q.error?.message ?? 'unknown error'}
        </div>
      )}

      {q.data && (q.data.items?.length ?? 0) === 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          Сезонов пока нет.
        </div>
      )}

      {q.data && (q.data.items?.length ?? 0) > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.items!.map((s) => (
            <Card key={s.id} className="flex flex-col overflow-hidden">
              {s.bannerUrl && (
                <img
                  src={s.bannerUrl}
                  alt=""
                  className="aspect-[16/6] w-full object-cover"
                />
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{s.name}</CardTitle>
                  <Badge variant={statusVariant(s.status)}>
                    {SEASON_STATUS_LABEL[s.status]}
                  </Badge>
                </div>
                {s.description && (
                  <CardDescription className="line-clamp-2">
                    {s.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="mt-auto space-y-3">
                <div className="text-sm text-muted-foreground">
                  {fmtDate(s.startsAt)} — {fmtDate(s.endsAt)}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/seasons/${s.slug}`)}
                >
                  Открыть
                </Button>
              </CardContent>
            </Card>
          ))}
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
