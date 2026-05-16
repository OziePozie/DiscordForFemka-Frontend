import { Link, useParams } from 'react-router-dom';
import { useMatch } from '@/lib/queries';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MATCH_FORMAT_LABEL,
  MATCH_KIND_LABEL,
  MATCH_STATUS_LABEL,
  type MatchStatus,
  type TeamPublicDto,
} from '@/lib/api/types';

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

function TeamBlock({
  team,
  align,
  highlight,
}: {
  team: TeamPublicDto;
  align: 'left' | 'right';
  highlight: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col gap-1 ${
        align === 'right' ? 'items-end text-right' : 'items-start text-left'
      }`}
    >
      <Link
        to={`/teams/${team.id}`}
        className={`truncate text-xl font-semibold hover:underline ${
          highlight ? 'text-green-700' : ''
        }`}
      >
        {team.name}
      </Link>
      <div className="text-sm text-muted-foreground">[{team.tag}]</div>
      {team.avgMmr != null && (
        <div className="text-xs text-muted-foreground">
          Средний MMR: {team.avgMmr}
        </div>
      )}
    </div>
  );
}

export default function MatchDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const q = useMatch(id);

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="text-sm text-destructive">
        Не удалось загрузить матч: {q.error?.message ?? 'unknown error'}
      </div>
    );
  }

  const m = q.data;
  const finished = m.status === 'FINISHED';
  const aWin = finished && m.winnerTeamId === m.teamA.id;
  const bWin = finished && m.winnerTeamId === m.teamB.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={statusVariant(m.status)}>
          {MATCH_STATUS_LABEL[m.status]}
        </Badge>
        <Badge variant="outline">{MATCH_FORMAT_LABEL[m.format]}</Badge>
        <Badge variant="secondary">{MATCH_KIND_LABEL[m.kind]}</Badge>
        {m.tournamentId && (
          // TODO: resolve tournament slug from tournamentId once backend exposes
          // it on MatchDto; until then show a plain label without a link.
          <Badge variant="outline" title={m.tournamentId}>
            Турнир
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <TeamBlock team={m.teamA} align="left" highlight={aWin} />
            <div className="flex flex-col items-center gap-1">
              <div className="font-mono text-4xl font-bold tracking-tight">
                <span className={aWin ? 'text-green-700' : ''}>
                  {m.scoreA}
                </span>
                <span className="px-2 text-muted-foreground">:</span>
                <span className={bWin ? 'text-green-700' : ''}>
                  {m.scoreB}
                </span>
              </div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {MATCH_FORMAT_LABEL[m.format]}
              </div>
            </div>
            <TeamBlock team={m.teamB} align="right" highlight={bWin} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Детали</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <div className="text-muted-foreground">Запланирован</div>
            <div>{fmtDateTime(m.scheduledAt)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Завершён</div>
            <div>{fmtDateTime(m.finishedAt)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Тип</div>
            <div>{MATCH_KIND_LABEL[m.kind]}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Формат</div>
            <div>{MATCH_FORMAT_LABEL[m.format]}</div>
          </div>
        </CardContent>
      </Card>

      {m.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Заметки</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{m.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
