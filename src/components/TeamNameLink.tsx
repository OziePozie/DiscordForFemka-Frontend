import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { useHoverCardSingleton } from '@/components/ui/hover-card-singleton';
import { TeamHoverCard } from '@/components/TeamHoverCard';
import { getTeamById } from '@/lib/api/endpoints';
import { qk } from '@/lib/queries';
import { cn } from '@/lib/utils';

type Props = {
  teamId: string | null | undefined;
  name?: string | null;
  tag?: string | null;
  className?: string;
  children?: React.ReactNode;
};

export function TeamNameLink({ teamId, name, tag, className, children }: Props) {
  const label =
    children ??
    (name && tag
      ? <>{name} <span className="text-muted-foreground">[{tag}]</span></>
      : name ?? '—');

  if (!teamId) {
    return <span className={className}>{label}</span>;
  }

  return (
    <TeamNameLinkInner teamId={teamId} className={className}>
      {label}
    </TeamNameLinkInner>
  );
}

function TeamNameLinkInner({
  teamId,
  className,
  children,
}: {
  teamId: string;
  className?: string;
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const { open, setOpen, claim } = useHoverCardSingleton(`team:${teamId}`);

  const prefetch = () => {
    queryClient.prefetchQuery({
      queryKey: qk.team(teamId),
      queryFn: () => getTeamById(teamId),
      staleTime: 5 * 60_000,
    });
  };

  return (
    <HoverCard openDelay={200} closeDelay={100} open={open} onOpenChange={setOpen}>
      <HoverCardTrigger asChild>
        <Link
          to={`/teams/${teamId}`}
          className={cn('hover:underline', className)}
          onPointerEnter={() => {
            prefetch();
            claim();
          }}
          onFocus={() => {
            prefetch();
            claim();
          }}
        >
          {children}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent>
        <TeamHoverCard teamId={teamId} />
      </HoverCardContent>
    </HoverCard>
  );
}
