# Спека: фронт-колокольчик уведомлений (Editorial Clean)

Дата: 2026-07-11
Статус: утверждена (дизайн)
Репозиторий: DiscordForFemka-Frontend
Парная бэкенд-спека: `DiscordForFemka/docs/superpowers/specs/2026-07-11-platform-notifications-design.md`
Бэкенд уже смержен (PR #80): эндпоинты `/api/v1/notifications/**` + SSE-стрим доступны.

## Задача

Иконка-колокольчик в шапке рядом с профилем: бейдж непрочитанных, выпадающий
список уведомлений, доставка новых в реальном времени по SSE. Два типа уведомлений
приходят с бэка: `MATCH_READY_CHECK` (капитану — соперник готов) и `MATCH_LIVE`
(игрокам — матч их команды начался).

## Утверждённые UX-решения

- **Отметка прочитанным — по-элементная + «прочитать все».** Клик по уведомлению →
  переход по его `link` + пометка этого одного прочитанным. Отдельная кнопка
  «Прочитать все». Непрочитанные остаются визуально подсвечены, пока их не тронут
  (открытие колокольчика само по себе НЕ обнуляет счётчик).
- **Toast + бейдж при SSE-приходе.** Новое уведомление по SSE показывает короткий
  toast (существующая toast-система) и инкрементит бейдж; если выпадашка открыта —
  добавляется в начало списка.

## Стек (из осмотра репо)

React 18 + Vite + TypeScript, React Router 6, **@tanstack/react-query** (канон для
server-state), Radix UI (`@radix-ui/react-dropdown-menu`), **lucide-react** (иконки),
дизайн-система **Editorial Clean** (`ec-*` классы + токены `ink`/`line`/`brand`/`live`
в `tailwind.config.ts` и `src/index.css`). Своя toast-система
(`src/components/ui/use-toast.ts`). API-клиент `src/lib/api/client.ts` — `api<T>()`
с `credentials:'include'` и CSRF-заголовком `X-XSRF-TOKEN`. Типы генерятся
`npm run gen:types` из `docs/contracts/openapi.yaml` в `src/lib/api/types.gen.ts`.
SSE/EventSource в репо ещё нет — это первый.

## Контракт (первый шаг, без него нет типов)

Фронтовый `docs/contracts/openapi.yaml` пока **не содержит** notification-путей.
Перенести **точечно** (не копировать файл целиком — контракты бэка/фронта исторически
расходятся) 5 путей `/api/v1/notifications/**` и схемы `NotificationDto` +
`NotificationType` из бэкенд-контракта, затем `npm run gen:types`. После этого в
`types.gen.ts` появятся `NotificationDto`, `NotificationType` и параметры/ответы.

`NotificationDto`: `{ id: uuid, type: 'MATCH_READY_CHECK'|'MATCH_LIVE', title, body,
link: string|null, matchId: uuid|null, read: boolean, createdAt: string }`.

## Слои фронта

Следуем существующим конвенциям: fetch-обёртки в `endpoints.ts`, RQ-хуки в
`queries.ts` (с `qk`-ключами и инвалидацией), UI-компоненты в `src/components`.

### 1. API-обёртки (`src/lib/api/endpoints.ts`)
- `getNotifications(page, size)` → `GET /api/v1/notifications?page=&size=` (страница `NotificationDto`)
- `getUnreadCount()` → `GET /api/v1/notifications/unread-count` → `{ count: number }`
- `markNotificationRead(id)` → `POST /api/v1/notifications/{id}/read` (204)
- `markAllNotificationsRead()` → `POST /api/v1/notifications/read-all` (204)

Все через `api()` (куки + CSRF уже внутри). Пагинацию читаем так же, как соседние
list-эндпоинты (обёртка `Page`).

### 2. RQ-хуки (`src/lib/queries.ts`)
- `qk.notifications` / `qk.notificationsUnread` / `qk.notificationsList(params)` — ключи.
- `useUnreadCount()` — `enabled: isAuthenticated`. Значение поддерживается SSE; как
  фолбэк-страховка допускается мягкий `refetchInterval` (напр. 120с, пауза в фоне) на
  случай пропущенного SSE — но основной канал это SSE, не поллинг.
- `useNotifications(params)` — список, `enabled` когда выпадашка открыта.
- `useMarkNotificationRead()` — мутация: оптимистично уменьшить `unread-count` и
  пометить элемент `read` в кэше списка; `onSettled` — инвалидация обоих ключей.
- `useMarkAllNotificationsRead()` — мутация: `unread-count` → 0, все элементы списка
  `read: true`; `onSettled` — инвалидация.

### 3. SSE-канал (`src/lib/notifications/useNotificationStream.ts` + провайдер)
- Хук/провайдер, монтируемый один раз на уровне приложения (в аутентифицированной
  ветке — напр. внутри Header или отдельного `NotificationsProvider` в дереве под
  проверкой `isAuthenticated`).
- Открывает `new EventSource('/api/v1/notifications/stream', { withCredentials: true })`
  (в dev идёт через vite-proxy `/api`, куки того же origin проходят; в prod nginx
  проксирует `/api`).
- На событие `notification`: `JSON.parse(e.data)` как `NotificationDto` →
  (а) `toast({ title, description: body })`;
  (б) обновить кэш RQ: инкремент `unread-count` (`setQueryData`) и, если список
  закэширован, добавить элемент в начало первой страницы (иначе просто
  `invalidateQueries` списка).
- `onopen` (в т.ч. после авто-reconnect браузера) → `invalidateQueries(unread-count)`
  для ре-синхронизации пропущенного за разрыв.
- `onerror` — ничего не делаем руками: `EventSource` сам переподключается; логировать
  в dev. Закрывать поток при размонтировании и при выходе (`!isAuthenticated`).
- Гейт: поток открывается только когда `isAuthenticated`.

### 4. Колокольчик (`src/components/NotificationBell.tsx`)
- Кнопка с иконкой `Bell` (lucide) + бейдж непрочитанных (зеркалит паттерн
  `pendingInviteCount` в `Header.tsx`: `<Badge>` при `count > 0`, число; при `>99` —
  «99+»). Стиль: `text-ink`, круглая, `focus-visible:ring-2 focus-visible:ring-ring`.
- Radix `DropdownMenu`: контент шапка «Уведомления» + кнопка «Прочитать все»
  (видна/активна при `count > 0`), затем список из `useNotifications`.
- Элемент списка: иконка по `type` (ready-check → напр. `Swords`/`Clock`, live →
  `Radio`/`Play`; из lucide), `title` (полужирный), `body` (приглушённый `ink-muted`),
  относительное время (`createdAt`). Непрочитанные — подсветка (напр. точка `ec-dot`
  цвета `brand` слева и/или фон `accent`). Клик → `markRead(id)` + `navigate(link)`
  (если `link` есть) + закрыть выпадашку.
- Состояния: загрузка (скелет/спиннер), пусто («Пока нет уведомлений»), ошибка
  (тихий fallback-текст). Ограничить показ первой страницей (size 20);
  «Показать все» — опционально, вне MVP (YAGNI).
- Относительное время: использовать существующий util дат, если есть; иначе тонкая
  обёртка над `Intl.RelativeTimeFormat('ru')`.

### 5. Встраивание в шапку (`src/components/Header.tsx`)
- Вставить `<NotificationBell />` в правый флекс-контейнер шапки **перед** дропдауном
  аватара, только когда `isAuthenticated` (рядом с тем же гейтом, что у приглашений).

## Верификация

В репо нет unit-раннера (скрипты: dev/build/preview/gen:types). Поэтому гейты:
- `npm run gen:types` — контракт → типы без ошибок; `NotificationDto`/`NotificationType`
  присутствуют в `types.gen.ts`.
- `npm run build` (= `tsc -b && vite build`) — строгая типизация и сборка зелёные.
- Ручная проверка через dev-сервер против стейджа/прод-API (`VITE_API_TARGET`): бейдж
  из `unread-count`, открытие списка, отметка прочитанным (по-элементно и «все»),
  переход по клику. SSE — проверяется на реальном событии (создание/старт матча) либо
  вручную дёрнув эндпоинт; при недоступности SSE счётчик всё равно грузится REST-ом.

## Не входит (YAGNI)
- Бесконечная прокрутка/пагинация в выпадашке (только первая страница).
- Настройки/фильтры типов уведомлений.
- «Пометить непрочитанным», группировка, звук.
- Мобильная адаптация сверх того, что даёт существующая шапка (наследуем её поведение).

## Ops-напоминание (деплой, вне кода фронта)
Для SSE nginx фронта на локейшене `/api/v1/notifications/stream` требует
`proxy_buffering off;` и `proxy_read_timeout` > 25с (хартбит бэка — 25с). Без этого
поток буферизуется/рвётся; REST-фолбэк (`unread-count`) продолжает работать.
