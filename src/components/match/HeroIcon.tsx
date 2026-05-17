import heroes from '@/lib/dota/heroes.json';

interface Props {
  heroId: number;
  size?: number;
  className?: string;
}

const HERO_MAP = heroes as Record<string, string>;
const CDN = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/';

export function HeroIcon({ heroId, size = 32, className }: Props) {
  const internal = HERO_MAP[String(heroId)];
  if (!internal) {
    return (
      <div
        className={`bg-muted rounded ${className ?? ''}`}
        style={{ width: size, height: size }}
        aria-label={`Hero ${heroId}`}
      />
    );
  }
  return (
    <img
      src={`${CDN}${internal}.png`}
      alt={internal}
      width={size}
      height={size}
      loading="lazy"
      className={`rounded ${className ?? ''}`}
    />
  );
}
