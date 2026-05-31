import { BadgeCheck } from 'lucide-react';

import { cn } from '@/lib/utils';

type Props = {
  /** When false/undefined the badge renders nothing. */
  verified?: boolean | null;
  /** Show full label ("Верифицирована") instead of the compact check-only variant. */
  withLabel?: boolean;
  className?: string;
};

/**
 * Small tag marking a player with the official "verified female" status
 * (granted by admins — distinct from the self-reported gender field).
 */
export function VerifiedFemaleBadge({
  verified,
  withLabel = false,
  className,
}: Props) {
  if (!verified) return null;
  return (
    <span
      title="Верифицирована"
      aria-label="Верифицирована"
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-pink-100 px-2 py-0.5 text-xs font-semibold text-pink-700 ring-1 ring-pink-200',
        className,
      )}
    >
      <BadgeCheck className="h-3.5 w-3.5" />
      {withLabel && <span>Верифицирована</span>}
    </span>
  );
}
