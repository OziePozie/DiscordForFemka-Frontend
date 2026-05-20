import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeam } from '@/lib/queries';
import { POSITION_LABEL } from '@/lib/api/types';

type Props = { teamId: string };

export function TeamHoverCard({ teamId }: Props) {
  const { data: t, isLoading, isError } = useTeam(teamId);

  if (isLoading) return <TeamSkeleton />;
  if (isError || !t) return <div className="text-sm text-muted-foreground">Не удалось загрузить команду</div>;

  const initials = t.tag.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 rounded-xl">
          {t.logoUrl && <AvatarImage src={t.logoUrl} alt={t.name} />}
          <AvatarFallback className="rounded-xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate font-semibold">
            {t.name} <span className="text-muted-foreground">[{t.tag}]</span>
          </div>
          <Badge variant={t.status === 'ACTIVE' ? 'default' : 'secondary'} className="mt-0.5">
            {t.status}
          </Badge>
        </div>
      </div>

      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Средний MMR: <b className="text-foreground">{t.avgMmr ?? '—'}</b></span>
        <span>{t.members.length} игроков</span>
      </div>

      <div className="max-h-[12.5rem] space-y-1.5 overflow-y-auto">
        {t.members.map((m) => (
          <div key={m.player.id} className="flex items-center justify-between gap-2 text-sm">
            <Link to={`/players/${m.player.id}`} className="flex min-w-0 items-center gap-2 hover:underline">
              <Avatar className="h-6 w-6">
                {m.player.avatarUrl && <AvatarImage src={m.player.avatarUrl} alt={m.player.nickname ?? ''} />}
                <AvatarFallback className="text-[0.625rem]">
                  {(m.player.nickname ?? '??').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{m.player.nickname ?? '—'}</span>
              {m.role === 'CAPTAIN' && <Crown className="h-3.5 w-3.5 text-amber-500" />}
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {m.position && <span>{POSITION_LABEL[m.position]}</span>}
              {m.player.mmr && <span className="font-medium text-foreground">{m.player.mmr.mmr}</span>}
            </div>
          </div>
        ))}
      </div>

      <Button asChild className="w-full">
        <Link to={`/teams/${teamId}`}>Перейти к команде</Link>
      </Button>
    </div>
  );
}

function TeamSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}
