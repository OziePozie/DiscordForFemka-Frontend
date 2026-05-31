import { cn } from '@/lib/utils';
import type { RankTier } from '@/lib/api/types';

const RANK_META: Record<
  RankTier,
  { label: string; className: string }
> = {
  BLOSSOM: {
    label: 'Blossom',
    className: 'bg-pink-100 text-pink-700 ring-1 ring-pink-200',
  },
  SAPPHIRE: {
    label: 'Sapphire',
    className: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200',
  },
  DIAMOND: {
    label: 'Diamond',
    className: 'bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200',
  },
  IMMORTAL: {
    label: 'Immortal',
    className: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  },
  CELESTIAL: {
    label: 'Celestial',
    className:
      'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-[0_4px_12px_rgba(126,91,255,0.25)]',
  },
};

export function rankLabel(tier: RankTier): string {
  return RANK_META[tier]?.label ?? tier;
}

type Props = {
  tier: RankTier;
  className?: string;
};

export function RankBadge({ tier, className }: Props) {
  const meta = RANK_META[tier] ?? {
    label: tier,
    className: 'bg-slate-200 text-slate-700',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide',
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
