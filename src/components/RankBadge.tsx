import { cn } from '@/lib/utils';
import type { RankTier } from '@/lib/api/types';

const RANK_META: Record<RankTier, { label: string; dot: string }> = {
  BLOSSOM: { label: 'Blossom', dot: '#db6fa1' },
  SAPPHIRE: { label: 'Sapphire', dot: '#3b82f6' },
  DIAMOND: { label: 'Diamond', dot: '#22b8cf' },
  IMMORTAL: { label: 'Immortal', dot: '#d19a3a' },
  CELESTIAL: { label: 'Celestial', dot: '#7c5cff' },
};

export function rankLabel(tier: RankTier): string {
  return RANK_META[tier]?.label ?? tier;
}

type Props = {
  tier: RankTier;
  className?: string;
};

/**
 * Ранг-тир в стиле «Editorial Clean»: цветная точка + подпись вместо
 * цветной таблетки. Точка сохраняет узнаваемость тира, текст нейтрален.
 */
export function RankBadge({ tier, className }: Props) {
  const meta = RANK_META[tier] ?? { label: tier, dot: '#9a9eb3' };
  return (
    <span
      className={cn(
        'ec-kicker inline-flex items-center gap-1.5 text-[0.6875rem] text-ink-muted [letter-spacing:0.08em]',
        className,
      )}
    >
      <span className="ec-dot" style={{ backgroundColor: meta.dot }} />
      {meta.label}
    </span>
  );
}
