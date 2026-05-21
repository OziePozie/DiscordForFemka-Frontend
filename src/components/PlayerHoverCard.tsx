import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Crown,
  Twitch,
  ExternalLink,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlayer } from '@/lib/queries';
import { POSITION_LABEL } from '@/lib/api/types';
import { timeAgoRu } from '@/lib/format';

type Props = { playerId: string };

export function PlayerHoverCard({ playerId }: Props) {
  const { data: p, isLoading, isError } = usePlayer(playerId);

  if (isLoading) return <PlayerSkeleton />;
  if (isError || !p) return <div className="text-sm text-muted-foreground">Не удалось загрузить профиль</div>;

  const captainMembership = p.teams?.find((t) => t.role === 'CAPTAIN');
  const primaryTeam = captainMembership ?? p.teams?.[0] ?? null;
  const isCaptain = Boolean(captainMembership);
  const mmrConfirmed = p.mmr?.source === 'MANUAL_CONFIRMED';
  const initials = (p.nickname ?? '??').slice(0, 2).toUpperCase();

  return (
    <div className="relative space-y-3">
      {isCaptain && (
        <Badge variant="secondary" className="absolute -right-1 -top-1">
          <Crown className="mr-1 h-3 w-3" />
          Капитан
        </Badge>
      )}

      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-14 w-14">
            {p.avatarUrl && <AvatarImage src={p.avatarUrl} alt={p.nickname ?? ''} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {p.activity === 'ACTIVE' && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
          )}
        </div>
        <div className="flex items-center gap-1.5 font-semibold">
          <span className="truncate max-w-[180px]">{p.nickname ?? '—'}</span>
          {mmrConfirmed && <CheckCircle2 className="h-4 w-4 text-blue-500" aria-label="MMR подтверждён" />}
        </div>
      </div>

      <SocialLinks
        discordId={p.discordId ?? null}
        twitchLogin={p.twitchLogin ?? null}
        dotabuffUrl={p.dotabuffUrl ?? null}
        stratzUrl={p.stratzUrl ?? null}
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {p.country && <Badge variant="outline">{p.country}</Badge>}
        {p.gender && (
          <Badge variant="outline">{p.gender === 'MALE' ? '♂' : '♀'}</Badge>
        )}
        {p.primaryRole && (
          <Badge variant="outline">{POSITION_LABEL[p.primaryRole]}</Badge>
        )}
        <Badge variant={p.activity === 'ACTIVE' ? 'default' : 'secondary'}>
          {p.activity === 'ACTIVE' ? 'Активен' : 'Неактивен'}
        </Badge>
      </div>

      {p.mmr && (
        <div className="rounded-xl bg-muted/40 p-3">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs text-muted-foreground">MMR</div>
              <div className="text-2xl font-bold text-primary">{p.mmr.mmr}</div>
            </div>
            {mmrConfirmed && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                Подтверждено модератором
              </div>
            )}
          </div>
          {p.mmr.fetchedAt && (
            <div className="mt-1 text-xs text-muted-foreground">
              Обновлено {timeAgoRu(p.mmr.fetchedAt)}
            </div>
          )}
        </div>
      )}

      {primaryTeam && (
        <div className="rounded-xl bg-muted/40 p-3">
          <div className="mb-1 text-xs text-muted-foreground">Команда</div>
          <div className="flex items-center justify-between gap-2">
            <Link
              to={`/teams/${primaryTeam.teamId}`}
              className="flex items-center gap-2 hover:underline"
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px]">
                  {primaryTeam.tag.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[160px]">
                {primaryTeam.name} <span className="text-muted-foreground">[{primaryTeam.tag}]</span>
              </span>
            </Link>
            <Badge variant={primaryTeam.role === 'CAPTAIN' ? 'default' : 'secondary'}>
              {primaryTeam.role === 'CAPTAIN' ? 'Капитан' : 'Игрок'}
            </Badge>
          </div>
        </div>
      )}

      <Button asChild className="w-full">
        <Link to={`/players/${playerId}`}>Перейти к профилю</Link>
      </Button>
    </div>
  );
}

function SocialLinks({
  discordId,
  twitchLogin,
  dotabuffUrl,
  stratzUrl,
}: {
  discordId: string | null;
  twitchLogin: string | null;
  dotabuffUrl: string | null;
  stratzUrl: string | null;
}) {
  if (!discordId && !twitchLogin && !dotabuffUrl && !stratzUrl) return null;
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      {discordId && (
        <span className="rounded-full bg-[#5865F2] p-1.5 text-white" title={`Discord ID ${discordId}`}>
          <ExternalLink className="h-3.5 w-3.5" />
        </span>
      )}
      {twitchLogin && (
        <a
          href={`https://twitch.tv/${twitchLogin}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#9146FF] p-1.5 text-white"
          title={`Twitch: ${twitchLogin}`}
        >
          <Twitch className="h-3.5 w-3.5" />
        </a>
      )}
      {dotabuffUrl && (
        <a href={dotabuffUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-red-600 p-1.5 text-white" title="Dotabuff">
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
      {stratzUrl && (
        <a href={stratzUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-cyan-600 p-1.5 text-white" title="Stratz">
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}

function PlayerSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-14 w-14 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}
