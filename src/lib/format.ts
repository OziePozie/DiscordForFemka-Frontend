const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * "Обновлено N дней назад" — простой плюрализатор без зависимостей.
 * Аргумент — ISO-строка или Date; null/undefined возвращает null.
 */
export function timeAgoRu(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;

  const sec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (sec < MINUTE) return 'только что';
  if (sec < HOUR) {
    const n = Math.floor(sec / MINUTE);
    return `${n} ${pluralRu(n, 'минуту', 'минуты', 'минут')} назад`;
  }
  if (sec < DAY) {
    const n = Math.floor(sec / HOUR);
    return `${n} ${pluralRu(n, 'час', 'часа', 'часов')} назад`;
  }
  if (sec < MONTH) {
    const n = Math.floor(sec / DAY);
    return `${n} ${pluralRu(n, 'день', 'дня', 'дней')} назад`;
  }
  if (sec < YEAR) {
    const n = Math.floor(sec / MONTH);
    return `${n} ${pluralRu(n, 'месяц', 'месяца', 'месяцев')} назад`;
  }
  const n = Math.floor(sec / YEAR);
  return `${n} ${pluralRu(n, 'год', 'года', 'лет')} назад`;
}

function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
