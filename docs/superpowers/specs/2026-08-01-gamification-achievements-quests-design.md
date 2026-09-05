# Конструктор достижений и квестов — Frontend

Дата: 2026-08-01. Статус: одобрено (продолжение бэкенда, без отдельного брейнштрома —
продуктовые решения уже зафиксированы в бэкенд-спеке и скриншоте-мокапе пользователя).

Backend уже реализован и запушен как [PR #111](https://github.com/OziePozie/DiscordForFemka/pull/111)
в `DiscordForFemka` (ещё не смёржен в master). Бэкенд-спека:
`docs/superpowers/specs/2026-08-01-achievements-quests-design.md` в репо `DiscordForFemka`.
Это чисто фронтовая фича — потребляет уже готовый REST API.

## Проблема

Админ создаёт достижения (платформенные) и квесты (для конкретного турнира) через веб-UI:
название, описание, список условий (пока — пул героев команды N-из-5, обязательная победа),
жизненный цикл DRAFT→PUBLISHED→ARCHIVED. Пулы героев задаются отдельно, переиспользуются
между достижениями и квестами (см. мокап пользователя — отдельная вкладка "Группы героев").
Игрок видит полученные достижения на своём публичном профиле.

## API-контракт (уже существует на бэкенде, `docs/contracts/openapi.yaml` в этом репо
устарел относительно него — см. секцию «Типы» ниже)

| Метод | Путь | Пагинация |
|---|---|---|
| GET/POST | `/api/v1/admin/hero-groups` | да |
| PATCH/DELETE | `/api/v1/admin/hero-groups/{id}` | — |
| GET | `/api/v1/dota/heroes` | нет (справочник, ~130 записей) |
| GET/POST | `/api/v1/admin/achievements` | да |
| PATCH | `/api/v1/admin/achievements/{id}` | — |
| PUT | `/api/v1/admin/achievements/{id}/conditions` | — |
| POST | `/api/v1/admin/achievements/{id}/publish` | — |
| POST | `/api/v1/admin/achievements/{id}/archive` | — |
| GET/POST | `/api/v1/admin/tournaments/{tournamentId}/quests` | да |
| PATCH | `/api/v1/admin/quests/{id}` | — |
| PUT | `/api/v1/admin/quests/{id}/conditions` | — |
| POST | `/api/v1/admin/quests/{id}/publish` | — |
| POST | `/api/v1/admin/quests/{id}/archive` | — |
| GET | `/api/v1/players/{playerId}/achievements` | нет |

DTO-формы (точно как в бэкенде):

```ts
type ConditionType = 'HERO_POOL' | 'WIN_REQUIRED';
type GamificationStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

interface ConditionRowDto { type: ConditionType; heroGroupId?: string | null; minPlayers?: number | null; }
interface HeroGroupDto { id: string; name: string; heroIds: number[]; }
interface DotaHeroDto { id: number; name: string; }
interface AchievementDto { id: string; name: string; description?: string | null; status: GamificationStatus; conditions: ConditionRowDto[]; }
interface QuestDto { id: string; tournamentId: string; name: string; description?: string | null; status: GamificationStatus; conditions: ConditionRowDto[]; }
interface PlayerAchievementDto { achievementId: string; name: string; description?: string | null; timesEarned: number; lastEarnedAt?: string | null; }
```

Списки (`GET .../hero-groups`, `.../achievements`, `.../tournaments/{id}/quests`) отдают
`PagedResponse<T>` (items/page/size/totalItems/totalPages) — уже есть тип в `types.ts`.

## Архитектура

Три новых экрана + одна встройка в существующий:

1. **`/admin/hero-groups`** — новая страница, flat CRUD по образцу `AdminSeasonsPage.tsx`.
2. **`/admin/achievements`** — новая страница, тот же CRUD-каркас + встроенный конструктор
   условий.
3. **Квесты турнира** — НЕ отдельная страница/роут. Встраивается как диалог по клику на
   кнопку "Квесты" в строке турнира `AdminTournamentsPage.tsx`, по образцу существующих
   `GroupEditDialogBody`/`TeamRequestsDialogBody` (в этом репо нет отдельного
   `/admin/tournaments/:id` роута — все per-турнирные операции живут как диалоги на строке
   таблицы, ломать эту конвенцию ради одной фичи не стоит).
4. **Профиль игрока** — новая карточка "Достижения" в `PlayerPublicPage.tsx`, в общем стеке
   карточек (после Matches, рядом с "История турниров"/"Команды"/"MMR").

Два переиспользуемых компонента:

- **`ConditionBuilder`** (`src/components/admin/ConditionBuilder.tsx`) — список строк-условий
  (тип + параметры), общий для форм Achievement и Quest. Добавление/удаление строк, тип
  через `Select` (`HERO_POOL`/`WIN_REQUIRED`), для `HERO_POOL` — `Select` группы героев +
  `Input type=number` для `minPlayers`.
- **`HeroMultiPicker`** (`src/components/admin/HeroMultiPicker.tsx`) — сетка тайлов
  `HeroIcon` (уже есть в репо) с чекбокс-тогглом по клику + текстовый фильтр по имени.
  Ручная реализация (не shadcn `Command`/`Popover`) — в репо нет ни одного, ни другого
  примитива, и общий стиль репо тяготеет к простым самодельным виджетам, а не к добавлению
  новых shadcn-зависимостей ради одной фичи (см. `broadcasterAccountIds` — обычный
  CSV-`Input`, не пикер).

## Типы (`src/lib/api/types.ts`)

`openapi.yaml` в этом репо не синхронизирован с ещё не смёрженным бэкенд-PR. По
существующей в репо конвенции (`AuditLogDto`, `AdminLobbyDto`, `CreateSeasonRequest` и
т.д.) — не ждём regen, добавляем ручные `interface` с комментарием
`// TODO: regenerate openapi — <path>` над каждым. Один раз бэкенд смёржен и
`npm run gen:types` прогнан — эти ручные интерфейсы схлопываются в реэкспорты из
`components['schemas']`, как у остальных типов в файле; отдельная задача, не в этом плане.

## Данные и состояние

- Все мутации — `useMutation` + `onSuccess: invalidate...Caches(qc)` по образцу
  `useCreateSeason`/`useUpdateSeason` (см. `invalidateSeasonCaches` и соседей).
- Пагинация — серверная (query `page`/`size` в `qk`), по образцу `AdminSeasonsPage`, не
  клиентский `.slice()` (это исключение `AdminTournamentsPage` вызвано тем, что бэкенд
  отдаёт турниры турнира встроенными в season details — здесь свой полноценный paged
  эндпоинт, серверная пагинация уместна).
- Валидация форм — как везде в репо: синхронная `validateForm()` → `string | null`, ошибка
  через `toast({variant:'destructive'})`, без react-hook-form/zod (в репо их нет и не будет
  ради этой фичи).
- Роли: в этом репо нет разделения MODERATOR/ADMIN в навигации — весь admin-nav виден любому
  staff. Бэкенд гейтит hero-groups/achievements/quests write-эндпоинты строго ADMIN (строже
  MODERATOR-or-ADMIN дефолта). Фронт не скрывает пункты меню от MODERATOR — если он попробует
  писать, увидит стандартный 403-тост через существующий `ProblemDetailError`-обработчик. Это
  осознанное решение, не баг: городить новую роль-специфичную видимость меню ради одной фичи
  не стоит, паттерна для этого в репо ещё нет.

## Тестирование

В репо нет тест-харнеса для страниц (подтверждено на бэкенд-фиче `admin-lobby-viewer`).
Проверка — `tsc -b` (через `npm run build`) на каждом шаге + финальный ручной смоук-прогон
в браузере (dev-сервер) перед PR: создать группу героев, создать достижение с условиями
`WIN_REQUIRED`+`HERO_POOL`, опубликовать, открыть квесты турнира и повторить то же самое,
открыть профиль игрока (пустой список — ок, бэкенд ещё не смёржен, значит данных не будет,
важно что карточка не падает и корректно показывает пустое состояние).

## Границы

- Регенерация `openapi.yaml`/`types.gen.ts` под реальный смёрженный контракт — отдельная
  задача после мёржа бэкенд-PR, не блокирует эту фичу.
- Ролевое разделение MODERATOR/ADMIN в UI — не делаем (см. выше).
- Item-условия (предмет в инвентаре) — на бэкенде отложены, здесь конструктор строится
  расширяемым (тип условия — просто ещё один `Select`-option + ветка параметров в
  `ConditionBuilder`), но новый тип условия не добавляем.
- Уведомления о получении достижения — не в этой фиче (бэкенд их тоже не шлёт, см.
  бэкенд-спеку).

## Затрагиваемые файлы

**Новые:**
- `src/components/admin/ConditionBuilder.tsx`
- `src/components/admin/HeroMultiPicker.tsx`
- `src/pages/admin/AdminHeroGroupsPage.tsx`
- `src/pages/admin/AdminAchievementsPage.tsx`

**Изменённые:**
- `src/lib/api/types.ts` (+ручные DTO, TODO-комментарии)
- `src/lib/api/endpoints.ts` (+функции по всем эндпоинтам из таблицы выше)
- `src/lib/queries.ts` (+`qk`-записи, query/mutation-хуки)
- `src/App.tsx` (+2 роута: `/admin/hero-groups`, `/admin/achievements`)
- `src/pages/admin/AdminLayout.tsx` (+2 пункта `NAV`)
- `src/pages/admin/AdminTournamentsPage.tsx` (+кнопка "Квесты" на строке турнира,
  `QuestsDialogBody`, использует `ConditionBuilder`)
- `src/pages/PlayerPublicPage.tsx` (+карточка "Достижения")
