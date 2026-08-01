# Admin Lobby Viewer — Frontend (Phase B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin page at `/admin/lobbies` that lists active Dota 2 lobbies with per-team rosters and a per-player Kick button (confirm dialog + toast), polling every 5s — consuming the DiscordForFemka backend `GET /api/v1/admin/lobbies` and `DELETE /api/v1/admin/lobbies/{lobbyId}/players/{accountId}` (Phase A).

**Architecture:** Mirror the existing `AdminBotsPage` vertical: hand-typed DTOs in `types.ts` (openapi escape-hatch), thin `endpoints.ts` fns over the `api<T>` client, react-query hooks in `queries.ts` (polling list + kick mutation invalidating the list), a default-export page under `src/pages/admin/`, wired into the `/admin` route block (role-gated by `AdminLayout`). Player identity uses `PlayerNameLink` (falls back to raw Steam32 when unlinked); heroes via `HeroIcon`.

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind + shadcn/radix + @tanstack/react-query v5 + react-router v6. Node 24 / npm 11 on host. No page test harness in this repo — verification is `tsc -b` typecheck + `npm run build`.

Spec: `../../../DiscordForFemka/docs/superpowers/specs/2026-07-29-admin-lobby-viewer-design.md` (backend repo). Repo: `C:\Users\timka\IdeaProjects\DiscordForFemka-Frontend`, branch `feat/admin-lobby-viewer` (off `origin/master`).

---

## Build & test environment (READ FIRST)

Node/npm are on the host — build natively (no Docker). Use the **Bash** tool (paths are fine for npm). Run from the repo root:
- Typecheck: `cd /c/Users/timka/IdeaProjects/DiscordForFemka-Frontend && npx tsc -b`
- Full build (typecheck + bundle): `npm run build`

There is **no** `typecheck` script and **no** page unit tests; `tsc -b` is the fast per-task gate, `npm run build` is the final gate. The base branch already builds green. Commit **locally only** — do NOT push (that's the finishing step). Commit cwd-safely with `git -C "/c/Users/timka/IdeaProjects/DiscordForFemka-Frontend" ...`.

**Contract note:** the two backend DTOs are NOT yet in this repo's `docs/contracts/openapi.yaml`, so we hand-type them in `src/lib/api/types.ts` with a `// Not in openapi.yaml — typed manually.` comment — the repo's established escape hatch (see the existing `BotStatusDto`). Regenerating from openapi is a separate follow-up, out of scope here.

---

## File Structure

- Modify `src/lib/api/types.ts` — add `AdminLobbyMemberDto` + `AdminLobbyDto` interfaces.
- Modify `src/lib/api/endpoints.ts` — add `listAdminLobbies()` + `adminKickLobbyPlayer(lobbyId, accountId)`.
- Modify `src/lib/queries.ts` — add `qk.adminLobbies`, `useAdminLobbies()`, `useAdminKickLobbyPlayer()`.
- Create `src/pages/admin/AdminLobbiesPage.tsx` — the page (default export).
- Modify `src/pages/admin/AdminLayout.tsx` — add the nav item.
- Modify `src/App.tsx` — add the eager import + route.

---

### Task 1: API wiring (types + endpoint + query hooks)

Adds exported symbols consumed by Task 2. `tsc -b` stays green (unused exports are not errors).

**Files:**
- Modify: `src/lib/api/types.ts`
- Modify: `src/lib/api/endpoints.ts`
- Modify: `src/lib/queries.ts`

- [ ] **Step 1: Add DTOs to `src/lib/api/types.ts`**

Append near the existing `BotStatusDto` (same file). Add:

```ts
// Admin: Dota lobbies (proxy to Dota2API). Not in openapi.yaml — typed manually.
// Mirrors DiscordForFemka AdminLobbyDto/AdminLobbyMemberDto (platform.admin.lobby.dto).
// playerId/nickname/avatarUrl are null when the Steam account is not linked to a platform player.
export interface AdminLobbyMemberDto {
  accountId: number;
  team: string;
  slot: number;
  heroId: number;
  playerId: string | null;
  nickname: string | null;
  avatarUrl: string | null;
}

export interface AdminLobbyDto {
  lobbyId: number;
  botUsername: string;
  gameName: string;
  state: number;
  gameState: number;
  memberCount: number;
  members: AdminLobbyMemberDto[];
}
```

- [ ] **Step 2: Add endpoint fns to `src/lib/api/endpoints.ts`**

Add `AdminLobbyDto` to the existing `import type { ... } from './types';` line (the one that already imports `BotStatusDto`). Then add, near the `// Admin: Dota bots` section:

```ts
// ──────────────── Admin: Dota lobbies ────────────────

export function listAdminLobbies(): Promise<AdminLobbyDto[]> {
  return api<AdminLobbyDto[]>('/api/v1/admin/lobbies');
}

export function adminKickLobbyPlayer(lobbyId: number, accountId: number): Promise<void> {
  return api<void>(
    `/api/v1/admin/lobbies/${lobbyId}/players/${accountId}`,
    { method: 'DELETE' },
  );
}
```

- [ ] **Step 3: Add query hooks to `src/lib/queries.ts`**

(a) In the `qk` factory object, add next to `adminBots`:
```ts
  adminLobbies: ['adminLobbies'] as const,
```
(b) Ensure `listAdminLobbies` and `adminKickLobbyPlayer` are added to the existing import from `./lib/api/endpoints` (the import that already brings in `listAdminBots`, `adminBotLeaveLobby`, …), and `AdminLobbyDto` to the import from `./lib/api/types`. (`useQuery`, `useMutation`, `useQueryClient` are already imported.)
(c) Add near the `// Admin: Dota bots` hooks:
```ts
// ──────────────── Admin: Dota lobbies ────────────────

export function useAdminLobbies() {
  return useQuery<AdminLobbyDto[]>({
    queryKey: qk.adminLobbies,
    queryFn: listAdminLobbies,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
}

export function useAdminKickLobbyPlayer() {
  const qc = useQueryClient();
  return useMutation<void, Error, { lobbyId: number; accountId: number }>({
    mutationFn: ({ lobbyId, accountId }) => adminKickLobbyPlayer(lobbyId, accountId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminLobbies }),
  });
}
```

- [ ] **Step 4: Typecheck**

Run: `cd /c/Users/timka/IdeaProjects/DiscordForFemka-Frontend && npx tsc -b`
Expected: exits 0, no errors. (Verify the import paths you added resolve — `./types` / `./lib/api/endpoints` per the existing lines in each file.)

- [ ] **Step 5: Commit**

```
git -C "/c/Users/timka/IdeaProjects/DiscordForFemka-Frontend" add src/lib/api/types.ts src/lib/api/endpoints.ts src/lib/queries.ts
git -C "/c/Users/timka/IdeaProjects/DiscordForFemka-Frontend" commit -m "feat(admin-lobby): типы, endpoints и query-хуки для просмотра лобби"
```

---

### Task 2: `AdminLobbiesPage`

The page. Mirrors `AdminBotsPage` scaffolding (header + count, Skeleton/error/empty), renders each lobby as a card with a Radiant/Dire/Прочие roster grid, per-player Kick with a controlled confirm `Dialog` + toast (the `MatchAdminMenu` pattern), 5s polling via `useAdminLobbies`.

**Files:**
- Create: `src/pages/admin/AdminLobbiesPage.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { HeroIcon } from '@/components/match/HeroIcon';
import { PlayerNameLink } from '@/components/PlayerNameLink';
import { ProblemDetailError } from '@/lib/api/client';
import type { AdminLobbyDto, AdminLobbyMemberDto } from '@/lib/api/types';
import { useAdminKickLobbyPlayer, useAdminLobbies } from '@/lib/queries';

const LOBBY_STATE_LABEL: Record<number, string> = {
  0: 'UI',
  1: 'SERVERSETUP',
  2: 'RUN',
  3: 'POSTGAME',
  4: 'READYUP',
  5: 'NOTREADY',
  6: 'SERVERASSIGN',
};

const TEAM_GROUPS: Array<{ key: string; label: string; teams: string[] }> = [
  { key: 'radiant', label: 'Radiant', teams: ['RADIANT'] },
  { key: 'dire', label: 'Dire', teams: ['DIRE'] },
  { key: 'other', label: 'Прочие', teams: ['PLAYER_POOL', 'BROADCASTER', 'SPECTATOR', 'NOTEAM'] },
];

function describeError(err: unknown): string {
  if (err instanceof ProblemDetailError) {
    return err.detail ?? err.title;
  }
  if (err instanceof Error) return err.message;
  return 'неизвестная ошибка';
}

type KickTarget = { lobbyId: number; accountId: number; label: string };

export default function AdminLobbiesPage() {
  const { toast } = useToast();
  const q = useAdminLobbies();
  const kick = useAdminKickLobbyPlayer();
  const [target, setTarget] = useState<KickTarget | null>(null);

  async function confirmKick() {
    if (!target) return;
    try {
      await kick.mutateAsync({ lobbyId: target.lobbyId, accountId: target.accountId });
      toast({ title: 'Игрок кикнут', description: target.label });
      setTarget(null);
    } catch (err) {
      toast({
        title: 'Не удалось кикнуть',
        description: `${target.label}: ${describeError(err)}`,
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Лобби Dota 2</h1>
        <div className="text-sm text-muted-foreground">
          {q.data?.length ?? 0} активных · обновляется каждые 5 с
        </div>
      </div>

      {q.isLoading && <Skeleton className="h-64 w-full" />}

      {q.isError && (
        <div className="text-sm text-destructive">
          Не удалось загрузить список: {describeError(q.error)}
        </div>
      )}

      {q.data && q.data.length === 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          Нет активных лобби.
        </div>
      )}

      {q.data?.map((lobby) => (
        <LobbyCard
          key={lobby.lobbyId}
          lobby={lobby}
          pendingAccountId={
            kick.isPending && kick.variables?.lobbyId === lobby.lobbyId
              ? kick.variables?.accountId
              : undefined
          }
          onKick={(m) =>
            setTarget({
              lobbyId: lobby.lobbyId,
              accountId: m.accountId,
              label: m.nickname ?? String(m.accountId),
            })
          }
        />
      ))}

      <Dialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Кикнуть игрока?</DialogTitle>
            <DialogDescription>
              {target
                ? `${target.label} будет полностью удалён из лобби ${target.lobbyId}.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTarget(null)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={confirmKick} disabled={kick.isPending}>
              {kick.isPending ? 'Кик…' : 'Кикнуть'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LobbyCard({
  lobby,
  onKick,
  pendingAccountId,
}: {
  lobby: AdminLobbyDto;
  onKick: (m: AdminLobbyMemberDto) => void;
  pendingAccountId?: number;
}) {
  return (
    <div className="rounded-md border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {lobby.gameName || `Лобби ${lobby.lobbyId}`}
          </span>
          <Badge variant="secondary">
            {LOBBY_STATE_LABEL[lobby.state] ?? `state ${lobby.state}`}
          </Badge>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          bot {lobby.botUsername} · {lobby.memberCount} чел · id {lobby.lobbyId}
        </div>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-3">
        {TEAM_GROUPS.map((group) => {
          const members = lobby.members
            .filter((m) => group.teams.includes(m.team))
            .sort((a, b) => a.slot - b.slot);
          return (
            <div key={group.key}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label} ({members.length})
              </div>
              <div className="space-y-1">
                {members.length === 0 && (
                  <div className="text-xs text-muted-foreground">—</div>
                )}
                {members.map((m) => (
                  <MemberRow
                    key={m.accountId}
                    m={m}
                    pending={pendingAccountId === m.accountId}
                    onKick={() => onKick(m)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MemberRow({
  m,
  onKick,
  pending,
}: {
  m: AdminLobbyMemberDto;
  onKick: () => void;
  pending: boolean;
}) {
  const initials = (m.nickname ?? String(m.accountId)).slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <HeroIcon heroId={m.heroId} size={24} />
      <Avatar className="h-6 w-6">
        <AvatarImage src={m.avatarUrl ?? undefined} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 truncate text-sm">
        {m.playerId ? (
          <PlayerNameLink playerId={m.playerId} nickname={m.nickname} />
        ) : (
          <span className="font-mono text-xs text-muted-foreground">{m.accountId}</span>
        )}
      </div>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={onKick}
        title="Полный кик из лобби"
      >
        {pending ? '…' : 'Kick'}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /c/Users/timka/IdeaProjects/DiscordForFemka-Frontend && npx tsc -b`
Expected: exits 0, no errors. (The page is not yet routed — that's Task 3 — but it must typecheck standalone.)

- [ ] **Step 3: Commit**

```
git -C "/c/Users/timka/IdeaProjects/DiscordForFemka-Frontend" add src/pages/admin/AdminLobbiesPage.tsx
git -C "/c/Users/timka/IdeaProjects/DiscordForFemka-Frontend" commit -m "feat(admin-lobby): страница AdminLobbiesPage (состав + кик)"
```

---

### Task 3: Wire routing + nav

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/admin/AdminLayout.tsx`

- [ ] **Step 1: Add the eager import + route in `src/App.tsx`**

Add the import alongside the other admin page imports (near `import AdminBotsPage from '@/pages/admin/AdminBotsPage';`):
```tsx
import AdminLobbiesPage from '@/pages/admin/AdminLobbiesPage';
```
Add the route inside the `<Route path="/admin" ...>` block, next to the `bots` route:
```tsx
          <Route path="lobbies" element={<AdminLobbiesPage />} />
```

- [ ] **Step 2: Add the nav item in `src/pages/admin/AdminLayout.tsx`**

In the `NAV` array, add (e.g. right after the `bots` entry):
```tsx
  { to: '/admin/lobbies', label: 'Лобби' },
```

- [ ] **Step 3: Full build (typecheck + bundle)**

Run: `cd /c/Users/timka/IdeaProjects/DiscordForFemka-Frontend && npm run build`
Expected: `tsc -b` passes and `vite build` completes ("✓ built in …"), exit 0. This is the authoritative gate — the base branch builds green, so any failure is from these changes.

- [ ] **Step 4: Commit**

```
git -C "/c/Users/timka/IdeaProjects/DiscordForFemka-Frontend" add src/App.tsx src/pages/admin/AdminLayout.tsx
git -C "/c/Users/timka/IdeaProjects/DiscordForFemka-Frontend" commit -m "feat(admin-lobby): маршрут /admin/lobbies + пункт навигации"
```

---

### Task 4: Final verification

- [ ] **Step 1: Clean build from scratch**

Run: `cd /c/Users/timka/IdeaProjects/DiscordForFemka-Frontend && npm run build`
Expected: exit 0, `vite build` success. Confirms the whole feature typechecks and bundles.

- [ ] **Step 2: (Manual, optional) smoke test**

Runtime behavior needs the platform backend (with the Phase A branch) + Dota2API running. If that stack is up: `npm run dev`, log in as MODERATOR/ADMIN, open `/admin/lobbies`, confirm the list renders, rosters group by team, and Kick shows the confirm dialog → toast. This is a manual check (no automated page tests in this repo); note it as such, do not claim it as an automated pass.

---

## Self-Review

**Spec coverage (Frontend section):**
- `endpoints.ts` `listAdminLobbies()` + `kickLobbyPlayer` → Task 1. ✅
- `queries.ts` `qk.adminLobbies`, `useAdminLobbies()` (poll 5s), `useAdminKickLobbyPlayer()` invalidating the list → Task 1. ✅
- `AdminLobbiesPage`: header+count, Skeleton/error/empty, per-lobby card with state badge + bot + memberCount, roster grouped Radiant/Dire/Прочие (sorted by slot), `PlayerNameLink`+`Avatar` (raw Steam32 when unlinked), `HeroIcon` (heroId 0 → placeholder), destructive Kick → confirm `Dialog` → mutate → toast, per-row pending → Task 2. ✅
- Types hand-declared in `types.ts` (openapi escape hatch) → Task 1. ✅
- Routing under `/admin` + nav item, role gating inherited from `AdminLayout` (MODERATOR/ADMIN) → Task 3. ✅
- Testing = typecheck + build; manual smoke noted honestly (no page test harness) → Tasks 3-4. ✅

**Placeholder scan:** No TBD/TODO; page/hooks/endpoints shown in full; every run step has an exact command + expected result. ✅

**Type consistency:** `AdminLobbyDto`/`AdminLobbyMemberDto` field names (`lobbyId, botUsername, gameName, state, gameState, memberCount, members` / `accountId, team, slot, heroId, playerId, nickname, avatarUrl`) match the backend records and the OpenAPI schemas from Phase A. `useAdminKickLobbyPlayer` variables `{ lobbyId: number; accountId: number }` are consumed identically in the page (`kick.variables?.lobbyId/accountId`, `mutateAsync({ lobbyId, accountId })`). `PlayerNameLink` props (`playerId: string|null`, `nickname?: string|null`) and `HeroIcon` prop (`heroId: number`) match the real component signatures. Page is a default export, imported eagerly in `App.tsx` like its siblings. ✅
