# Мобильная адаптация: навигация + точечные правки — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сайт нормально работает от 375px: навигация в шапке и в админке перестаёт исчезать/схлопываться неудобно на мобильном, счёт матча не разъезжается, а всё остальное (таблицы админки, сетка турнира, лобби) уже адаптивно и требует только проверки.

**Architecture:** Только фронтенд-правки в существующих компонентах (`Header.tsx`, `AdminLayout.tsx`, `MatchDetailsPage.tsx`) — добавляем мобильные варианты уже существующей разметки через Tailwind-классы `sm:`/`md:`, без новых зависимостей, без изменений API. Завершается ручной QA-проверкой на ширине 375px через встроенный браузерный preview.

**Tech Stack:** React 18 + TypeScript + Tailwind CSS 3 + `lucide-react` (иконки) + `react-router-dom`. В проекте нет unit/интеграционных тестов (see `package.json` — только `tsc -b && vite build`), поэтому верификация каждой задачи — это `npm run build` (типы/сборка) + ручная проверка в браузере, как и в остальных спеках проекта (`docs/superpowers/specs/*.md`).

**Спека:** `docs/superpowers/specs/2026-08-01-mobile-responsive-design.md`

---

## Важный факт перед началом

Все 8 таблиц в админке (`AdminPlayersPage.tsx:397`, `AdminTournamentsPage.tsx:632`, `AdminMatchesPage.tsx:193`, `AdminTeamsPage.tsx:179`, `AdminMmrPage.tsx:132`, `AdminSeasonsPage.tsx:283`, `AdminBotsPage.tsx:95`, `AdminAuditPage.tsx:182`) **уже обёрнуты** в `<div className="overflow-x-auto rounded-md border">`. Пункт спеки «защитная обёртка для таблиц» уже выполнен в коде — отдельной задачи на это в плане нет, только проверка в Task 4.

---

### Task 1: Мобильное меню в шапке

**Files:**
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Добавить импорт `useState` и иконки `Menu`/`X`, завести состояние меню**

В `src/components/Header.tsx` замени первые две строки импортов:

```tsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User, Users, Mail } from 'lucide-react';
```

на:

```tsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Mail, Menu, User, Users, X } from 'lucide-react';
```

Внутри `export default function Header() {`, сразу после `const { session, isAuthenticated, isLoading } = useAuth();`, добавь:

```tsx
  const [isMenuOpen, setIsMenuOpen] = useState(false);
```

И перед `return (` (после определения `navLink`) добавь функцию закрытия меню:

```tsx
  function closeMenu() {
    setIsMenuOpen(false);
  }
```

- [ ] **Step 2: Добавить кнопку-гамбургер после desktop-`<nav>`**

Найди закрывающий тег `</nav>` desktop-меню (сразу после ссылки «Админка» и перед закрывающим `</div>` левого блока шапки):

```tsx
            {isStaff && (
              <Link to="/admin/mmr" className={navLink('/admin')}>
                Админка
              </Link>
            )}
          </nav>
        </div>
```

Замени на:

```tsx
            {isStaff && (
              <Link to="/admin/mmr" className={navLink('/admin')}>
                Админка
              </Link>
            )}
          </nav>
          <button
            type="button"
            onClick={() => setIsMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-ink sm:hidden"
            aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
```

Итоговый левый блок шапки целиком должен выглядеть так:

```tsx
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center" aria-label="Play Stage — на главную">
            <img
              src="/logo.png"
              alt="Play Stage"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <nav className="hidden gap-6 text-sm sm:flex">
            <Link to="/" className={navLink('/', true)}>
              Главная
            </Link>
            <Link to="/scenes" className={navLink('/scenes')}>
              Сцены
            </Link>
            <Link to="/leaderboard" className={navLink('/leaderboard')}>
              Рейтинг
            </Link>
            <Link to="/archive" className={navLink('/archive')}>
              Архив
            </Link>
            <Link to="/lobbies" className={navLink('/lobbies')}>
              Лобби
            </Link>
            {isAuthenticated && pendingInviteCount > 0 && (
              <Link
                to="/me/invites"
                className={`flex items-center gap-1.5 ${navLink('/me/invites')}`}
              >
                Приглашения
                <Badge variant="default" className="h-5 px-1.5 text-xs">
                  {pendingInviteCount}
                </Badge>
              </Link>
            )}
            {isAuthenticated && (
              <Link to="/profile" className={navLink('/profile')}>
                Профиль
              </Link>
            )}
            {isStaff && (
              <Link to="/admin/mmr" className={navLink('/admin')}>
                Админка
              </Link>
            )}
          </nav>
          <button
            type="button"
            onClick={() => setIsMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-ink sm:hidden"
            aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
```

- [ ] **Step 4: Добавить выпадающую панель под шапкой**

Найди конец компонента — закрывающий `</header>` в самом низу файла:

```tsx
      </div>
    </header>
  );
}
```

Замени на (добавляется блок мобильного меню перед `</header>`):

```tsx
      </div>

      {isMenuOpen && (
        <nav className="flex flex-col gap-1 border-t border-line px-6 py-3 text-sm sm:hidden">
          <Link
            to="/"
            className={`rounded-md px-2 py-2 ${navLink('/', true)}`}
            onClick={closeMenu}
          >
            Главная
          </Link>
          <Link
            to="/scenes"
            className={`rounded-md px-2 py-2 ${navLink('/scenes')}`}
            onClick={closeMenu}
          >
            Сцены
          </Link>
          <Link
            to="/leaderboard"
            className={`rounded-md px-2 py-2 ${navLink('/leaderboard')}`}
            onClick={closeMenu}
          >
            Рейтинг
          </Link>
          <Link
            to="/archive"
            className={`rounded-md px-2 py-2 ${navLink('/archive')}`}
            onClick={closeMenu}
          >
            Архив
          </Link>
          <Link
            to="/lobbies"
            className={`rounded-md px-2 py-2 ${navLink('/lobbies')}`}
            onClick={closeMenu}
          >
            Лобби
          </Link>
          {isAuthenticated && pendingInviteCount > 0 && (
            <Link
              to="/me/invites"
              className={`flex items-center gap-1.5 rounded-md px-2 py-2 ${navLink('/me/invites')}`}
              onClick={closeMenu}
            >
              Приглашения
              <Badge variant="default" className="h-5 px-1.5 text-xs">
                {pendingInviteCount}
              </Badge>
            </Link>
          )}
          {isAuthenticated && (
            <Link
              to="/profile"
              className={`rounded-md px-2 py-2 ${navLink('/profile')}`}
              onClick={closeMenu}
            >
              Профиль
            </Link>
          )}
          {isStaff && (
            <Link
              to="/admin/mmr"
              className={`rounded-md px-2 py-2 ${navLink('/admin')}`}
              onClick={closeMenu}
            >
              Админка
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
```

- [ ] **Step 5: Проверить сборку**

Run: `npm run build`
Expected: команда завершается без ошибок TypeScript/сборки.

- [ ] **Step 6: Ручная проверка в браузере**

Через `mcp__Claude_Browser__preview_start` с `{name: "dev"}` (или конфигурацией dev-сервера из `.claude/launch.json` — если её ещё нет, создать с `runtimeExecutable: "npm"`, `runtimeArgs: ["run", "dev"]`, `port: 5173`), затем `resize_window` на 375×812:

- на 375px нет desktop-`<nav>` и виден только гамбургер рядом с лого;
- клик по гамбургеру открывает панель под шапкой со всеми пунктами (для анонимного пользователя — без «Профиль»/«Приглашения»/«Админка», это ожидаемо);
- клик по любой ссылке в панели переходит на страницу и панель закрывается;
- повторный клик по кнопке (теперь с иконкой ✕) закрывает панель без перехода;
- `resize_window` обратно на десктопный размер (1280×800) — гамбургер скрыт, виден обычный desktop-`<nav>`, поведение не изменилось.

- [ ] **Step 7: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat(mobile): мобильное меню в шапке"
```

---

### Task 2: Мобильное меню в админке

**Files:**
- Modify: `src/pages/admin/AdminLayout.tsx`

- [ ] **Step 1: Заменить корневую разметку `return`**

В `src/pages/admin/AdminLayout.tsx` найди (это финальный `return` компонента, после блоков `isLoading`/`!isStaff`):

```tsx
  return (
    <div className="grid gap-6 md:grid-cols-[200px_1fr]">
      <aside className="space-y-1">
        <h2 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Админка
        </h2>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) =>
            item.disabled ? (
              <span
                key={item.to}
                className="cursor-not-allowed rounded-md px-3 py-2 text-sm text-muted-foreground opacity-50"
                title="Будет в следующей итерации"
              >
                {item.label}
              </span>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ),
          )}
        </nav>
      </aside>
      <section>
        <Outlet />
      </section>
    </div>
  );
```

Замени на:

```tsx
  return (
    <div className="space-y-4">
      <nav className="flex gap-2 overflow-x-auto pb-1 md:hidden">
        {NAV.map((item) =>
          item.disabled ? (
            <span
              key={item.to}
              className="shrink-0 cursor-not-allowed whitespace-nowrap rounded-full border border-line px-3 py-1.5 text-xs text-muted-foreground opacity-50"
              title="Будет в следующей итерации"
            >
              {item.label}
            </span>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors',
                  isActive
                    ? 'border-transparent bg-accent text-accent-foreground'
                    : 'border-line text-muted-foreground hover:bg-accent hover:text-foreground',
                )
              }
            >
              {item.label}
            </NavLink>
          ),
        )}
      </nav>

      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        <aside className="hidden space-y-1 md:block">
          <h2 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Админка
          </h2>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) =>
              item.disabled ? (
                <span
                  key={item.to}
                  className="cursor-not-allowed rounded-md px-3 py-2 text-sm text-muted-foreground opacity-50"
                  title="Будет в следующей итерации"
                >
                  {item.label}
                </span>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-md px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ),
            )}
          </nav>
        </aside>
        <section>
          <Outlet />
        </section>
      </div>
    </div>
  );
```

- [ ] **Step 2: Проверить сборку**

Run: `npm run build`
Expected: без ошибок.

- [ ] **Step 3: Ручная проверка в браузере**

Через `mcp__Claude_Browser__preview_start`/`navigate` на `/admin/mmr` (нужен пользователь с ролью MODERATOR/ADMIN — если под рукой нет залогиненной сессии со стафф-ролью, проверить хотя бы что структура рендерится и класс `md:hidden`/`hidden md:block` применяются верно через `read_page`, не блокируясь на реальной авторизации):

- `resize_window` на 375×812 → виден горизонтально скроллящийся ряд пилюль с разделами, обычный левый список скрыт;
- клик/переход по пилюле подсвечивает её как активную и открывает соответствующий раздел;
- `resize_window` на 1280×800 → пилюли скрыты, виден прежний левый вертикальный список, поведение как до изменений.

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/AdminLayout.tsx
git commit -m "feat(mobile): горизонтальное меню разделов админки на мобильном"
```

---

### Task 3: Адаптивный размер счёта на странице матча

**Files:**
- Modify: `src/pages/MatchDetailsPage.tsx:679`

**Почему:** центральная колонка шапки счёта (`grid-cols-[1fr_auto_1fr]`) рендерит цифры счёта шрифтом `text-[4rem]` (64px). На 375px это вместе с двумя колонками названий команд оставляет слишком мало места и грозит переполнением/обрезкой — снижаем размер на маленьких экранах, на `sm` и выше возвращаем как было.

- [ ] **Step 1: Изменить класс блока счёта**

Найди (около строки 679):

```tsx
          <div className="ec-display flex items-baseline gap-3 text-[4rem] leading-none">
```

Замени на:

```tsx
          <div className="ec-display flex items-baseline gap-2 text-[2.5rem] leading-none sm:gap-3 sm:text-[4rem]">
```

- [ ] **Step 2: Проверить сборку**

Run: `npm run build`
Expected: без ошибок.

- [ ] **Step 3: Ручная проверка в браузере**

Через Browser preview открой любую страницу матча (`/matches/:id` с реальным id из окружения разработки), `resize_window` на 375×812:

- счёт и названия команд помещаются в ширину экрана без горизонтального скролла страницы;
- `resize_window` обратно на 1280×800 — счёт визуально как раньше (крупный, `4rem`).

- [ ] **Step 4: Commit**

```bash
git add src/pages/MatchDetailsPage.tsx
git commit -m "fix(mobile): уменьшить размер счёта матча на узких экранах"
```

---

### Task 4: Визуальная QA-проверка приоритетных страниц на 375px

**Files:** без изменений кода, если чек-лист не выявит проблем (contingency-фикс для Лидерборда — см. Step 3).

- [ ] **Step 1: Поднять dev-сервер и переключиться на мобильную ширину**

`mcp__Claude_Browser__preview_start` с dev-конфигурацией (`npm run dev`, порт 5173), затем `resize_window` на 375×812.

- [ ] **Step 2: Пройтись по чек-листу страниц**

Для каждой страницы: `navigate`, затем `read_page` и/или `computer {action: "screenshot"}`, критерий приёмки — **нет горизонтального скролла всей страницы** (только внутри уже существующих `overflow-x-auto`-контейнеров: сетка турнира, таблицы админки, карточки статистики матча) и **нет визуально обрезанного/наложенного текста**:

  - `/` (Главная)
  - `/scenes` и `/scenes/:slug` (любая существующая сцена)
  - `/tournaments/:slug` (любой турнир с уже сыгранными матчами — вкладка сетки должна скроллиться горизонтально внутри своего блока, не ломая страницу)
  - `/lobbies`
  - `/matches/:id` (после Task 3 — счёт не переполняет)
  - `/leaderboard`
  - `/admin/mmr`, `/admin/players`, `/admin/tournaments` (под staff-сессией) — горизонтальная полоса разделов (Task 2) и горизонтальный скролл таблиц внутри контента, без переполнения всей страницы

- [ ] **Step 3: Contingency-фикс для `LeaderboardRow`, если ряд визуально ломается**

`LeaderboardRow` в `src/pages/LeaderboardPage.tsx:172` использует `flex flex-wrap ... sm:flex-nowrap` — на 375px сумма фиксированных колонок (ранг 48px + бейдж ранга 112px + В/П 96px + рейтинг 80px + гэпы) уже больше доступной ширины, так что перенос колонок на вторую строку ожидаем. Применяй фикс, **только если** при проверке видно, что перенос выглядит сломанным (наложение элементов, а не аккуратный перенос на новую строку).

Если фикс нужен — в `src/pages/LeaderboardPage.tsx`, внутри `LeaderboardRow`, найди блок колонки «В / П»:

```tsx
      <div className="ec-num w-24 text-center text-sm text-ink-muted">
        <span className="font-semibold text-success">{entry.wins}</span>
        {' / '}
        <span className="font-semibold text-live">{entry.losses}</span>
      </div>
```

и замени первую строку на:

```tsx
      <div className="ec-num hidden w-24 text-center text-sm text-ink-muted sm:block">
```

(остальные две строки внутри блока — `<span>`ы с `wins`/`losses` — не меняются). Колонка «В / П» скрывается строго ниже `sm` и показывается как раньше начиная с `sm` — кастомный брейкпоинт в `tailwind.config.ts` не нужен.

Если после проверки (Step 2) ряд лидерборда переносится аккуратно и без визуальных поломок — **этот шаг пропускается**, изменений в файл не вносится.

- [ ] **Step 4: Итоговая сборка**

Run: `npm run build`
Expected: без ошибок (актуально, даже если Step 3 не применялся — финальная проверка всей ветки).

- [ ] **Step 5: Commit (только если Step 3 внёс изменения)**

```bash
git add src/pages/LeaderboardPage.tsx
git commit -m "fix(mobile): скрыть колонку В/П в лидерборде на узких экранах"
```

Если Step 3 не потребовался — коммитить нечего, Task 4 завершается без коммита.

---

## Итоговая проверка плана

- [ ] `npm run build` проходит на финальном состоянии ветки.
- [ ] Все 4 задачи закоммичены отдельными коммитами (кроме Task 4, если contingency-фикс не понадобился).
- [ ] Ветка `feat/mobile-responsive` готова к код-ревью/PR.
