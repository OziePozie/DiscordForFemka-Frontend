import { ProblemDetailError, type ErrorReason } from './client';

/**
 * Приведение любой пойманной ошибки к тому, что можно показать пользователю.
 *
 * Бэкенд для пользовательских потоков (создание команды, регистрация на турнир,
 * заявки на матч) уже присылает русский `detail` и разложенные `reasons[]`, так
 * что словарь ниже нужен не для перевода, а для случаев, когда своя формулировка
 * точнее в конкретном месте интерфейса, и как страховка на старых ответах.
 */
const CODE_MESSAGE: Record<string, string> = {
  PLATFORM_ACCOUNT_INACTIVE: 'Аккаунт не активен',
  PLATFORM_TEAM_INACTIVE: 'Команда не активна',
  PLATFORM_NOT_TEAM_CAPTAIN: 'Действие доступно только капитану команды',
  PLATFORM_REGISTRATION_NOT_OPEN: 'Регистрация на турнир сейчас закрыта',
  PLATFORM_REGISTRATION_WINDOW_CLOSED: 'Приём заявок завершён',
  PLATFORM_ALREADY_REGISTERED: 'Команда уже зарегистрирована на этот турнир',
  PLATFORM_TOURNAMENT_FULL: 'Свободных мест на турнире не осталось',
  PLATFORM_TOURNAMENT_ALREADY_STARTED: 'Турнир уже начался',
  PLATFORM_NOT_AUTHENTICATED: 'Нужно войти',
  PLATFORM_FORBIDDEN: 'Недостаточно прав',
  PLATFORM_NOT_FOUND: 'Не найдено',
  PLATFORM_RATE_LIMITED: 'Слишком часто — попробуйте позже',
  PLATFORM_PAYLOAD_TOO_LARGE: 'Файл слишком большой',
  PLATFORM_UNSUPPORTED_MEDIA_TYPE: 'Неподдерживаемый формат файла',
  PLATFORM_INTERNAL_ERROR: 'Внутренняя ошибка сервера',
};

export interface DescribedError {
  /** Короткий заголовок — для тоста. */
  title: string;
  /** Подробность под заголовком; пусто, когда добавить нечего. */
  description?: string;
  /** Поводы отказа, каждый с готовым текстом. */
  reasons: ErrorReason[];
  code?: string;
  status?: number;
}

export function describeError(e: unknown): DescribedError {
  if (e instanceof ProblemDetailError) {
    const reasons = e.reasons ?? [];
    const known = CODE_MESSAGE[e.code];
    // Русский detail с бэка точнее словаря — в нём уже подставлены числа.
    const title = e.detail ?? known ?? e.title;
    return {
      title,
      // Причины показываются отдельным списком, дублировать их в description незачем.
      description: reasons.length > 0 ? undefined : known && known !== title ? known : undefined,
      reasons,
      code: e.code,
      status: e.status,
    };
  }
  if (e instanceof Error) return { title: e.message, reasons: [] };
  return { title: 'Неизвестная ошибка', reasons: [] };
}

/** Одна строка для мест, где список не помещается (тост, подпись под кнопкой). */
export function errorLine(e: unknown): string {
  const d = describeError(e);
  if (d.reasons.length === 0) return d.title;
  return `${d.title}: ${d.reasons.map((r) => r.message).join('; ')}`;
}
