import items from '@/lib/dota/items.json';

interface Props {
  itemId: number;
  size?: number;
  className?: string;
}

const ITEM_MAP = items as Record<string, string>;
const CDN = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/items/';

export function ItemIcon({ itemId, size = 24, className }: Props) {
  if (itemId === 0) {
    return (
      <div
        className={`bg-muted/30 rounded-sm ${className ?? ''}`}
        style={{ width: size, height: size * 0.75 }}
        aria-hidden
      />
    );
  }
  const internal = ITEM_MAP[String(itemId)];
  if (!internal) {
    return (
      <div
        className={`bg-muted rounded-sm ${className ?? ''}`}
        style={{ width: size, height: size * 0.75 }}
        aria-label={`Item ${itemId}`}
      />
    );
  }
  return (
    <img
      src={`${CDN}${internal}_lg.png`}
      alt={internal}
      width={size}
      height={size * 0.75}
      loading="lazy"
      className={`rounded-sm ${className ?? ''}`}
    />
  );
}
