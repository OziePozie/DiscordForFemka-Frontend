# Админ-меню матча в ячейке турнирной сетки

Дата: 2026-06-11
Статус: согласовано
Репозиторий: DiscordForFemka-Frontend (фронтенд)

## Проблема / цель

Чтобы отредактировать матч (настройки лобби, результат, перенос команд, лобби и т.д.),
админу/модератору сейчас нужно идти в отдельную страницу `AdminMatchesPage`. Хотим
быстрый доступ ко **всем** админским действиям матча прямо из ячейки турнирной сетки.

## Контекст (что уже есть)

- Бэкенд: полный админский API матча `/api/v1/admin/matches/{id}` (PATCH update,
  `finish`, `tech-result`, `cancel-result`, `move-teams`, `format`, `repropagate`,
  `lobby/recreate`, `lobby/launch`, `reset-ready`/`create`). Гейт `MODERATOR/ADMIN`
  (часть lobby-действий — только `ADMIN`).
- Фронт: `AdminMatchesPage.tsx` уже содержит меню действий + 10 диалогов
  (`DialogState`: settings, recreate, launch, reset-ready, finish, repropagate, tech,
  cancel, move, format) с формами, хендлерами и мутациями
  (`useUpdateAdminMatch/useFinishMatch/useMoveMatchTeams/useChangeMatchFormat/`
  `useRecreateLobby/useLaunchLobby/useTechResultMatch/useCancelMatchResult/`
  `useRepropagateMatch`). Но всё «вшито» в страницу списка.
- Есть `@radix-ui/react-dropdown-menu` (ui-обёртка) и `useMe()` с ролями
  (`PlayerRole[]`).
- Сетка рендерится в `TournamentDetailsPage.tsx` → `RoundColumns`; ячейка несёт
  `cell.match: MatchDto | undefined`.

## Согласованные решения

1. **Скоуп действий:** ВСЕ админские действия матча (весь набор из `AdminMatchesPage`).
2. **Взаимодействие:** иконка ⋯ на ячейке → выпадающее меню действий; пункт открывает
   тот же диалог, что и в админке.
3. **Где:** на обычной (публичной) вкладке «Сетка» страницы турнира; иконка рендерится
   только если `useMe()` роль ∈ {MODERATOR, ADMIN}. Обычные юзеры ничего не видят.
4. **Только реальные матчи:** иконка только у ячеек, где `cell.match` существует
   (placeholder-ячейки не редактируются).

## Дизайн (подход A — вынести переиспользуемый компонент)

Рассмотренные альтернативы: (B) вынести только диалоги + отдельные триггеры — больше
склейки; (C) продублировать лёгкое меню в ячейке — дублирует 10 диалогов, отклонено.

### 1. Новый компонент `MatchAdminMenu`

`src/components/MatchAdminMenu.tsx`. Props `{ match: MatchDto }`. Самодостаточный:
- триггер — компактный ⋯ `DropdownMenu` со всеми действиями;
- собственный `dialog`-стейт (union из `AdminMatchesPage`), формы (`SettingsForm`,
  `FinishForm`, `TechForm`, move-форма), хендлеры и мутации — переносятся из
  `AdminMatchesPage` как есть;
- ADMIN-only пункты (lobby recreate/launch) показываются по роли (через `useMe()`),
  бэк всё равно гейтит.

### 2. Рефакторинг `AdminMatchesPage`

Заменить встроенное меню + блок диалогов на `<MatchAdminMenu match={m} />` в каждой
строке. Поведение идентично; файл заметно сокращается (логика диалогов уходит в
компонент). Не-связанный рефакторинг не делаем.

### 3. Интеграция в ячейку сетки

В `RoundColumns` (внутри `TournamentDetailsPage.tsx`): если `cell.match` есть И текущий
пользователь админ/мод — рендерим `<MatchAdminMenu match={cell.match} />` в углу ячейки.
Роль берём из `useMe()` (хук вызывается на уровне `BracketTab`/`RoundColumns`, не в
цикле). Иначе — ничего.

### 4. Инвалидация кэша

Админские мутации сейчас инвалидируют список матчей. Добавляем инвалидацию
`qk.bracket(match.tournamentId)` (и, где уместно, деталей матча), чтобы ячейка/сетка
обновлялись сразу после правки. Реализация — в `onSuccess` соответствующих хуков в
`queries.ts` (там, где есть `tournamentId`), либо точечно в `MatchAdminMenu`.

### 5. Доступ / безопасность

Фронт прячет меню не-админам; бэкенд независимо гейтит `MODERATOR/ADMIN` (и `ADMIN` для
lobby). Раскрытие в публичной странице безопасно: без прав сервер вернёт 403.

### 6. Бэкенд

Изменений не требуется — все эндпоинты уже существуют.

## Edge cases

- Ячейка с реальным матчем, но без команд в слотах (полузаполненный shell): меню
  доступно (move-teams/settings имеют смысл); действия, требующие команд (finish),
  ведут себя как в текущей админке.
- Grand Final / LB / placeholder: меню только там, где `cell.match` не null.
- Гость/обычный игрок: `useMe()` без нужной роли → меню не рендерится.

## Затрагиваемые файлы

- Новый: `src/components/MatchAdminMenu.tsx`.
- Изменяются: `src/pages/admin/AdminMatchesPage.tsx` (использует новый компонент),
  `src/pages/TournamentDetailsPage.tsx` (`RoundColumns` рендерит меню для админа),
  `src/lib/queries.ts` (инвалидация `qk.bracket`).

## Проверка

В репо фронта нет тест-раннера (только `npm run build`). Верификация:
- `npm run build` (`tsc -b` + vite) — типобезопасность по всему проекту;
- ручной смок: под админом из вкладки «Сетка» открыть меню ячейки, прогнать
  ключевые действия (настройки, результат, перенос команд) и убедиться, что ячейка
  обновляется; под обычным юзером — меню отсутствует.
