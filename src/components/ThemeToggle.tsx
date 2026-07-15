import { useTheme } from '@/lib/theme';

const HERO_CDN =
  'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/';

// Phoenix — «солнечная» птица для перехода в светлую тему,
// Night Stalker — «ночной» герой для перехода в тёмную.
const HERO = {
  toLight: { name: 'phoenix', label: 'Включить светлую тему (Phoenix)' },
  toDark: { name: 'night_stalker', label: 'Включить тёмную тему (Night Stalker)' },
} as const;

/**
 * Тумблер темы в шапке в виде портрета героя Dota. Клик переключает
 * light ↔ dark и фиксирует явный выбор (перекрывая системную настройку).
 * Показываем героя той темы, на которую переключимся.
 */
export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const hero = isDark ? HERO.toLight : HERO.toDark;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={hero.label}
      title={hero.label}
      className="group inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ring-2 ring-line transition hover:ring-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <img
        src={`${HERO_CDN}${hero.name}.png`}
        alt=""
        width={40}
        height={40}
        className="h-full w-full scale-110 object-cover object-center transition-transform group-hover:scale-125"
      />
    </button>
  );
}
