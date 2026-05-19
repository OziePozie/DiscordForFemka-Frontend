import { useState } from 'react';
import { Link } from 'react-router-dom';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { TeamHoverCard } from '@/components/TeamHoverCard';
import { cn } from '@/lib/utils';

type Props = {
  teamId: string | null | undefined;
  name?: string | null;
  tag?: string | null;
  className?: string;
  children?: React.ReactNode;
};

export function TeamNameLink({ teamId, name, tag, className, children }: Props) {
  const [open, setOpen] = useState(false);

  const label =
    children ??
    (name && tag
      ? <>{name} <span className="text-muted-foreground">[{tag}]</span></>
      : name ?? '—');

  if (!teamId) {
    return <span className={className}>{label}</span>;
  }

  return (
    <HoverCard openDelay={300} closeDelay={150} open={open} onOpenChange={setOpen}>
      <HoverCardTrigger asChild>
        <Link
          to={`/teams/${teamId}`}
          className={cn('hover:underline', className)}
        >
          {label}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent>
        {open && <TeamHoverCard teamId={teamId} />}
      </HoverCardContent>
    </HoverCard>
  );
}
