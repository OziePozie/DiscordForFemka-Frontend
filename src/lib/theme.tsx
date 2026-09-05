import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

/**
 * Инлайн-скрипт в index.html выставляет класс .dark до первой отрисовки,
 * поэтому здесь мы лишь читаем сохранённый выбор и держим DOM в синхроне.
 */
function readStoredTheme(): Theme {
  if (typeof localStorage === 'undefined') return 'system';
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === 'light' || raw === 'dark' || raw === 'system'
    ? raw
    : 'system';
}

function systemPrefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

function resolve(theme: Theme): ResolvedTheme {
  if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return theme;
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
}

interface ThemeContextValue {
  /** Выбор пользователя: light / dark / system. */
  theme: Theme;
  /** Фактически применённая тема с учётом системной настройки. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  /** Переключить между light и dark (фиксирует явный выбор). */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolve(readStoredTheme()),
  );

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next);
    }
    const resolved = resolve(next);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  // Следим за системной темой, пока выбор == 'system'.
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const resolved = resolve('system');
      setResolvedTheme(resolved);
      applyTheme(resolved);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  // Синхронизация между вкладками.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = readStoredTheme();
      setThemeState(next);
      const resolved = resolve(next);
      setResolvedTheme(resolved);
      applyTheme(resolved);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
