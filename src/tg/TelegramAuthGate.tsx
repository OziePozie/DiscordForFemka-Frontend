import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { telegramInit } from '@/lib/api/endpoints';
import { getInitData, isInsideTelegram } from './lib/telegram';
import ClaimPage from './pages/ClaimPage';

export const tgQk = {
  init: ['tg', 'init'] as const,
};

/**
 * Аутентифицирует Mini App при каждом открытии: cookie сессии в вебвью
 * ненадёжна (iOS чистит хранилище между запусками), а initData Telegram
 * выдаёт заново на каждый запуск, поэтому повторный вызов дешевле проверок.
 */
export default function TelegramAuthGate({ children }: { children: ReactNode }) {
  const initData = getInitData();
  const q = useQuery({
    queryKey: tgQk.init,
    queryFn: () => telegramInit(initData),
    enabled: isInsideTelegram(),
    retry: 1,
    staleTime: Infinity,
  });

  if (!isInsideTelegram()) {
    return (
      <Notice
        title="Откройте в Telegram"
        text="Это мини-приложение работает только внутри Telegram — запустите его через кнопку в чате бота."
      />
    );
  }

  if (q.isLoading) {
    return <Notice title="Входим…" text="Проверяем данные Telegram." />;
  }

  if (q.isError) {
    return (
      <Notice
        title="Не удалось войти"
        text="Telegram не подтвердил вход. Закройте приложение и откройте его заново."
      />
    );
  }

  if (q.data?.status === 'UNLINKED') {
    return <ClaimPage telegramUsername={q.data.telegramUsername ?? null} />;
  }

  return <>{children}</>;
}

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="ec-display text-2xl text-ink">{title}</h1>
      <p className="mt-3 text-sm text-ink-muted">{text}</p>
    </div>
  );
}
