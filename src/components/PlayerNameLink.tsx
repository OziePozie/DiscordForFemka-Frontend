import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { PlayerHoverCard } from '@/components/PlayerHoverCard';
import { getPlayer } from '@/lib/api/endpoints';
import { qk } from '@/lib/queries';
import { cn } from '@/lib/utils';

type Props = {
  playerId: string | null | undefined;
  nickname?: string | null;
  className?: string;
  children?: React.ReactNode;
};

export function PlayerNameLink({ playerId, nickname, className, children }: Props) {
  const queryClient = useQueryClient();

  if (!playerId) {
    return <span className={className}>{children ?? nickname ?? '—'}</span>;
  }

  const prefetch = () => {
    queryClient.prefetchQuery({
      queryKey: qk.player(playerId),
      queryFn: () => getPlayer(playerId),
      staleTime: 5 * 60_000,
    });
  };

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Link
          to={`/players/${playerId}`}
          className={cn('hover:underline', className)}
          onPointerEnter={prefetch}
          onFocus={prefetch}
        >
          {children ?? nickname ?? playerId.slice(0, 6)}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent>
        <PlayerHoverCard playerId={playerId} />
      </HoverCardContent>
    </HoverCard>
  );
}
