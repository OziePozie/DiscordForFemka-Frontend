import heroes from '@/lib/dota/heroes.json';

interface Props {
  heroId: number;
  size?: number;
  /** Явные размеры (px). Если заданы — переопределяют квадратный size. */
  width?: number;
  height?: number;
  className?: string;
}

const HERO_MAP = heroes as Record<string, string>;
const CDN = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/';

export function HeroIcon({ heroId, size = 32, width, height, className }: Props) {
  const w = width ?? size;
  const h = height ?? size;
  const internal = HERO_MAP[String(heroId)];
  if (!internal) {
    return (
      <div
        className={`bg-muted rounded ${className ?? ''}`}
        style={{ width: w, height: h }}
        aria-label={`Hero ${heroId}`}
      />
    );
  }
  return (
    <img
      src={`${CDN}${internal}.png`}
      alt={internal}
      width={w}
      height={h}
      loading="lazy"
      className={`rounded object-cover ${className ?? ''}`}
    />
  );
}
