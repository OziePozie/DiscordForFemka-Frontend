import { useParams } from 'react-router-dom';
import { usePlayer } from '@/lib/queries';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MMR_SOURCE_LABEL, POSITION_LABEL } from '@/lib/api/types';
import { timeAgo } from '@/lib/utils';

export default function PlayerPublicPage() {
  const { id } = useParams<{ id: string }>();
  const q = usePlayer(id);

  if (q.isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }
  if (q.isError) {
    return (
      <div className="text-sm text-destructive">
        Не удалось загрузить игрока: {q.error?.message ?? 'unknown error'}
      </div>
    );
  }
  const p = q.data;
  if (!p) {
    return <div className="text-sm text-muted-foreground">Игрок не найден.</div>;
  }

  const initials = (p.nickname ?? '?').slice(0, 2).toUpperCase();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {p.avatarUrl && <AvatarImage src={p.avatarUrl} alt="" />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">
              {p.nickname ?? 'Без ника'}
            </CardTitle>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {p.country && <Badge variant="outline">{p.country}</Badge>}
              {p.primaryRole && (
                <Badge variant="secondary">
                  {POSITION_LABEL[p.primaryRole]}
                </Badge>
              )}
              <Badge
                variant={p.activity === 'ACTIVE' ? 'default' : 'outline'}
              >
                {p.activity === 'ACTIVE' ? 'Активен' : 'Неактивен'}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {p.mmr && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">MMR:</span>
            <span className="text-lg font-semibold">{p.mmr.mmr}</span>
            <Badge variant="outline">{MMR_SOURCE_LABEL[p.mmr.source]}</Badge>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {p.discordId && (
            <Badge variant="secondary">Discord: {String(p.discordId)}</Badge>
          )}
          {p.twitchLogin && (
            <Badge variant="secondary">Twitch: {p.twitchLogin}</Badge>
          )}
        </div>

        {p.createdAt && (
          <div className="text-sm text-muted-foreground">
            Присоединился: {timeAgo(p.createdAt)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
