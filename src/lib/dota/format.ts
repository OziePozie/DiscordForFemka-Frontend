import heroes from '@/lib/dota/heroes.json';

const HERO_MAP = heroes as Record<string, string>;

export function formatGameTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '—';
  const sign = seconds < 0 ? '-' : '';
  const abs = Math.abs(Math.trunc(seconds));
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${sign}${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Human-readable hero name from a hero id, derived from the internal slug
 * (e.g. 1 → "Anti-Mage"-ish "Antimage"). Falls back to `Hero <id>` when unknown.
 */
export function heroName(heroId: number): string {
  const slug = HERO_MAP[String(heroId)];
  if (!slug) return `Hero ${heroId}`;
  return slug
    .split('_')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}
