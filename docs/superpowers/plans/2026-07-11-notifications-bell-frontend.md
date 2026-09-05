# Frontend Notifications Bell — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Header bell with unread badge, dropdown list, and realtime SSE delivery + toast, consuming the already-shipped backend `/api/v1/notifications/**` API.

**Architecture:** Contract sync → generated types → `endpoints.ts` fetch wrappers → React Query hooks → an `EventSource` SSE hook (toast + cache update) → a `NotificationBell` component (Radix dropdown + badge) → mount in `Header`. No new global state lib; React Query is the cache.

**Tech Stack:** React 18, Vite, TypeScript (strict), React Router 6, @tanstack/react-query, Radix UI dropdown, lucide-react, Editorial Clean `ec-*` tokens, existing toast (`use-toast.ts`), `api()` client (`src/lib/api/client.ts`, cookies + CSRF).

**Repo:** DiscordForFemka-Frontend. Branch: `notifications-bell` (worktree). Base clean at origin/master.

**Spec:** `docs/superpowers/specs/2026-07-11-notifications-bell-frontend-design.md`

**No unit-test runner exists** (scripts: dev/build/preview/gen:types). The per-task gate is **typecheck/build** (`npx tsc -b` or `npm run build`) — must be zero-error. Behavior is verified manually at the end (Task 7).

Backend facts (already shipped, PRs #80 + #84):
- `GET /api/v1/notifications?page=&size=` → `PageDto<NotificationDto>` = `{ items, page, size, totalItems, totalPages }` (matches frontend `PagedResponse<T>`).
- `GET /api/v1/notifications/unread-count` → `{ "count": number }`.
- `POST /api/v1/notifications/{id}/read` → 204. `POST /api/v1/notifications/read-all` → 204.
- `GET /api/v1/notifications/stream` → SSE, `event: notification`, `data` = JSON `NotificationDto`.
- `NotificationDto` = `{ id, type: 'MATCH_READY_CHECK'|'MATCH_LIVE', title, body, link: string|null, matchId: string|null, read: boolean, createdAt }`.

---

## File map

- Modify: `docs/contracts/openapi.yaml` — add notification paths + `NotificationDto`/`NotificationType` schemas (точечно).
- Generated: `src/lib/api/types.gen.ts` — via `npm run gen:types`.
- Modify: `src/lib/api/types.ts` — add friendly aliases.
- Modify: `src/lib/api/endpoints.ts` — 4 fetch wrappers.
- Modify: `src/lib/queries.ts` — `qk` keys + 4 hooks.
- Create: `src/lib/notifications/useNotificationStream.ts` — SSE hook.
- Create: `src/components/NotificationBell.tsx` — bell + dropdown.
- Modify: `src/components/Header.tsx` — mount the bell.

---

## Task 1: Contract sync + generated types + aliases

**Files:** `docs/contracts/openapi.yaml`, `src/lib/api/types.gen.ts` (generated), `src/lib/api/types.ts`

- [ ] **Step 1: Add the two schemas under `components/schemas` in `docs/contracts/openapi.yaml`.**
First open the file and confirm the `nullable` style (it's OpenAPI 3.0-style `nullable: true`) and that a `Page` schema exists (used by other list endpoints). Add, next to related schemas:

```yaml
    NotificationType:
      type: string
      enum: [MATCH_READY_CHECK, MATCH_LIVE]
    NotificationDto:
      type: object
      properties:
        id: { type: string, format: uuid }
        type: { $ref: "#/components/schemas/NotificationType" }
        title: { type: string }
        body: { type: string }
        link: { type: string, nullable: true }
        matchId: { type: string, format: uuid, nullable: true }
        read: { type: boolean }
        createdAt: { type: string, format: date-time }
```

- [ ] **Step 2: Add the 5 paths** (mirror an existing authenticated + paginated path in this same file for `security`/response style; the file inherits a global `security: [cookieAuth: []]`, so authenticated paths omit `security:`). Insert a coherent block:

```yaml
  /api/v1/notifications:
    get:
      tags: [Notification]
      summary: Список уведомлений текущего игрока (новые сверху)
      parameters:
        - $ref: "#/components/parameters/Page"
        - $ref: "#/components/parameters/Size"
      responses:
        "200":
          description: ок
          content:
            application/json:
              schema:
                allOf:
                  - $ref: "#/components/schemas/Page"
                  - type: object
                    properties:
                      items:
                        type: array
                        items: { $ref: "#/components/schemas/NotificationDto" }
        "401": { $ref: "#/components/responses/Unauthenticated" }
  /api/v1/notifications/unread-count:
    get:
      tags: [Notification]
      summary: Количество непрочитанных уведомлений
      responses:
        "200":
          description: ок
          content:
            application/json:
              schema:
                type: object
                properties:
                  count: { type: integer, format: int64 }
        "401": { $ref: "#/components/responses/Unauthenticated" }
  /api/v1/notifications/{id}/read:
    post:
      tags: [Notification]
      summary: Отметить уведомление прочитанным
      parameters:
        - $ref: "#/components/parameters/IdInPath"
      responses:
        "204": { description: отмечено }
        "401": { $ref: "#/components/responses/Unauthenticated" }
        "404": { $ref: "#/components/responses/NotFound" }
  /api/v1/notifications/read-all:
    post:
      tags: [Notification]
      summary: Отметить все уведомления прочитанными
      responses:
        "204": { description: отмечено }
        "401": { $ref: "#/components/responses/Unauthenticated" }
  /api/v1/notifications/stream:
    get:
      tags: [Notification]
      summary: Поток уведомлений (SSE)
      description: >-
        Server-Sent Events. Каждое событие `notification` несёт в `data` JSON
        одного NotificationDto.
      responses:
        "200":
          description: поток
          content:
            text/event-stream:
              schema: { type: string }
        "401": { $ref: "#/components/responses/Unauthenticated" }
```

Note: the referenced `$ref`s (`Page`, `Size`, `IdInPath`, `Unauthenticated`, `NotFound`) must exist in this file — grep for each; if a name differs (e.g. the id-path param is named differently), use this repo's actual name. If `Page`/`Unauthenticated`/`NotFound` don't exist here, the paths still gen fine as long as the two schemas do — but prefer to wire real refs. If a ref genuinely doesn't exist, inline the equivalent rather than inventing a name.

- [ ] **Step 3: Regenerate types.** Run:
`cd "C:/Users/timka/IdeaProjects/DiscordForFemka-Frontend.wt-notifications-bell" && npm run gen:types`
Then confirm the schemas landed:
`grep -nE "NotificationDto|NotificationType" src/lib/api/types.gen.ts | head`
Expected: both appear under `components["schemas"]`.

- [ ] **Step 4: Add friendly aliases** to `src/lib/api/types.ts`, near the other `export type X = S['X'];` lines (top of file, after `type S = components['schemas'];`):

```ts
export type NotificationDto = S['NotificationDto'];
export type NotificationType = S['NotificationType'];
```

- [ ] **Step 5: Typecheck.** Run:
`npx tsc -b`
Expected: exit 0, no errors.

- [ ] **Step 6: Commit.**
```
git add docs/contracts/openapi.yaml src/lib/api/types.gen.ts src/lib/api/types.ts
git commit -m "feat(notifications): контракт + генерируемые типы уведомлений"
```

---

## Task 2: API fetch wrappers

**Files:** `src/lib/api/endpoints.ts`

- [ ] **Step 1: Add the imports.** `PagedResponse` is already imported from `./types`; add `NotificationDto` to that same import list. `api` is already imported from `./client`.

- [ ] **Step 2: Append the four functions** (mirror the existing `getSession`/`updateMe` style in the file):

```ts
export async function getNotifications(
  page = 0,
  size = 20,
): Promise<PagedResponse<NotificationDto>> {
  return api<PagedResponse<NotificationDto>>(
    `/api/v1/notifications?page=${page}&size=${size}`,
  );
}

export async function getUnreadCount(): Promise<{ count: number }> {
  return api<{ count: number }>('/api/v1/notifications/unread-count');
}

export async function markNotificationRead(id: string): Promise<void> {
  await api<void>(`/api/v1/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await api<void>('/api/v1/notifications/read-all', { method: 'POST' });
}
```

- [ ] **Step 3: Typecheck.** `npx tsc -b` → exit 0.

- [ ] **Step 4: Commit.**
```
git add src/lib/api/endpoints.ts
git commit -m "feat(notifications): fetch-обёртки эндпоинтов уведомлений"
```

---

## Task 3: React Query hooks

**Files:** `src/lib/queries.ts`

- [ ] **Step 1: Add query keys** to the `qk` object (append inside the literal):

```ts
  notificationsUnread: ['notifications', 'unread'] as const,
  notificationsList: (page: number, size: number) =>
    ['notifications', 'list', page, size] as const,
```

- [ ] **Step 2: Add imports** at the top of `queries.ts`: the four endpoint fns (`getNotifications`, `getUnreadCount`, `markNotificationRead`, `markAllNotificationsRead`) from `./api/endpoints`, and the `NotificationDto`, `PagedResponse` types from `./api/types` (add to existing import groups). `useQuery`, `useMutation`, `useQueryClient` are already imported.

- [ ] **Step 3: Add the hooks** (mirror `useSeasonsList` and `useUpdateMe` styles already in the file):

```ts
export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: qk.notificationsUnread,
    queryFn: getUnreadCount,
    enabled,
    staleTime: 30_000,
  });
}

export function useNotifications(page = 0, size = 20, enabled = true) {
  return useQuery({
    queryKey: qk.notificationsList(page, size),
    queryFn: () => getNotifications(page, size),
    enabled,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notificationsUnread });
      qc.invalidateQueries({ queryKey: ['notifications', 'list'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notificationsUnread });
      qc.invalidateQueries({ queryKey: ['notifications', 'list'] });
    },
  });
}
```

- [ ] **Step 4: Typecheck.** `npx tsc -b` → exit 0.

- [ ] **Step 5: Commit.**
```
git add src/lib/queries.ts
git commit -m "feat(notifications): RQ-хуки (unread-count, список, mark-read)"
```

---

## Task 4: SSE stream hook

**Files:** `src/lib/notifications/useNotificationStream.ts` (create)

- [ ] **Step 1: Create the hook.** It opens an `EventSource` when authenticated, toasts + updates the RQ cache on each `notification` event, resyncs the unread count on (re)connect, and closes on cleanup.

```ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { qk } from '@/lib/queries';
import { useToast } from '@/components/ui/use-toast';
import type { NotificationDto } from '@/lib/api/types';

/**
 * Opens the notifications SSE stream while authenticated. On each incoming
 * notification: shows a toast, bumps the unread-count cache, and invalidates the
 * list so an open dropdown refreshes. The browser auto-reconnects EventSource;
 * on (re)open we resync the unread count in case events were missed.
 */
export function useNotificationStream() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) return;

    const es = new EventSource('/api/v1/notifications/stream', {
      withCredentials: true,
    });

    const onNotification = (e: MessageEvent) => {
      let dto: NotificationDto | null = null;
      try {
        dto = JSON.parse(e.data) as NotificationDto;
      } catch {
        return;
      }
      toast({ title: dto.title, description: dto.body ?? undefined });
      qc.setQueryData<{ count: number }>(qk.notificationsUnread, (prev) => ({
        count: (prev?.count ?? 0) + 1,
      }));
      qc.invalidateQueries({ queryKey: ['notifications', 'list'] });
    };

    es.addEventListener('notification', onNotification as EventListener);
    es.onopen = () => {
      qc.invalidateQueries({ queryKey: qk.notificationsUnread });
    };
    es.onerror = () => {
      // EventSource reconnects on its own; nothing to do. Log in dev only.
      if (import.meta.env.DEV) console.debug('notifications SSE error (will retry)');
    };

    return () => {
      es.removeEventListener('notification', onNotification as EventListener);
      es.close();
    };
  }, [isAuthenticated, qc, toast]);
}
```

Note: confirm the `@/` path alias resolves (the repo uses `@/lib/...` imports — see `PlayerHoverCard.tsx` importing `@/lib/format`). Confirm the toast hook's exact export name/path is `useToast` from `@/components/ui/use-toast` (open that file; adapt if it exports differently, e.g. a bare `toast`).

- [ ] **Step 2: Typecheck.** `npx tsc -b` → exit 0.

- [ ] **Step 3: Commit.**
```
git add src/lib/notifications/useNotificationStream.ts
git commit -m "feat(notifications): SSE-хук (toast + обновление кэша)"
```

---

## Task 5: NotificationBell component

**Files:** `src/components/NotificationBell.tsx` (create)

- [ ] **Step 1: Create the component.** Renders nothing unless authenticated. Mounts the SSE hook. Bell button with unread badge; Radix dropdown with header + "прочитать все" + list (icon per type, title, body, relative time, unread highlight). Click item → mark read + navigate.

Mirror the existing Radix dropdown usage in `Header.tsx` (imports from `@/components/ui/dropdown-menu`), the `Badge` from `@/components/ui/badge`, `timeAgoRu` from `@/lib/format`, and lucide icons.

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Swords, Radio } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import {
  useUnreadCount,
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/lib/queries';
import { useNotificationStream } from '@/lib/notifications/useNotificationStream';
import { timeAgoRu } from '@/lib/format';
import type { NotificationDto, NotificationType } from '@/lib/api/types';

function typeIcon(type: NotificationType) {
  return type === 'MATCH_READY_CHECK' ? Swords : Radio;
}

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  useNotificationStream();

  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const unread = useUnreadCount(isAuthenticated);
  const list = useNotifications(0, 20, isAuthenticated && open);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  if (!isAuthenticated) return null;

  const count = unread.data?.count ?? 0;
  const items: NotificationDto[] = list.data?.items ?? [];

  const onItemClick = (n: NotificationDto) => {
    if (!n.read) markRead.mutate(n.id);
    if (n.link) navigate(n.link);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Уведомления"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge
              variant="default"
              className="absolute -right-0.5 -top-0.5 h-4 min-w-4 justify-center px-1 text-[10px]"
            >
              {count > 99 ? '99+' : count}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-line px-3 py-2">
          <span className="text-sm font-semibold text-ink">Уведомления</span>
          {count > 0 && (
            <button
              className="text-xs text-ink-muted hover:text-ink disabled:opacity-50"
              disabled={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              Прочитать все
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {list.isLoading ? (
            <p className="px-3 py-6 text-center text-sm text-ink-muted">Загрузка…</p>
          ) : list.isError ? (
            <p className="px-3 py-6 text-center text-sm text-ink-muted">
              Не удалось загрузить
            </p>
          ) : items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-ink-muted">
              Пока нет уведомлений
            </p>
          ) : (
            items.map((n) => {
              const Icon = typeIcon(n.type);
              return (
                <button
                  key={n.id}
                  onClick={() => onItemClick(n)}
                  className={`flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-secondary ${
                    n.read ? '' : 'bg-accent'
                  }`}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{n.title}</span>
                    <span className="block truncate text-xs text-ink-muted">{n.body}</span>
                    <span className="block text-[11px] text-ink-faint">
                      {timeAgoRu(n.createdAt)}
                    </span>
                  </span>
                  {!n.read && (
                    <span className="ec-dot mt-1.5 shrink-0 bg-brand" aria-hidden />
                  )}
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Note: verify exact export names of the dropdown primitives in `@/components/ui/dropdown-menu` (they were used in `Header.tsx` as `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`). Verify `Badge` accepts `variant` + `className`. Verify `timeAgoRu` returns `string | null` — coerce to `''` if the styling needs a string (`timeAgoRu(n.createdAt) ?? ''`). Verify `text-ink`, `text-ink-muted`, `text-ink-faint`, `bg-accent`, `bg-secondary`, `border-line`, `text-brand`, `bg-brand`, `.ec-dot` are all valid in this repo's Tailwind/`index.css` (they were reported present; if a token name differs, use the real one).

- [ ] **Step 2: Typecheck.** `npx tsc -b` → exit 0. Fix any token/type mismatches surfaced.

- [ ] **Step 3: Commit.**
```
git add src/components/NotificationBell.tsx
git commit -m "feat(notifications): компонент-колокольчик (бейдж, выпадашка, mark-read)"
```

---

## Task 6: Mount in Header + full build

**Files:** `src/components/Header.tsx`

- [ ] **Step 1: Import** `NotificationBell`:
```ts
import { NotificationBell } from './NotificationBell';
```

- [ ] **Step 2: Insert** `<NotificationBell />` into the right-side flex container of the header, immediately **before** the authenticated avatar `DropdownMenu`. The bell self-gates on auth (returns null when logged out), so it can go just inside the same `flex items-center gap-3` wrapper that holds the profile dropdown. Do not duplicate an auth check that changes layout — place it as a sibling before the avatar block.

- [ ] **Step 3: Full build (typecheck + bundle).** Run:
`cd "C:/Users/timka/IdeaProjects/DiscordForFemka-Frontend.wt-notifications-bell" && npm run build`
Expected: `tsc -b` clean and `vite build` succeeds (exit 0).

- [ ] **Step 4: Commit.**
```
git add src/components/Header.tsx
git commit -m "feat(notifications): колокольчик в шапке рядом с профилем"
```

---

## Task 7: Manual verification + finish

- [ ] **Step 1: Run the dev server against staging** (real API + a real session):
`npm run dev:staging` (uses `.env.staging` `VITE_API_TARGET`), open the app, log in.
Verify:
  - Bell renders next to the profile when logged in; hidden when logged out.
  - Badge shows `unread-count`.
  - Opening the dropdown loads the list; items show title/body/relative time; unread ones highlighted.
  - Clicking an item marks it read (badge decrements) and navigates to its `link`.
  - "Прочитать все" clears the badge.
  - (If a live match event can be triggered) a new notification pops a toast and bumps the badge in realtime; otherwise confirm the SSE connection opens in devtools Network (EventStream) with 200 and stays open.

- [ ] **Step 2:** If anything is off, fix in the relevant component and re-run `npm run build`.

- [ ] **Step 3: Finish the branch** via `superpowers:finishing-a-development-branch` → push + open PR (base `master`).

- [ ] **Step 4:** Do NOT merge without user confirmation (frontend auto-deploys on merge to master).

---

## Self-review notes (author)

- **Spec coverage:** contract+types (T1), API (T2), hooks (T3), SSE+toast (T4), bell UI with per-item + mark-all read and unread highlight (T5), header mount (T6), manual verify + PR (T7). Matches the frontend spec.
- **Contract shape:** backend list returns `PageDto` (`items`/`totalItems`) after fix #84 — consumed via `PagedResponse<NotificationDto>`; the bell reads `list.data?.items`.
- **Auth gating:** bell returns null when unauthenticated; SSE hook opens only when authenticated and closes on logout/unmount.
- **No test runner:** gate is `tsc -b` per task and `npm run build` before header commit; behavior verified manually in T7.
- **Type consistency:** `NotificationDto`/`NotificationType` aliases (T1) are used across T2–T5; hook names `useUnreadCount`/`useNotifications`/`useMarkNotificationRead`/`useMarkAllNotificationsRead` consistent T3→T5.
