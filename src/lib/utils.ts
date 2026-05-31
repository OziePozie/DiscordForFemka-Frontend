import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the trimmed URL only if it uses the http(s) scheme; otherwise null.
 * Guards against XSS via `javascript:` / `data:` URLs that React does not
 * sanitize when used as an `<a href>`. Use before rendering any admin-supplied
 * URL as a link.
 */
export function safeHttpUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    ? trimmed
    : null;
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diffSec = Math.floor((Date.now() - then) / 1000);
  if (diffSec < 60) return `${diffSec} сек назад`;
  const m = Math.floor(diffSec / 60);
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} дн назад`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} мес назад`;
  const y = Math.floor(mo / 12);
  return `${y} г назад`;
}

/**
 * Convert a backend ISO-UTC timestamp to a value usable in
 * <input type="datetime-local">. Returns "" for null/undefined/invalid.
 * The output is in the user's local timezone with minute precision.
 */
export function formatDateTimeLocal(
  iso: string | null | undefined,
): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

/**
 * Convert a <input type="datetime-local"> value (local timezone, no zone
 * info) into an ISO-8601 UTC string for the backend. Returns null when
 * the input is empty or unparseable.
 */
export function parseLocalDateTime(local: string | null | undefined): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
