import { useState } from 'react';
import { Link } from 'react-router-dom';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { PlayerHoverCard } from '@/components/PlayerHoverCard';
import { cn } from '@/lib/utils';

type Props = {
  playerId: string | null | undefined;
  nickname?: string | null;
  className?: string;
  children?: React.ReactNode;
};

export function PlayerNameLink({ playerId, nickname, className, children }: Props) {
  const [open, setOpen] = useState(false);

  if (!playerId) {
    return <span className={className}>{children ?? nickname ?? '—'}</span>;
  }

  return (
    <HoverCard openDelay={300} closeDelay={150} open={open} onOpenChange={setOpen}>
      <HoverCardTrigger asChild>
        <Link
          to={`/players/${playerId}`}
          className={cn('hover:underline', className)}
        >
          {children ?? nickname ?? playerId.slice(0, 6)}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent>
        {open && <PlayerHoverCard playerId={playerId} />}
      </HoverCardContent>
    </HoverCard>
  );
}
