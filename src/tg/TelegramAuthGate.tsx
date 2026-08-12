import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { telegramInit } from '@/lib/api/endpoints';
import { ProblemDetailError } from '@/lib/api/client';
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
        text={authErrorText(q.error)}
        detail={errorDetail(q.error)}
      />
    );
  }

  if (q.data?.status === 'UNLINKED') {
    return <ClaimPage telegramUsername={q.data.telegramUsername ?? null} />;
  }

  return <>{children}</>;
}

/**
 * Ошибки входа различаются по причине, и общее «попробуйте ещё раз» скрывает
 * как раз те случаи, где нужно действие администратора (не тот бот, не задан
 * токен), а не повторный запуск.
 */
function authErrorText(error: unknown): string {
  if (!(error instanceof ProblemDetailError)) {
    return 'Сервер недоступен. Попробуйте позже.';
  }
  if (error.status === 500) {
    return 'Приложение не настроено на стороне сервера — сообщите администрации.';
  }
  if (error.detail?.includes('signature mismatch')) {
    return 'Подпись Telegram не совпала: приложение открыто не от того бота, к которому подключён сайт. Сообщите администрации.';
  }
  if (error.detail?.includes('stale')) {
    return 'Данные входа устарели. Закройте приложение и откройте заново.';
  }
  if (error.status === 403) {
    return 'Доступ к этому профилю закрыт.';
  }
  return 'Telegram не подтвердил вход. Закройте приложение и откройте его заново.';
}

function errorDetail(error: unknown): string | undefined {
  if (!(error instanceof ProblemDetailError)) return undefined;
  return `${error.code} · ${error.detail ?? error.title}`;
}

function Notice({
  title,
  text,
  detail,
}: {
  title: string;
  text: string;
  detail?: string;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="ec-display text-2xl text-ink">{title}</h1>
      <p className="mt-3 text-sm text-ink-muted">{text}</p>
      {detail && <p className="ec-num mt-4 text-xs text-ink-faint">{detail}</p>}
    </div>
  );
}
