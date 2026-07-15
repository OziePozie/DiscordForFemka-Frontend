# Разгрузка вкладки «Команды» → «Мои команды» в профиле — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать публичный каталог всех команд (`/teams`) и дать пользователю точку входа к своим стакам через блок «Мои команды» в профиле.

**Architecture:** Изменения только на фронте (`DiscordForFemka-Frontend`). Бэкенд (team/invite API) не трогаем. Блок «Мои команды» рендерится из уже приходящих данных `me.teams` (`TeamMembershipDto[]`), без новых запросов. Затем удаляем каталог-страницу, её роут, nav-ссылку и ставший мёртвым data-слой.

**Tech Stack:** React + react-router-dom, TanStack Query, shadcn-подобные UI-компоненты (`Card`/`Badge`/`Button`), TypeScript. В репозитории **нет тест-фреймворка** (нет vitest/testing-library, нет тест-файлов). Установленный паттерн проверки — типизация через `npm run build` (`tsc -b`) + ручной прогон в браузере. План следует этому паттерну: автоматический гейт каждой задачи — `npm run build`.

**Ветка:** `feat/teams-tab-declutter` (worktree `DiscordForFemka-Frontend.wt-teams-declutter`).

---

## Порядок и файловая структура

Порядок выбран так, чтобы ни на одном коммите пользователь не терял доступ к своему стаку: сначала добавляем точку входа в профиль, потом убираем каталог, потом чистим мёртвый код.

- **Task 1** — `src/pages/ProfilePage.tsx` (modify): добавить секцию «Мои команды».
- **Task 2** — `src/components/Header.tsx` (modify), `src/App.tsx` (modify), `src/pages/TeamsListPage.tsx` (delete): убрать публичный каталог.
- **Task 3** — `src/lib/queries.ts` (modify), `src/lib/api/endpoints.ts` (modify): удалить ставший мёртвым data-слой.

---

## Task 1: Блок «Мои команды» в профиле

**Files:**
- Modify: `src/pages/ProfilePage.tsx`

- [ ] **Step 1: Добавить импорты `useNavigate`, `TeamNameLink` и лейблы команд**

В `src/pages/ProfilePage.tsx` добавить в начало (после существующих импортов React, строка 1 — там уже есть `import { useEffect, useRef, useState, type ChangeEvent } from 'react';`) новый импорт роутера:

```tsx
import { useNavigate } from 'react-router-dom';
```

Добавить импорт компонента ссылки на команду (рядом с другими импортами из `@/components`):

```tsx
import { TeamNameLink } from '@/components/TeamNameLink';
```

В существующий блок импорта из `@/lib/api/types` (начинается `import {` на строке 39 и содержит `COUNTRIES, COUNTRY_LABEL, ...`) добавить две константы-лейбла:

```tsx
  TEAM_MEMBER_ROLE_LABEL,
  TEAM_STATUS_LABEL,
```

- [ ] **Step 2: Объявить `navigate` и `isInactive`**

Внутри компонента `ProfilePage`, рядом с остальными хуками (после `const me = useMe();`, строка 67), добавить:

```tsx
  const navigate = useNavigate();
```

После строки `const data = me.data;` (строка 122, ниже guard'ов `me.isLoading` / `me.isError`) добавить:

```tsx
  const isInactive = data.activity?.status === 'INACTIVE';
```

- [ ] **Step 3: Вставить секцию «Мои команды»**

Вставить блок между закрывающим `</Card>` карточки «Профиль» (строка 424) и комментарием `{/* MMR */}` (строка 426):

```tsx
      {/* Мои команды */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Мои команды</CardTitle>
            <CardDescription>
              Стаки, в которых вы состоите. Капитан активной команды может
              зарегистрировать её на турнир.
            </CardDescription>
          </div>
          <Button
            onClick={() => navigate('/teams/new')}
            disabled={isInactive}
            title={isInactive ? 'Профиль не активен' : undefined}
          >
            + Создать команду
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.teams.length === 0 ? (
            <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
              У вас пока нет команды.
            </div>
          ) : (
            data.teams.map((t) => (
              <div
                key={t.teamId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="font-medium">
                    <TeamNameLink teamId={t.teamId} name={t.name} tag={t.tag} />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline">
                      {TEAM_MEMBER_ROLE_LABEL[t.role]}
                    </Badge>
                    <Badge variant="secondary">
                      {TEAM_STATUS_LABEL[t.teamStatus]}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/teams/${t.teamId}`)}
                >
                  Открыть
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
```

Примечание: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `Badge`, `Button` уже импортированы в этом файле — новых импортов для них не нужно.

- [ ] **Step 4: Собрать проект — типизация должна пройти**

Run: `npm run build`
Expected: сборка успешна (сначала `tsc -b`, затем `vite build`). Нет ошибок про несуществующие символы `TEAM_MEMBER_ROLE_LABEL` / `TEAM_STATUS_LABEL` / `TeamNameLink` / `useNavigate`, нет ошибок про типы `data.teams`.

- [ ] **Step 5: Коммит**

```bash
git add src/pages/ProfilePage.tsx
git commit -m "feat(profile): блок «Мои команды» со списком стаков и кнопкой создания"
```

---

## Task 2: Убрать публичный каталог команд

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/App.tsx`
- Delete: `src/pages/TeamsListPage.tsx`

- [ ] **Step 1: Убрать nav-ссылку «Команды» из шапки**

В `src/components/Header.tsx` удалить блок ссылки (строки 82–84):

```tsx
            <Link to="/teams" className={navLink('/teams')}>
              Команды
            </Link>
```

Остальные ссылки (`Сцены`, `Рейтинг`, `Архив`, `Лобби`, `Приглашения`, `Профиль`, `Админка`) и пункт дропдауна «Создать команду» оставить без изменений.

- [ ] **Step 2: Убрать роут и импорт каталога в роутере**

В `src/App.tsx` удалить импорт (строка 11):

```tsx
import TeamsListPage from '@/pages/TeamsListPage';
```

И удалить роут списка (строка 47):

```tsx
        <Route path="/teams" element={<TeamsListPage />} />
```

**Оставить** роуты `/teams/new` (`TeamCreatePage`) и `/teams/:id` (`TeamDetailsPage`) — их импорты и `<Route>` не трогать.

- [ ] **Step 3: Удалить страницу каталога**

```bash
git rm src/pages/TeamsListPage.tsx
```

- [ ] **Step 4: Собрать проект — не должно остаться ссылок на удалённое**

Run: `npm run build`
Expected: сборка успешна. Если `tsc` ругается на неиспользуемый импорт где-то ещё — это ожидаемо только в Task 3 (data-слой); здесь после удаления страницы/роута/ссылки ошибок быть не должно.

- [ ] **Step 5: Коммит**

```bash
git add src/components/Header.tsx src/App.tsx
git commit -m "feat(teams): убрать публичный каталог команд (вкладка, роут, страница)"
```

---

## Task 3: Удалить мёртвый data-слой каталога

После Task 2 хук `useTeamsList` и функция `getTeamsPage` больше нигде не используются (единственным потребителем была `TeamsListPage`). Удаляем их и связанные символы.

**Files:**
- Modify: `src/lib/queries.ts`
- Modify: `src/lib/api/endpoints.ts`

- [ ] **Step 1: Удалить хук `useTeamsList` и ключ `qk.teams`**

В `src/lib/queries.ts` удалить функцию (строки 378–383):

```tsx
export function useTeamsList(params: TeamsPageParams = {}) {
  return useQuery({
    queryKey: qk.teams(params),
    queryFn: () => getTeamsPage(params),
  });
}
```

Удалить строку ключа запроса из объекта `qk` (строка 185):

```tsx
  teams: (params: TeamsPageParams) => ['teams', params] as const,
```

Примечание: инвалидации кэша по всему списку команд сделаны литералом `['teams']` (например в `useDisbandTeam`, `useCreateTeam`), а не через `qk.teams(...)` — их **не трогать**, они продолжают работать.

- [ ] **Step 2: Удалить ставшие неиспользуемыми импорты в `queries.ts`**

Удалить `getTeamsPage,` из блока импорта значений из `@/lib/api/endpoints` (строка 22):

```tsx
  getTeamsPage,
```

Удалить `type TeamsPageParams,` из блока импорта типов из `@/lib/api/endpoints` (строка 113):

```tsx
  type TeamsPageParams,
```

`AdminTeamsPageParams` (строка 118) и `getAdminTeamsPage`/`useAdminTeams` **оставить** — это отдельный админский слой, он не связан с публичным каталогом.

- [ ] **Step 3: Удалить `getTeamsPage` и `TeamsPageParams` в `endpoints.ts`**

В `src/lib/api/endpoints.ts` удалить интерфейс и функцию (строки 274–287), оставив комментарий-заголовок секции по желанию:

```tsx
export interface TeamsPageParams {
  q?: string;
  status?: string;
  page?: number;
  size?: number;
}

export function getTeamsPage(
  params: TeamsPageParams = {},
): Promise<PagedResponse<TeamPublicDto>> {
  return api<PagedResponse<TeamPublicDto>>(
    `/api/v1/teams${buildQuery(params)}`,
  );
}
```

`getTeamById`, `disbandTeam`, `listTeamInvites` и остальные функции ниже **оставить**.

- [ ] **Step 4: Собрать проект и вычистить оставшиеся неиспользуемые импорты**

Run: `npm run build`
Expected: сборка успешна. Если `tsc` (`noUnusedLocals`) укажет на неиспользуемый импорт `TeamPublicDto` в `endpoints.ts` (он был нужен только `getTeamsPage`) — удалить его из импорта типов в `endpoints.ts`. Если `TeamPublicDto` используется другими функциями в файле, `tsc` его не тронет — оставить. Повторить `npm run build` до зелёной сборки.

- [ ] **Step 5: Коммит**

```bash
git add src/lib/queries.ts src/lib/api/endpoints.ts
git commit -m "refactor(teams): удалить мёртвый data-слой каталога команд (useTeamsList/getTeamsPage)"
```

---

## Финальная проверка (ручной прогон в браузере)

После всех задач — `npm run dev` (или `npm run dev:staging`) и пройти по флоу:

- [ ] В шапке **нет** пункта «Команды». Прямой переход на `/teams` открывает NotFound (роут удалён), а не каталог.
- [ ] На странице `/profile` появился блок **«Мои команды»**:
  - у пользователя с командами — список с корректными бейджами роли (Капитан/Игрок) и статуса, ссылки на команды открывают `/teams/:id`;
  - у пользователя без команд — пустое состояние «У вас пока нет команды».
- [ ] Кнопка «+ Создать команду» ведёт на `/teams/new`; при `INACTIVE`-профиле кнопка задизейблена с тайтлом «Профиль не активен».
- [ ] Страница команды `/teams/:id` открывается по ссылке (из профиля и из ростера турнира).
- [ ] На странице турнира регистрация капитана по-прежнему работает (кнопка «Зарегистрироваться» видит команду из `me.teams`).
- [ ] Приглашения (`/me/invites`, бейдж в шапке и дропдауне) работают как раньше.

## Финализация

Оформить ветку `feat/teams-tab-declutter` как PR (`gh pr create`, base: `master`) в репозитории фронта. Мердж в master автодеплоит фронт.
