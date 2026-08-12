/**
 * Тонкая типизированная обёртка над window.Telegram.WebApp.
 * Скрипт telegram-web-app.js подключается в tg.html; вне Telegram объект
 * отсутствует — все геттеры это учитывают и возвращают null/undefined.
 */

export interface TelegramWebApp {
  initData: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  ready(): void;
  expand(): void;
  close(): void;
  BackButton: {
    show(): void;
    hide(): void;
    onClick(cb: () => void): void;
    offClick(cb: () => void): void;
  };
  HapticFeedback?: {
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  };
  onEvent(event: string, cb: () => void): void;
  offEvent(event: string, cb: () => void): void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function webApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

/** Сырая initData-строка; пустая, если страницу открыли вне Telegram. */
export function getInitData(): string {
  return webApp()?.initData ?? '';
}

export function isInsideTelegram(): boolean {
  return getInitData().length > 0;
}
