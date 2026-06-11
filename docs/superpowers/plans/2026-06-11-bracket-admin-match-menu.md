# Bracket Admin Match Menu — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Дать админу/модератору быстрый доступ ко всем админским действиям матча прямо из ячейки турнирной сетки.

**Architecture:** Извлекаем «на матч» админский контрол из `AdminMatchesPage` в самодостаточный компонент `MatchAdminMenu({ match })` (⋯-dropdown + 10 диалогов + формы + мутации). Переиспользуем его в `AdminMatchesPage` и в ячейке сетки (`RoundColumns`), показывая в сетке только админам/модераторам и только для ячеек с реальным матчем.

**Tech Stack:** React 18 + TS, Vite, TanStack Query, Radix UI (`@radix-ui/react-dropdown-menu`, dialog), Tailwind/shadcn. **Тест-раннера в репо нет** — верификация каждой задачи через `npm run build` (`tsc -b` + vite) + ручной смок в конце.

**Spec:** `docs/superpowers/specs/2026-06-11-bracket-admin-match-menu-design.md`

**Среда:** Windows. `JAVA_HOME` не нужен (фронт). Команды через PowerShell или Bash в каталоге репо `C:\Users\timka\IdeaProjects\DiscordForFemka-Frontend`. Сборка: `npm run build`. Коммиты — без Claude co-authorship.

---

## File Structure

- **Create** `src/components/MatchAdminMenu.tsx` — самодостаточный компонент: триггер ⋯ + dropdown действий + все диалоги/формы/хендлеры/мутации для ОДНОГО матча (`props: { match: MatchDto }`).
- **Modify** `src/pages/admin/AdminMatchesPage.tsx` (1368 строк) — заменить встроенный per-row dropdown + блок диалогов на `<MatchAdminMenu match={m} />`; удалить переехавший код.
- **Modify** `src/pages/TournamentDetailsPage.tsx` (`RoundColumns`) — рендерить `<MatchAdminMenu match={cell.match} />` для админа/мода у ячеек с реальным матчем.
- **Modify** `src/lib/queries.ts` — добавить инвалидацию `['tournament']` в lobby-хуки (полировка, чтобы статус в ячейке обновлялся).

> Примечание к spec §4: остальные admin-мутации (`useFinishMatch/useRepropagateMatch/useTechResultMatch/useCancelMatchResult/useMoveMatchTeams/useChangeMatchFormat/useUpdateAdminMatch`) уже инвалидируют префикс `['tournament']`, а `qk.bracket(id) = ['tournament', id, 'bracket']` под него попадает — значит сетка уже обновляется. Спека предполагала, что инвалидацию надо добавлять везде; по факту нужна только для двух lobby-хуков.

---

## Task 1: Создать `MatchAdminMenu` (копией из AdminMatchesPage)

Создаём новый компонент, КОПИРУЯ «на матч» админский код из `AdminMatchesPage` и параметризуя его пропом `match`. На этом шаге `AdminMatchesPage` НЕ трогаем (временное дублирование) — так проект остаётся собираемым. Рефакторинг страницы — в Task 2.

**Files:**
- Create: `src/components/MatchAdminMenu.tsx`
- Read for reference: `src/pages/admin/AdminMatchesPage.tsx`

- [ ] **Step 1: Изучить исходные блоки в `AdminMatchesPage.tsx`.**

Открыть файл и найти блоки (номера строк ориентировочные, опираться на символы):
- импорты мутаций и ui (строки ~1-50): `useUpdateAdminMatch, useRecreateLobby, useLaunchLobby, useFinishMatch, useRepropagateMatch, useTechResultMatch, useCancelMatchResult, useMoveMatchTeams, useChangeMatchFormat` + `Dialog*`, `DropdownMenu*`, `Button`, `Input`, `Select*`, `useToast`, `MatchDto`, enum-лейблы.
- типы/формы/хелперы (~104-145): `DialogState`, `SettingsForm`, `settingsFromMatch`, `FinishForm`, `defaultFinishForm`, `TechForm` (+ возможная move-форма рядом), `NONE`, `describeError`, `fmtDateTime`.
- внутри компонента (~196-489): объявления мутаций (`useUpdateAdminMatch()` и т.д.), стейт `dialog`/форм (`useState`), хелперы-открыватели (`openSettings/openTech/openFinish/openFormat`) и хендлеры (`handleSaveSettings/handleRecreate/handleLaunch/handleResetReady/handleFinish/handleRepropagate/handleTech/handleCancel/handleMove/handleFormat`).
- per-row dropdown (~664-754): `<DropdownMenu>…</DropdownMenu>` со всеми `DropdownMenuItem`.
- блок диалогов (~756-1360): набор `<Dialog open={dialog?.kind === '…'} …><DialogContent>…</DialogContent></Dialog>` с формами и кнопками, вызывающими хендлеры.

- [ ] **Step 2: Создать `src/components/MatchAdminMenu.tsx` со скелетом и перенесённой логикой.**

Скелет (заполнить тело перенесённым кодом по правилам ниже):
```tsx
import { useState } from 'react';
import { useMe } from '@/lib/queries';
// + те же импорты мутаций/ui/типов/enum-лейблов, что использует перенесённый код
//   (скопировать из AdminMatchesPage точечно — только реально используемые).
import type { MatchDto } from '@/lib/api/types';

// Перенести сюда: DialogState (без поля match — матч берётся из пропа),
// SettingsForm/settingsFromMatch, FinishForm/defaultFinishForm, TechForm,
// move-форму, NONE, describeError, fmtDateTime — если они не экспортируются
// откуда-то общего. (Если такие хелперы уже есть в src/lib/format.ts —
// импортировать оттуда, а не дублировать.)

export function MatchAdminMenu({ match }: { match: MatchDto }) {
  const me = useMe();
  const roles = me.data?.roles ?? [];
  const isAdmin = roles.includes('ADMIN');
  // const isStaff = isAdmin || roles.includes('MODERATOR'); // меню целиком — для staff (гейтит вызывающий)

  // Мутации (скопировать объявления как в AdminMatchesPage):
  // const updateMut = useUpdateAdminMatch(); ... const formatMut = useChangeMatchFormat();

  // Стейт диалога и форм (скопировать), но БЕЗ match в DialogState:
  const [dialog, setDialog] = useState<DialogState>(null);
  // ...форм-стейты...

  // Хендлеры (скопировать), заменив обращения dialog.match / m → match.

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Действия матча">
            {/* иконку ⋯ взять как в AdminMatchesPage (lucide MoreHorizontal/MoreVertical) */}
            <span aria-hidden>⋯</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Перенести пункты из AdminMatchesPage: setDialog({kind:'…'}) вместо
              setDialog({kind:'…', match: m}); openSettings()/openTech()/… без аргумента.
              ADMIN-only пункты (recreate, launch) рендерить только если isAdmin. */}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Перенести сюда блок всех <Dialog …>…</Dialog>, заменив dialog.match → match. */}
    </>
  );
}
```

Правила переноса (применять ко ВСЕМ перенесённым блокам):
1. `DialogState` — убрать поле `match` из каждого варианта: `{ kind: 'settings' } | { kind: 'finish' } | … | null`. Матч всегда `match` (проп).
2. Любое `dialog.match` → `match`. Любой параметр `m: MatchDto` в open*/handle* убрать и использовать `match`.
3. Пункты dropdown: `onClick={() => openSettings(m)}` → `onClick={() => openSettings()}` (или `setDialog({ kind: 'settings' })`); аналогично для всех.
4. ADMIN-only действия (`recreate`, `launch`) — оборачивать пункт меню в `{isAdmin && (…)}`.
5. Хендлеры/мутации/формы — переносить как есть (логика та же), только источник матча — `match`.
6. Если какой-то хелпер (`describeError`, `fmtDateTime`, `NONE`, enum-лейблы) уже доступен из общего модуля — импортировать, не дублировать.

- [ ] **Step 3: Собрать проект.**

Run: `npm run build`
Expected: `tsc -b` без ошибок типов, `vite build` — `✓ built`. (На этом шаге `MatchAdminMenu` существует, но ещё нигде не используется — это ок.)

- [ ] **Step 4: Commit.**

```bash
git add src/components/MatchAdminMenu.tsx
git commit -m "feat(match-admin): извлечь MatchAdminMenu — меню админ-действий матча"
```

---

## Task 2: Перевести `AdminMatchesPage` на `MatchAdminMenu`

Убрать дублирование: страница теперь использует новый компонент, переехавший код удаляется.

**Files:**
- Modify: `src/pages/admin/AdminMatchesPage.tsx`

- [ ] **Step 1: В строке матча заменить per-row dropdown на компонент.**

Найти блок `<DropdownMenu>…</DropdownMenu>` (~664-754) в рендере строки матча и заменить целиком на:
```tsx
<MatchAdminMenu match={m} />
```
Добавить импорт вверху файла:
```tsx
import { MatchAdminMenu } from '@/components/MatchAdminMenu';
```

- [ ] **Step 2: Удалить переехавший код из `AdminMatchesPage`.**

Удалить ставшие неиспользуемыми:
- блок всех `<Dialog …>…</Dialog>` (~756-1360);
- хелперы-открыватели и хендлеры (`openSettings/openTech/openFinish/openFormat`, `handleSaveSettings/handleRecreate/handleLaunch/handleResetReady/handleFinish/handleRepropagate/handleTech/handleCancel/handleMove/handleFormat`);
- стейт `dialog` и форм-стейты, объявления мутаций, которые теперь живут в `MatchAdminMenu`;
- типы/хелперы `DialogState/SettingsForm/settingsFromMatch/FinishForm/defaultFinishForm/TechForm`, если они больше нигде в файле не используются;
- импорты `Dialog*`, мутаций, `Select/Input` и т.п., которые остались без использования.

Оставить всё, что относится к СПИСКУ матчей (фильтры, таблица, пагинация, запрос `admin-tournament-matches`).

- [ ] **Step 3: Собрать — поймать «осиротевшие» импорты/символы.**

Run: `npm run build`
Expected: BUILD SUCCESS. Если `tsc` ругается на неиспользуемые импорты/переменные — удалить их (это и есть зачистка). Повторять до зелёного.

- [ ] **Step 4: Commit.**

```bash
git add src/pages/admin/AdminMatchesPage.tsx
git commit -m "refactor(admin): AdminMatchesPage использует MatchAdminMenu"
```

---

## Task 3: Встроить меню в ячейку сетки (только админам)

**Files:**
- Modify: `src/pages/TournamentDetailsPage.tsx` (`RoundColumns`)

- [ ] **Step 1: Импортировать хук роли и компонент.**

В начало `TournamentDetailsPage.tsx` добавить (если ещё не импортированы):
```tsx
import { MatchAdminMenu } from '@/components/MatchAdminMenu';
```
`useMe` уже импортируется из `@/lib/queries` в этом файле (используется на странице). Если нет — добавить в существующий импорт из `@/lib/queries`.

- [ ] **Step 2: В `RoundColumns` вычислить роль и отрендерить меню в ячейке.**

В компоненте `function RoundColumns({ rounds }: { rounds: BracketRound[] })` сразу после сигнатуры добавить:
```tsx
  const me = useMe();
  const isStaff =
    me.data?.roles?.some((r) => r === 'ADMIN' || r === 'MODERATOR') ?? false;
```
В JSX ячейки — внешний `<div key={…} className="space-y-1 rounded-md border bg-card p-3 text-sm shadow-sm">` сделать позиционирующим контейнером и добавить меню в угол. Заменить открывающий тег ячейки и добавить блок меню первым потомком:
```tsx
                <div
                  key={`${cell.section}-${cell.roundIndex}-${cell.matchIndex}`}
                  className="relative space-y-1 rounded-md border bg-card p-3 text-sm shadow-sm"
                >
                  {isStaff && cell.match ? (
                    <div className="absolute right-1 top-1">
                      <MatchAdminMenu match={cell.match} />
                    </div>
                  ) : null}
```
(Остальное содержимое ячейки — слоты A/B и строка статуса — без изменений. Добавить лёгкий правый отступ заголовку слота A, чтобы текст не залезал под иконку, например на первом `<span className="truncate …">` верхнего слота — обернуть строку слота A контейнером с `pr-6`. Конкретно: у первого внутреннего `<div className="flex justify-between …">` добавить класс `pr-6`.)

- [ ] **Step 3: Собрать.**

Run: `npm run build`
Expected: BUILD SUCCESS.

- [ ] **Step 4: Commit.**

```bash
git add src/pages/TournamentDetailsPage.tsx
git commit -m "feat(bracket): админ-меню матча в ячейке сетки (только staff)"
```

---

## Task 4: Lobby-хуки инвалидируют сетку (полировка)

Чтобы статус ячейки обновлялся после recreate/launch лобби.

**Files:**
- Modify: `src/lib/queries.ts`

- [ ] **Step 1: Добавить инвалидацию `['tournament']` в два хука.**

В `useRecreateLobby` (около строки 842) и `useLaunchLobby` (около 853) в `onSuccess` после строки `qc.invalidateQueries({ queryKey: qk.match(m.id) });` добавить:
```ts
      qc.invalidateQueries({ queryKey: ['tournament'] });
```
(Это обновит `qk.bracket` через префикс, как уже сделано в `useFinishMatch`.)

- [ ] **Step 2: Собрать.**

Run: `npm run build`
Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit.**

```bash
git add src/lib/queries.ts
git commit -m "fix(queries): lobby recreate/launch обновляют сетку"
```

---

## Task 5: Ручной смок (нет тест-раннера)

**Files:** —

- [ ] **Step 1: Запустить дев против прод-API.**

Run (Bash): `VITE_API_TARGET=https://playstage.online npm run dev`
Открыть `http://localhost:5173/tournaments/6969team11` → вкладка «Сетка».

- [ ] **Step 2: Проверить под обычным юзером (или без логина).**

Ожидание: иконки ⋯ на ячейках НЕТ.

- [ ] **Step 3: Проверить под админом/модератором.**

Залогиниться админом. Ожидание: у ячеек с реальным матчем — иконка ⋯; открывает меню со всеми действиями; ADMIN-only пункты (лобби recreate/launch) видны только под ADMIN. Прогнать «Настройки» (сохранить) и «Перенести команды» — после применения ячейка/сетка обновляются без перезагрузки. У placeholder-ячеек иконки нет.

- [ ] **Step 4: Остановить дев-сервер.**

---

## Self-Review

**Spec coverage:**
- §Решения 1 (все действия) → Task 1 (переносим весь набор).
- §Решения 2 (иконка → меню) → Task 1 (DropdownMenu-триггер + пункты).
- §Решения 3 (публичная сетка, только staff) → Task 3 (`isStaff` через `useMe`).
- §Решения 4 (только реальные матчи) → Task 3 (`cell.match` гард).
- §Дизайн 1 (MatchAdminMenu) → Task 1; §Дизайн 2 (рефакторинг AdminMatchesPage) → Task 2; §Дизайн 3 (ячейка) → Task 3; §Дизайн 4 (инвалидация) → Task 4 (+ примечание: основное уже работает через префикс `['tournament']`); §Дизайн 5/6 (доступ/бэкенд) → без изменений, гейт на бэке.
- §Проверка → Task 5 (ручной смок) + `npm run build` в каждой задаче.

**Placeholder scan:** Task 1 — это извлечение/перенос существующего кода (1300-строчный файл), поэтому объёмный диалоговый JSX переносится как есть по чётким правилам трансформации, а не переписывается в плане; для НОВОГО клея (скелет компонента, гейт роли, встройка в ячейку, lobby-инвалидация) код приведён полностью. Это осознанный выбор для рефактора-移, не хвост «TODO».

**Type consistency:** `MatchAdminMenu({ match: MatchDto })` используется единообразно (Task 1/2/3). Роль читается как `me.data?.roles` (PlayerRole[]) в обоих местах. `cell.match` — `MatchDto | undefined`, гард `cell.match ?` перед передачей в проп `match: MatchDto`.

**Риск:** Task 1→2 — большой механический перенос из 1368-строчного файла; митигируется тем, что Task 1 КОПИРУЕТ (сборка зелёная при дублировании), а Task 2 удаляет дубль и ловит осиротевшие символы сборкой.
