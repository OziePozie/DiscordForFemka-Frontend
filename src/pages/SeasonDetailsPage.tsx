import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSeason } from '@/lib/queries';
import { ProblemDetailError } from '@/lib/api/client';
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
import {
  SEASON_STATUS_LABEL,
  TOURNAMENT_FORMAT_LABEL,
  TOURNAMENT_STATUS_LABEL,
  type SeasonStatus,
  type TournamentStatus,
} from '@/lib/api/types';

function seasonVariant(s: SeasonStatus) {
  switch (s) {
    case 'ACTIVE':
      return 'default' as const;
    case 'PLANNED':
      return 'secondary' as const;
    case 'FINISHED':
      return 'outline' as const;
  }
}

function tournamentVariant(s: TournamentStatus) {
  switch (s) {
    case 'LIVE':
      return 'default' as const;
    case 'REGISTRATION_OPEN':
    case 'REGISTRATION_CLOSED':
      return 'secondary' as const;
    case 'ANNOUNCED':
      return 'outline' as const;
    case 'FINISHED':
      return 'outline' as const;
    case 'CANCELLED':
      return 'destructive' as const;
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

export default function SeasonDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const q = useSeason(slug);

  useEffect(() => {
    if (q.error instanceof ProblemDetailError && q.error.status === 404) {
      navigate('/404', { replace: true });
    }
  }, [q.error, navigate]);

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="text-sm text-destructive">
        Не удалось загрузить сезон: {q.error?.message ?? 'unknown error'}
      </div>
    );
  }

  const { season, tournaments, highlights } = q.data;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{season.name}</h1>
          <Badge variant={seasonVariant(season.status)}>
            {SEASON_STATUS_LABEL[season.status]}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {fmtDate(season.startsAt)} — {fmtDate(season.endsAt)}
        </div>
        {season.description && (
          <p className="max-w-3xl text-base text-muted-foreground">
            {season.description}
          </p>
        )}
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Турниры сезона</h2>
        {tournaments.length === 0 ? (
          <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
            Турниров пока нет.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((t) => (
              <Card key={t.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{t.name}</CardTitle>
                    <Badge variant={tournamentVariant(t.status)}>
                      {TOURNAMENT_STATUS_LABEL[t.status]}
                    </Badge>
                  </div>
                  <CardDescription className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {TOURNAMENT_FORMAT_LABEL[t.format]}
                    </Badge>
                    {t.prizePoolText && (
                      <span className="text-xs">{t.prizePoolText}</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-3">
                  {t.startsAt && (
                    <div className="text-xs text-muted-foreground">
                      Старт: {fmtDate(t.startsAt)}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/tournaments/${t.slug}`)}
                  >
                    К турниру
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {highlights && highlights.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Highlights</h2>
          <ul className="space-y-2">
            {highlights.map((h, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-md border px-4 py-3"
              >
                <div className="space-y-0.5">
                  <div className="font-medium">{h.title ?? 'Highlight'}</div>
                  {h.kind && (
                    <div className="text-xs text-muted-foreground">{h.kind}</div>
                  )}
                </div>
                {h.url && (
                  <a
                    href={h.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    Открыть
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
