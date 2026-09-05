# Конструктор достижений и квестов — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin UI for the achievement/quest constructor (hero-group manager, achievement builder, quest builder embedded in tournament admin) plus a player-profile achievements card, consuming the backend REST API from `DiscordForFemka` [PR #111](https://github.com/OziePozie/DiscordForFemka/pull/111).

**Architecture:** Two new admin pages (`AdminHeroGroupsPage`, `AdminAchievementsPage`) following the exact `AdminSeasonsPage` CRUD-dialog pattern; a `QuestsDialogBody` embedded into `AdminTournamentsPage` following its `GroupEditDialogBody` pattern; a new "Достижения" `Card` in `PlayerPublicPage`. Two shared components (`HeroMultiPicker`, `ConditionBuilder`). Hand-written types in `types.ts` (backend not yet merged, `openapi.yaml` here is stale).

**Tech Stack:** React 18 + Vite + TypeScript + Tailwind + shadcn/ui + `@tanstack/react-query` v5. No react-hook-form/zod, no test harness for pages — verification is `tsc -b` + manual browser smoke test.

**Reference spec:** `docs/superpowers/specs/2026-08-01-gamification-achievements-quests-design.md`

**Working directory for every task:** `C:\Users\timka\IdeaProjects\DiscordForFemka-Frontend\.claude\worktrees\gamification-achievements-quests` (isolated worktree, branch `feat/gamification-achievements-quests`, `node_modules` is a directory junction to the main checkout — already set up, don't run `npm install`/`npm ci`).

**Verify command for every task** (no separate `typecheck` script in this repo — `tsc -b` alone, not the slower full `npm run build`):
```powershell
npx tsc -b
```
Expected: no output = success. Any output = compile errors, must fix before committing.

---

### Task 1: Types + endpoints + queries — hero groups & heroes catalog

**Files:**
- Modify: `src/lib/api/types.ts`
- Modify: `src/lib/api/endpoints.ts`
- Modify: `src/lib/queries.ts`

- [ ] **Step 1: Add types**

In `src/lib/api/types.ts`, add near the bottom of the file (after the last DTO block, before the `_LABEL` const maps section — keep one blank line of separation, follow the existing `// TODO: regenerate openapi` comment convention exactly):

```ts
// Gamification: hero groups, achievements, quests
// TODO: regenerate openapi — backend PR https://github.com/OziePozie/DiscordForFemka/pull/111
// not yet merged, docs/contracts/openapi.yaml here is stale relative to it.
export type ConditionType = 'HERO_POOL' | 'WIN_REQUIRED';
export type GamificationStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ConditionRowDto {
  type: ConditionType;
  heroGroupId?: string | null;
  minPlayers?: number | null;
}

export interface HeroGroupDto {
  id: string;
  name: string;
  heroIds: number[];
}

export interface CreateHeroGroupRequest {
  name: string;
  heroIds: number[];
}

export interface UpdateHeroGroupRequest {
  name?: string;
  heroIds?: number[];
}

export interface DotaHeroDto {
  id: number;
  name: string;
}
```

Then, in the existing `_LABEL` const-maps section (near `SEASON_STATUS_LABEL`/`TOURNAMENT_STATUS_LABEL`), add:

```ts
export const CONDITION_TYPE_LABEL: Record<ConditionType, string> = {
  HERO_POOL: 'Пул героев в команде',
  WIN_REQUIRED: 'Обязательная победа',
};

export const GAMIFICATION_STATUS_LABEL: Record<GamificationStatus, string> = {
  DRAFT: 'Черновик',
  PUBLISHED: 'Опубликовано',
  ARCHIVED: 'В архиве',
};
```

- [ ] **Step 2: Add endpoint functions**

In `src/lib/api/endpoints.ts`, add a new section (place it near the other admin sections, e.g. after the Admin Seasons block — search for `export function finishSeason` and insert after it):

```ts
// ──────────────── Admin: Hero groups ────────────────

export interface HeroGroupsPageParams {
  page?: number;
  size?: number;
}

export function getHeroGroupsPage(
  params: HeroGroupsPageParams = {},
): Promise<PagedResponse<HeroGroupDto>> {
  return api<PagedResponse<HeroGroupDto>>(
    `/api/v1/admin/hero-groups${buildQuery(params)}`,
  );
}

export function createHeroGroup(
  body: CreateHeroGroupRequest,
): Promise<HeroGroupDto> {
  return api<HeroGroupDto>('/api/v1/admin/hero-groups', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateHeroGroup(
  id: string,
  patch: UpdateHeroGroupRequest,
): Promise<HeroGroupDto> {
  return api<HeroGroupDto>(
    `/api/v1/admin/hero-groups/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(patch) },
  );
}

export function deleteHeroGroup(id: string): Promise<void> {
  return api<void>(`/api/v1/admin/hero-groups/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ──────────────── Dota heroes catalog ────────────────

export function getDotaHeroesCatalog(): Promise<DotaHeroDto[]> {
  return api<DotaHeroDto[]>('/api/v1/dota/heroes');
}
```

Add the new types to the existing `import type { ... } from './types'` block at the top of `endpoints.ts` (find it — it's one large multi-line import — add `HeroGroupDto, CreateHeroGroupRequest, UpdateHeroGroupRequest, DotaHeroDto,` to it, keeping alphabetical-ish grouping consistent with how the file already groups by feature).

- [ ] **Step 3: Add query keys + hooks**

In `src/lib/queries.ts`, add to the `qk` object (find it — search for `seasons: (params: SeasonsPageParams)`):

```ts
  heroGroups: (params: HeroGroupsPageParams) => ['hero-groups', params] as const,
  dotaHeroes: ['dota-heroes'] as const,
```

Add a new section (place after the "Seasons" query section, before "Tournaments" — matches Task 1's endpoint placement):

```ts
// ──────────────── Hero groups & heroes catalog ────────────────

export function useHeroGroupsList(params: HeroGroupsPageParams = {}) {
  return useQuery({
    queryKey: qk.heroGroups(params),
    queryFn: () => getHeroGroupsPage(params),
  });
}

export function useDotaHeroesCatalog() {
  return useQuery({
    queryKey: qk.dotaHeroes,
    queryFn: getDotaHeroesCatalog,
    staleTime: Infinity, // static reference data, never changes at runtime
  });
}

function invalidateHeroGroupCaches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['hero-groups'] });
}

export function useCreateHeroGroup() {
  const qc = useQueryClient();
  return useMutation<HeroGroupDto, Error, CreateHeroGroupRequest>({
    mutationFn: createHeroGroup,
    onSuccess: () => invalidateHeroGroupCaches(qc),
  });
}

export function useUpdateHeroGroup() {
  const qc = useQueryClient();
  return useMutation<
    HeroGroupDto,
    Error,
    { id: string; patch: UpdateHeroGroupRequest }
  >({
    mutationFn: ({ id, patch }) => updateHeroGroup(id, patch),
    onSuccess: () => invalidateHeroGroupCaches(qc),
  });
}

export function useDeleteHeroGroup() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteHeroGroup,
    onSuccess: () => invalidateHeroGroupCaches(qc),
  });
}
```

Add the new imports to `queries.ts`'s existing `import { ... } from './api/endpoints'` and `import type { ... } from './api/types'` blocks (both are large multi-line imports near the top of the file — add `getHeroGroupsPage, createHeroGroup, updateHeroGroup, deleteHeroGroup, getDotaHeroesCatalog,` to the endpoints import, and `HeroGroupsPageParams,` to whichever import block already pulls in `SeasonsPageParams` from `./api/endpoints` — note `HeroGroupsPageParams` is a type defined in `endpoints.ts`, not `types.ts`, so it goes in the endpoints-import block; `HeroGroupDto, CreateHeroGroupRequest, UpdateHeroGroupRequest, DotaHeroDto` go in the types-import block).

- [ ] **Step 4: Verify**

```powershell
npx tsc -b
```
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/types.ts src/lib/api/endpoints.ts src/lib/queries.ts
git commit -m "feat(gamification): типы/endpoints/хуки для hero-groups и справочника героев"
```

## Context

This is Task 1 of a 10-task plan. `PagedResponse<T>` already exists in `types.ts` — don't redefine it. `buildQuery` already exists in `endpoints.ts` — don't redefine it. This task only adds data-layer plumbing, no UI yet — Task 2/3 build on it. Follow the exact `Season`-equivalent patterns already in both files (shown above) — this repo has no generic CRUD-hook factory, every resource gets its own explicit hooks, verbose but consistent; don't try to abstract/genericize, that would be inconsistent with the rest of the file.

---

### Task 2: `HeroMultiPicker` component

**Files:**
- Create: `src/components/admin/HeroMultiPicker.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { useMemo, useState } from 'react';
import { HeroIcon } from '@/components/match/HeroIcon';
import { Input } from '@/components/ui/input';
import { useDotaHeroesCatalog } from '@/lib/queries';
import { cn } from '@/lib/utils';

interface Props {
  selected: number[];
  onChange: (heroIds: number[]) => void;
  disabled?: boolean;
}

/**
 * Grid of hero tiles, click-to-toggle selection, with a name filter. No shadcn
 * Command/Popover in this repo yet — hand-rolled to match the codebase's low-tooling
 * bias (see `broadcasterAccountIds` CSV-input precedent in AdminTournamentsPage).
 */
export function HeroMultiPicker({ selected, onChange, disabled }: Props) {
  const heroesQ = useDotaHeroesCatalog();
  const [filter, setFilter] = useState('');

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const filtered = useMemo(() => {
    const all = heroesQ.data ?? [];
    const f = filter.trim().toLowerCase();
    if (!f) return all;
    return all.filter((h) => h.name.toLowerCase().includes(f));
  }, [heroesQ.data, filter]);

  function toggle(heroId: number) {
    if (disabled) return;
    if (selectedSet.has(heroId)) {
      onChange(selected.filter((id) => id !== heroId));
    } else {
      onChange([...selected, heroId]);
    }
  }

  return (
    <div className="space-y-2">
      <Input
        placeholder="Поиск героя…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        disabled={disabled}
      />
      {heroesQ.isLoading && (
        <div className="text-sm text-muted-foreground">Загрузка героев…</div>
      )}
      {heroesQ.isError && (
        <div className="text-sm text-destructive">
          Не удалось загрузить справочник героев.
        </div>
      )}
      {heroesQ.data && (
        <div className="grid max-h-64 grid-cols-6 gap-2 overflow-y-auto rounded-md border p-2 sm:grid-cols-8">
          {filtered.map((hero) => {
            const isSelected = selectedSet.has(hero.id);
            return (
              <button
                key={hero.id}
                type="button"
                onClick={() => toggle(hero.id)}
                disabled={disabled}
                title={hero.name}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-md border p-1 text-center transition-colors',
                  isSelected
                    ? 'border-primary bg-accent'
                    : 'border-transparent hover:bg-accent/50',
                  disabled && 'cursor-not-allowed opacity-50',
                )}
              >
                <HeroIcon heroId={hero.id} size={40} />
                <span className="line-clamp-1 text-[10px] text-muted-foreground">
                  {hero.name}
                </span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full py-4 text-center text-sm text-muted-foreground">
              Ничего не найдено
            </div>
          )}
        </div>
      )}
      <div className="text-xs text-muted-foreground">
        Выбрано героев: {selected.length}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```powershell
npx tsc -b
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/HeroMultiPicker.tsx
git commit -m "feat(gamification): HeroMultiPicker — сетка героев с чекбокс-тогглом"
```

## Context

Task 2 of 10. Depends on Task 1 (`useDotaHeroesCatalog`, already committed). `HeroIcon` (`src/components/match/HeroIcon.tsx`) already exists and takes `heroId`/`size` props exactly as used above — don't modify it. This component is presentational/reusable — it will be used inside `ConditionBuilder`'s `HERO_POOL` condition row (Task 5) and inside the hero-group create/edit dialog (Task 3). It is NOT a page and has no route.

---

### Task 3: `AdminHeroGroupsPage` + route + nav

**Files:**
- Create: `src/pages/admin/AdminHeroGroupsPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/admin/AdminLayout.tsx`

- [ ] **Step 1: Write the page**

```tsx
import { useState } from 'react';
import {
  useHeroGroupsList,
  useCreateHeroGroup,
  useUpdateHeroGroup,
  useDeleteHeroGroup,
} from '@/lib/queries';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { ProblemDetailError } from '@/lib/api/client';
import type { HeroGroupDto } from '@/lib/api/types';
import { HeroMultiPicker } from '@/components/admin/HeroMultiPicker';

const PAGE_SIZE = 25;

type FormState = { name: string; heroIds: number[] };
const EMPTY_FORM: FormState = { name: '', heroIds: [] };

type DialogState =
  | { kind: 'create' }
  | { kind: 'edit'; group: HeroGroupDto }
  | { kind: 'delete'; group: HeroGroupDto }
  | null;

function describeError(e: unknown): string {
  if (e instanceof ProblemDetailError) {
    return `${e.title}${e.detail ? `: ${e.detail}` : ''}`;
  }
  if (e instanceof Error) return e.message;
  return 'Неизвестная ошибка';
}

export default function AdminHeroGroupsPage() {
  const [page, setPage] = useState(0);
  const q = useHeroGroupsList({ page, size: PAGE_SIZE });

  const createMut = useCreateHeroGroup();
  const updateMut = useUpdateHeroGroup();
  const deleteMut = useDeleteHeroGroup();

  const { toast } = useToast();

  const [dialog, setDialog] = useState<DialogState>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  function openCreate() {
    setForm(EMPTY_FORM);
    setDialog({ kind: 'create' });
  }

  function openEdit(group: HeroGroupDto) {
    setForm({ name: group.name, heroIds: group.heroIds });
    setDialog({ kind: 'edit', group });
  }

  function closeDialog() {
    setDialog(null);
    setForm(EMPTY_FORM);
  }

  function validateForm(): string | null {
    if (!form.name.trim()) return 'Укажите название';
    if (form.name.length > 128) return 'Название не длиннее 128 символов';
    if (form.heroIds.length === 0) return 'Выберите хотя бы одного героя';
    return null;
  }

  async function handleSubmit() {
    if (!dialog) return;
    const err = validateForm();
    if (err) {
      toast({ title: 'Ошибка', description: err, variant: 'destructive' });
      return;
    }
    if (dialog.kind === 'create') {
      try {
        await createMut.mutateAsync({
          name: form.name.trim(),
          heroIds: form.heroIds,
        });
        toast({ title: 'Группа героев создана' });
        closeDialog();
      } catch (e) {
        toast({
          title: 'Не удалось создать',
          description: describeError(e),
          variant: 'destructive',
        });
      }
      return;
    }
    if (dialog.kind === 'edit') {
      try {
        await updateMut.mutateAsync({
          id: dialog.group.id,
          patch: { name: form.name.trim(), heroIds: form.heroIds },
        });
        toast({ title: 'Группа героев обновлена' });
        closeDialog();
      } catch (e) {
        toast({
          title: 'Не удалось обновить',
          description: describeError(e),
          variant: 'destructive',
        });
      }
    }
  }

  async function handleDelete() {
    if (!dialog || dialog.kind !== 'delete') return;
    try {
      await deleteMut.mutateAsync(dialog.group.id);
      toast({ title: 'Группа героев удалена' });
      closeDialog();
    } catch (e) {
      toast({
        title: 'Не удалось удалить',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  const mutating = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Группы героев</h1>
        <Button onClick={openCreate}>Новая группа</Button>
      </div>

      {q.isLoading && <Skeleton className="h-80 w-full" />}

      {q.isError && (
        <div className="text-sm text-destructive">
          Не удалось загрузить группы героев: {q.error?.message ?? 'unknown error'}
        </div>
      )}

      {q.data && (q.data.items?.length ?? 0) === 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          Групп героев нет.
        </div>
      )}

      {q.data && (q.data.items?.length ?? 0) > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Название</th>
                <th className="px-4 py-2 font-medium">Героев</th>
                <th className="px-4 py-2 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {q.data.items!.map((g) => (
                <tr key={g.id} className="border-t align-top">
                  <td className="px-4 py-3 font-medium">{g.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{g.heroIds.length}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(g)}
                        disabled={mutating}
                      >
                        Изм.
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDialog({ kind: 'delete', group: g })}
                        disabled={mutating}
                      >
                        Удалить
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {q.data && (q.data.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Назад
          </Button>
          <div className="text-sm text-muted-foreground">
            Страница {(q.data.page ?? page) + 1} из {q.data.totalPages}
          </div>
          <Button
            variant="outline"
            disabled={page + 1 >= (q.data.totalPages ?? 1)}
            onClick={() => setPage((p) => p + 1)}
          >
            Дальше
          </Button>
        </div>
      )}

      {/* Create / edit dialog */}
      <Dialog
        open={dialog?.kind === 'create' || dialog?.kind === 'edit'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.kind === 'edit' ? 'Редактировать группу' : 'Новая группа героев'}
            </DialogTitle>
            <DialogDescription>
              Например, «Герои ночи» — переиспользуется в условиях достижений и квестов.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="hg-name">Название</Label>
              <Input
                id="hg-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={128}
              />
            </div>
            <div className="space-y-1">
              <Label>Герои</Label>
              <HeroMultiPicker
                selected={form.heroIds}
                onChange={(heroIds) => setForm({ ...form, heroIds })}
                disabled={mutating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={mutating}>
              {mutating
                ? 'Сохранение…'
                : dialog?.kind === 'edit'
                  ? 'Сохранить'
                  : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={dialog?.kind === 'delete'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить группу героев?</DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'delete' ? dialog.group.name : ''}. Нельзя удалить
              группу, используемую в условиях действующего достижения или квеста.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? 'Удаление…' : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Wire the route**

In `src/App.tsx`: add `import AdminHeroGroupsPage from '@/pages/admin/AdminHeroGroupsPage';` alongside the other admin page imports, and add `<Route path="hero-groups" element={<AdminHeroGroupsPage />} />` inside the `/admin` route block (alongside `lobbies`).

- [ ] **Step 3: Wire the nav**

In `src/pages/admin/AdminLayout.tsx`: add `{ to: '/admin/hero-groups', label: 'Группы героев' }` to the `NAV` array (place it right before `{ to: '/admin/tournaments', ... }`, since hero groups are a prerequisite concept for achievements/quests, both of which come next).

- [ ] **Step 4: Verify**

```powershell
npx tsc -b
```
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/AdminHeroGroupsPage.tsx src/App.tsx src/pages/admin/AdminLayout.tsx
git commit -m "feat(gamification): страница /admin/hero-groups"
```

## Context

Task 3 of 10, depends on Tasks 1-2 (both already committed). This mirrors `AdminSeasonsPage.tsx` exactly (same dialog-state-union pattern, same table/pagination/loading/error/empty structure) — read that file first if anything here is unclear, it's the canonical template for this whole plan. The delete confirmation dialog's description text mentions the backend's 409 `PLATFORM_HERO_GROUP_IN_USE` guard — the actual 409 error message from the backend will surface via `describeError`/toast if the delete is rejected; the static dialog text is just a heads-up, not error handling itself.

---

### Task 4: Types + endpoints + queries — achievements

**Files:**
- Modify: `src/lib/api/types.ts`
- Modify: `src/lib/api/endpoints.ts`
- Modify: `src/lib/queries.ts`

- [ ] **Step 1: Add types**

In `src/lib/api/types.ts`, add right after the hero-group/condition types added in Task 1:

```ts
export interface AchievementDto {
  id: string;
  name: string;
  description?: string | null;
  status: GamificationStatus;
  conditions: ConditionRowDto[];
}

export interface CreateAchievementRequest {
  name: string;
  description?: string | null;
}

export interface UpdateAchievementRequest {
  name?: string;
  description?: string | null;
}
```

- [ ] **Step 2: Add endpoint functions**

In `src/lib/api/endpoints.ts`, add after the hero-groups section from Task 1:

```ts
// ──────────────── Admin: Achievements ────────────────

export interface AchievementsPageParams {
  page?: number;
  size?: number;
}

export function getAchievementsPage(
  params: AchievementsPageParams = {},
): Promise<PagedResponse<AchievementDto>> {
  return api<PagedResponse<AchievementDto>>(
    `/api/v1/admin/achievements${buildQuery(params)}`,
  );
}

export function createAchievement(
  body: CreateAchievementRequest,
): Promise<AchievementDto> {
  return api<AchievementDto>('/api/v1/admin/achievements', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateAchievement(
  id: string,
  patch: UpdateAchievementRequest,
): Promise<AchievementDto> {
  return api<AchievementDto>(
    `/api/v1/admin/achievements/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(patch) },
  );
}

export function replaceAchievementConditions(
  id: string,
  conditions: ConditionRowDto[],
): Promise<AchievementDto> {
  return api<AchievementDto>(
    `/api/v1/admin/achievements/${encodeURIComponent(id)}/conditions`,
    { method: 'PUT', body: JSON.stringify(conditions) },
  );
}

export function publishAchievement(id: string): Promise<AchievementDto> {
  return api<AchievementDto>(
    `/api/v1/admin/achievements/${encodeURIComponent(id)}/publish`,
    { method: 'POST' },
  );
}

export function archiveAchievement(id: string): Promise<AchievementDto> {
  return api<AchievementDto>(
    `/api/v1/admin/achievements/${encodeURIComponent(id)}/archive`,
    { method: 'POST' },
  );
}
```

Add `AchievementDto, CreateAchievementRequest, UpdateAchievementRequest, ConditionRowDto,` to the types-import block at the top of `endpoints.ts` (note `ConditionRowDto` may already be imported if Task 1 needed it — check before adding a duplicate).

- [ ] **Step 3: Add query keys + hooks**

In `src/lib/queries.ts`, add to `qk`:

```ts
  achievements: (params: AchievementsPageParams) => ['achievements', params] as const,
```

Add a new section (after the hero-groups section from Task 1):

```ts
// ──────────────── Achievements ────────────────

export function useAchievementsList(params: AchievementsPageParams = {}) {
  return useQuery({
    queryKey: qk.achievements(params),
    queryFn: () => getAchievementsPage(params),
  });
}

function invalidateAchievementCaches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['achievements'] });
}

export function useCreateAchievement() {
  const qc = useQueryClient();
  return useMutation<AchievementDto, Error, CreateAchievementRequest>({
    mutationFn: createAchievement,
    onSuccess: () => invalidateAchievementCaches(qc),
  });
}

export function useUpdateAchievement() {
  const qc = useQueryClient();
  return useMutation<
    AchievementDto,
    Error,
    { id: string; patch: UpdateAchievementRequest }
  >({
    mutationFn: ({ id, patch }) => updateAchievement(id, patch),
    onSuccess: () => invalidateAchievementCaches(qc),
  });
}

export function useReplaceAchievementConditions() {
  const qc = useQueryClient();
  return useMutation<
    AchievementDto,
    Error,
    { id: string; conditions: ConditionRowDto[] }
  >({
    mutationFn: ({ id, conditions }) => replaceAchievementConditions(id, conditions),
    onSuccess: () => invalidateAchievementCaches(qc),
  });
}

export function usePublishAchievement() {
  const qc = useQueryClient();
  return useMutation<AchievementDto, Error, string>({
    mutationFn: publishAchievement,
    onSuccess: () => invalidateAchievementCaches(qc),
  });
}

export function useArchiveAchievement() {
  const qc = useQueryClient();
  return useMutation<AchievementDto, Error, string>({
    mutationFn: archiveAchievement,
    onSuccess: () => invalidateAchievementCaches(qc),
  });
}
```

Add the corresponding imports to the endpoints-import and types-import blocks at the top of `queries.ts`, mirroring Task 1's step.

- [ ] **Step 4: Verify**

```powershell
npx tsc -b
```
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/types.ts src/lib/api/endpoints.ts src/lib/queries.ts
git commit -m "feat(gamification): типы/endpoints/хуки для achievements"
```

## Context

Task 4 of 10, depends on Task 1 (`ConditionRowDto` reused here). Same data-layer-only scope as Task 1, just for achievements instead of hero groups. `PUT .../conditions` takes a bare JSON array as body (not wrapped in an object) — matches the backend controller (`AdminAchievementController.replaceConditions(@RequestBody List<ConditionRowDto>)`), don't wrap it.

---

### Task 5: `ConditionBuilder` component

**Files:**
- Create: `src/components/admin/ConditionBuilder.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useHeroGroupsList } from '@/lib/queries';
import {
  CONDITION_TYPE_LABEL,
  type ConditionRowDto,
  type ConditionType,
} from '@/lib/api/types';

interface Props {
  conditions: ConditionRowDto[];
  onChange: (conditions: ConditionRowDto[]) => void;
  disabled?: boolean;
}

const CONDITION_TYPES: ConditionType[] = ['HERO_POOL', 'WIN_REQUIRED'];

function emptyParamsFor(type: ConditionType): Pick<ConditionRowDto, 'heroGroupId' | 'minPlayers'> {
  if (type === 'HERO_POOL') return { heroGroupId: null, minPlayers: 5 };
  return { heroGroupId: null, minPlayers: null };
}

/**
 * Shared between the Achievement and Quest builders. One row per condition, all
 * ANDed together on the backend. Adding a new ConditionType later means adding one
 * more entry to CONDITION_TYPES + one more param-form branch below — nothing else
 * in this component's structure changes.
 */
export function ConditionBuilder({ conditions, onChange, disabled }: Props) {
  // Small, bounded list (hero groups are admin-authored) — no pagination needed here.
  const heroGroupsQ = useHeroGroupsList({ size: 100 });
  const heroGroups = heroGroupsQ.data?.items ?? [];

  function updateRow(index: number, row: ConditionRowDto) {
    const next = [...conditions];
    next[index] = row;
    onChange(next);
  }

  function removeRow(index: number) {
    onChange(conditions.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...conditions, { type: 'HERO_POOL', ...emptyParamsFor('HERO_POOL') }]);
  }

  return (
    <div className="space-y-3">
      {conditions.map((row, i) => (
        <div key={i} className="space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between gap-2">
            <Select
              value={row.type}
              onValueChange={(v) =>
                updateRow(i, { type: v as ConditionType, ...emptyParamsFor(v as ConditionType) })
              }
              disabled={disabled}
            >
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {CONDITION_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeRow(i)}
              disabled={disabled}
            >
              Удалить
            </Button>
          </div>

          {row.type === 'HERO_POOL' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Группа героев</label>
                <Select
                  value={row.heroGroupId ?? undefined}
                  onValueChange={(v) => updateRow(i, { ...row, heroGroupId: v })}
                  disabled={disabled || heroGroupsQ.isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите группу" />
                  </SelectTrigger>
                  <SelectContent>
                    {heroGroups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name} ({g.heroIds.length})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Мин. игроков команды (из 5)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={row.minPlayers ?? ''}
                  onChange={(e) =>
                    updateRow(i, { ...row, minPlayers: Number(e.target.value) || null })
                  }
                  disabled={disabled}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <Button size="sm" variant="outline" onClick={addRow} disabled={disabled}>
        + Добавить условие
      </Button>

      {conditions.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Условий пока нет. Опубликовать без условий нельзя.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```powershell
npx tsc -b
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/ConditionBuilder.tsx
git commit -m "feat(gamification): ConditionBuilder — общий редактор условий для достижений и квестов"
```

## Context

Task 5 of 10, depends on Task 1 (`useHeroGroupsList`, `CONDITION_TYPE_LABEL`, `ConditionRowDto`/`ConditionType` types — all already committed). This is the core reusable piece — used by both `AdminAchievementsPage` (Task 6) and `QuestsDialogBody` (Task 8). It does NOT save anything itself — it's a pure controlled-component editor over a `conditions` array in the parent's local state; the parent decides when to call the `replaceConditions` mutation (typically a separate "Сохранить условия" action, not on every keystroke — see Task 6 for how the parent wires this).

---

### Task 6: `AdminAchievementsPage` + route + nav

**Files:**
- Create: `src/pages/admin/AdminAchievementsPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/admin/AdminLayout.tsx`

- [ ] **Step 1: Write the page**

```tsx
import { useState } from 'react';
import {
  useAchievementsList,
  useCreateAchievement,
  useUpdateAchievement,
  useReplaceAchievementConditions,
  usePublishAchievement,
  useArchiveAchievement,
} from '@/lib/queries';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { ProblemDetailError } from '@/lib/api/client';
import {
  GAMIFICATION_STATUS_LABEL,
  type AchievementDto,
  type ConditionRowDto,
  type GamificationStatus,
} from '@/lib/api/types';
import { ConditionBuilder } from '@/components/admin/ConditionBuilder';

const PAGE_SIZE = 25;

type FormState = { name: string; description: string };
const EMPTY_FORM: FormState = { name: '', description: '' };

type DialogState =
  | { kind: 'create' }
  | { kind: 'edit'; achievement: AchievementDto }
  | { kind: 'conditions'; achievement: AchievementDto }
  | null;

function statusVariant(s: GamificationStatus) {
  switch (s) {
    case 'PUBLISHED':
      return 'default' as const;
    case 'DRAFT':
      return 'secondary' as const;
    case 'ARCHIVED':
      return 'outline' as const;
  }
}

function describeError(e: unknown): string {
  if (e instanceof ProblemDetailError) {
    return `${e.title}${e.detail ? `: ${e.detail}` : ''}`;
  }
  if (e instanceof Error) return e.message;
  return 'Неизвестная ошибка';
}

export default function AdminAchievementsPage() {
  const [page, setPage] = useState(0);
  const q = useAchievementsList({ page, size: PAGE_SIZE });

  const createMut = useCreateAchievement();
  const updateMut = useUpdateAchievement();
  const conditionsMut = useReplaceAchievementConditions();
  const publishMut = usePublishAchievement();
  const archiveMut = useArchiveAchievement();

  const { toast } = useToast();

  const [dialog, setDialog] = useState<DialogState>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [conditions, setConditions] = useState<ConditionRowDto[]>([]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setDialog({ kind: 'create' });
  }

  function openEdit(a: AchievementDto) {
    setForm({ name: a.name, description: a.description ?? '' });
    setDialog({ kind: 'edit', achievement: a });
  }

  function openConditions(a: AchievementDto) {
    setConditions(a.conditions);
    setDialog({ kind: 'conditions', achievement: a });
  }

  function closeDialog() {
    setDialog(null);
    setForm(EMPTY_FORM);
    setConditions([]);
  }

  async function handleSubmit() {
    if (!dialog) return;
    if (!form.name.trim()) {
      toast({ title: 'Ошибка', description: 'Укажите название', variant: 'destructive' });
      return;
    }
    if (dialog.kind === 'create') {
      try {
        await createMut.mutateAsync({
          name: form.name.trim(),
          description: form.description.trim() || null,
        });
        toast({ title: 'Достижение создано' });
        closeDialog();
      } catch (e) {
        toast({ title: 'Не удалось создать', description: describeError(e), variant: 'destructive' });
      }
      return;
    }
    if (dialog.kind === 'edit') {
      try {
        await updateMut.mutateAsync({
          id: dialog.achievement.id,
          patch: { name: form.name.trim(), description: form.description.trim() || null },
        });
        toast({ title: 'Достижение обновлено' });
        closeDialog();
      } catch (e) {
        toast({ title: 'Не удалось обновить', description: describeError(e), variant: 'destructive' });
      }
    }
  }

  async function handleSaveConditions() {
    if (!dialog || dialog.kind !== 'conditions') return;
    try {
      await conditionsMut.mutateAsync({ id: dialog.achievement.id, conditions });
      toast({ title: 'Условия сохранены' });
      closeDialog();
    } catch (e) {
      toast({ title: 'Не удалось сохранить условия', description: describeError(e), variant: 'destructive' });
    }
  }

  async function handlePublish(a: AchievementDto) {
    try {
      await publishMut.mutateAsync(a.id);
      toast({ title: 'Достижение опубликовано' });
    } catch (e) {
      toast({ title: 'Не удалось опубликовать', description: describeError(e), variant: 'destructive' });
    }
  }

  async function handleArchive(a: AchievementDto) {
    try {
      await archiveMut.mutateAsync(a.id);
      toast({ title: 'Достижение архивировано' });
    } catch (e) {
      toast({ title: 'Не удалось архивировать', description: describeError(e), variant: 'destructive' });
    }
  }

  const mutating = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Достижения</h1>
        <Button onClick={openCreate}>Новое достижение</Button>
      </div>

      {q.isLoading && <Skeleton className="h-80 w-full" />}

      {q.isError && (
        <div className="text-sm text-destructive">
          Не удалось загрузить достижения: {q.error?.message ?? 'unknown error'}
        </div>
      )}

      {q.data && (q.data.items?.length ?? 0) === 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          Достижений нет.
        </div>
      )}

      {q.data && (q.data.items?.length ?? 0) > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Название</th>
                <th className="px-4 py-2 font-medium">Статус</th>
                <th className="px-4 py-2 font-medium">Условий</th>
                <th className="px-4 py-2 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {q.data.items!.map((a) => (
                <tr key={a.id} className="border-t align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium">{a.name}</div>
                    {a.description && (
                      <div className="text-xs text-muted-foreground">{a.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(a.status)}>
                      {GAMIFICATION_STATUS_LABEL[a.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{a.conditions.length}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(a)}
                        disabled={mutating || a.status === 'ARCHIVED'}
                      >
                        Изм.
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openConditions(a)}
                        disabled={mutating || a.status === 'ARCHIVED'}
                      >
                        Условия
                      </Button>
                      {a.status === 'DRAFT' && (
                        <Button
                          size="sm"
                          onClick={() => handlePublish(a)}
                          disabled={publishMut.isPending}
                        >
                          Опубликовать
                        </Button>
                      )}
                      {a.status !== 'ARCHIVED' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleArchive(a)}
                          disabled={archiveMut.isPending}
                        >
                          В архив
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {q.data && (q.data.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Назад
          </Button>
          <div className="text-sm text-muted-foreground">
            Страница {(q.data.page ?? page) + 1} из {q.data.totalPages}
          </div>
          <Button
            variant="outline"
            disabled={page + 1 >= (q.data.totalPages ?? 1)}
            onClick={() => setPage((p) => p + 1)}
          >
            Дальше
          </Button>
        </div>
      )}

      {/* Create / edit dialog */}
      <Dialog
        open={dialog?.kind === 'create' || dialog?.kind === 'edit'}
        onOpenChange={(open) => { if (!open) closeDialog(); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.kind === 'edit' ? 'Редактировать достижение' : 'Новое достижение'}
            </DialogTitle>
            <DialogDescription>
              Условия задаются отдельно после создания.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="ach-name">Название</Label>
              <Input
                id="ach-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={128}
                placeholder="Победить, играя на героях ночи"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ach-desc">Описание</Label>
              <textarea
                id="ach-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="min-h-[5rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>Отмена</Button>
            <Button onClick={handleSubmit} disabled={mutating}>
              {mutating ? 'Сохранение…' : dialog?.kind === 'edit' ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conditions dialog */}
      <Dialog
        open={dialog?.kind === 'conditions'}
        onOpenChange={(open) => { if (!open) closeDialog(); }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Условия — {dialog?.kind === 'conditions' ? dialog.achievement.name : ''}
            </DialogTitle>
          </DialogHeader>
          <ConditionBuilder
            conditions={conditions}
            onChange={setConditions}
            disabled={conditionsMut.isPending}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>Отмена</Button>
            <Button onClick={handleSaveConditions} disabled={conditionsMut.isPending}>
              {conditionsMut.isPending ? 'Сохранение…' : 'Сохранить условия'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Wire the route**

In `src/App.tsx`: add `import AdminAchievementsPage from '@/pages/admin/AdminAchievementsPage';`, and `<Route path="achievements" element={<AdminAchievementsPage />} />` inside the `/admin` route block.

- [ ] **Step 3: Wire the nav**

In `src/pages/admin/AdminLayout.tsx`: add `{ to: '/admin/achievements', label: 'Достижения' }` to `NAV`, right after the `hero-groups` entry added in Task 3.

- [ ] **Step 4: Verify**

```powershell
npx tsc -b
```
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/AdminAchievementsPage.tsx src/App.tsx src/pages/admin/AdminLayout.tsx
git commit -m "feat(gamification): страница /admin/achievements"
```

## Context

Task 6 of 10, depends on Tasks 4-5 (already committed). Publish/Archive are one-click row actions (no confirm dialog, matching `AdminBotsPage`'s per-row action pattern) rather than a modal — publish is low-risk (reversible by archiving), archive is the "soft delete" here so a confirm dialog would be safety-theater for an already-non-destructive action; keep it simple. Edit/Conditions are disabled once ARCHIVED (matches backend's `PLATFORM_GAMIFICATION_ARCHIVED` 409 guard — disabling client-side avoids a wasted round-trip that would just come back as an error toast).

---

### Task 7: Types + endpoints + queries — quests

**Files:**
- Modify: `src/lib/api/types.ts`
- Modify: `src/lib/api/endpoints.ts`
- Modify: `src/lib/queries.ts`

- [ ] **Step 1: Add types**

In `src/lib/api/types.ts`, add after the achievement types from Task 4:

```ts
export interface QuestDto {
  id: string;
  tournamentId: string;
  name: string;
  description?: string | null;
  status: GamificationStatus;
  conditions: ConditionRowDto[];
}

export interface CreateQuestRequest {
  name: string;
  description?: string | null;
}

export interface UpdateQuestRequest {
  name?: string;
  description?: string | null;
}
```

- [ ] **Step 2: Add endpoint functions**

In `src/lib/api/endpoints.ts`, add after the achievements section from Task 4:

```ts
// ──────────────── Admin: Tournament quests ────────────────

export interface QuestsPageParams {
  page?: number;
  size?: number;
}

export function getTournamentQuestsPage(
  tournamentId: string,
  params: QuestsPageParams = {},
): Promise<PagedResponse<QuestDto>> {
  return api<PagedResponse<QuestDto>>(
    `/api/v1/admin/tournaments/${encodeURIComponent(tournamentId)}/quests${buildQuery(params)}`,
  );
}

export function createQuest(
  tournamentId: string,
  body: CreateQuestRequest,
): Promise<QuestDto> {
  return api<QuestDto>(
    `/api/v1/admin/tournaments/${encodeURIComponent(tournamentId)}/quests`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export function updateQuest(
  id: string,
  patch: UpdateQuestRequest,
): Promise<QuestDto> {
  return api<QuestDto>(`/api/v1/admin/quests/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function replaceQuestConditions(
  id: string,
  conditions: ConditionRowDto[],
): Promise<QuestDto> {
  return api<QuestDto>(
    `/api/v1/admin/quests/${encodeURIComponent(id)}/conditions`,
    { method: 'PUT', body: JSON.stringify(conditions) },
  );
}

export function publishQuest(id: string): Promise<QuestDto> {
  return api<QuestDto>(`/api/v1/admin/quests/${encodeURIComponent(id)}/publish`, {
    method: 'POST',
  });
}

export function archiveQuest(id: string): Promise<QuestDto> {
  return api<QuestDto>(`/api/v1/admin/quests/${encodeURIComponent(id)}/archive`, {
    method: 'POST',
  });
}
```

Add `QuestDto, CreateQuestRequest, UpdateQuestRequest,` to the types-import block at the top of `endpoints.ts`.

- [ ] **Step 3: Add query keys + hooks**

In `src/lib/queries.ts`, add to `qk`:

```ts
  tournamentQuests: (tournamentId: string, params: QuestsPageParams) =>
    ['tournament-quests', tournamentId, params] as const,
```

Add a new section (after the achievements section from Task 4):

```ts
// ──────────────── Tournament quests ────────────────

export function useTournamentQuestsList(
  tournamentId: string | undefined,
  params: QuestsPageParams = {},
) {
  return useQuery({
    queryKey: tournamentId
      ? qk.tournamentQuests(tournamentId, params)
      : ['tournament-quests', 'none', params],
    queryFn: () => getTournamentQuestsPage(tournamentId!, params),
    enabled: Boolean(tournamentId),
  });
}

function invalidateQuestCaches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['tournament-quests'] });
}

export function useCreateQuest() {
  const qc = useQueryClient();
  return useMutation<
    QuestDto,
    Error,
    { tournamentId: string; body: CreateQuestRequest }
  >({
    mutationFn: ({ tournamentId, body }) => createQuest(tournamentId, body),
    onSuccess: () => invalidateQuestCaches(qc),
  });
}

export function useUpdateQuest() {
  const qc = useQueryClient();
  return useMutation<QuestDto, Error, { id: string; patch: UpdateQuestRequest }>({
    mutationFn: ({ id, patch }) => updateQuest(id, patch),
    onSuccess: () => invalidateQuestCaches(qc),
  });
}

export function useReplaceQuestConditions() {
  const qc = useQueryClient();
  return useMutation<
    QuestDto,
    Error,
    { id: string; conditions: ConditionRowDto[] }
  >({
    mutationFn: ({ id, conditions }) => replaceQuestConditions(id, conditions),
    onSuccess: () => invalidateQuestCaches(qc),
  });
}

export function usePublishQuest() {
  const qc = useQueryClient();
  return useMutation<QuestDto, Error, string>({
    mutationFn: publishQuest,
    onSuccess: () => invalidateQuestCaches(qc),
  });
}

export function useArchiveQuest() {
  const qc = useQueryClient();
  return useMutation<QuestDto, Error, string>({
    mutationFn: archiveQuest,
    onSuccess: () => invalidateQuestCaches(qc),
  });
}
```

Add corresponding imports to the endpoints-import and types-import blocks at the top of `queries.ts`.

- [ ] **Step 4: Verify**

```powershell
npx tsc -b
```
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/types.ts src/lib/api/endpoints.ts src/lib/queries.ts
git commit -m "feat(gamification): типы/endpoints/хуки для квестов турнира"
```

## Context

Task 7 of 10, depends on Tasks 1 and 4 (`ConditionRowDto`, `GamificationStatus` reused). Same data-layer-only scope, scoped to a tournament this time — `createQuest`/`getTournamentQuestsPage` both take `tournamentId` as their first param since the backend routes them under `/api/v1/admin/tournaments/{tournamentId}/quests`, while `update`/`conditions`/`publish`/`archive` operate on `/api/v1/admin/quests/{id}` directly (no `tournamentId` in those paths — matches the backend's `AdminQuestController` exactly, which straddles both prefixes).

---

### Task 8: `QuestsDialogBody` — wire into `AdminTournamentsPage`

**Files:**
- Modify: `src/pages/admin/AdminTournamentsPage.tsx`

Before writing code, read `src/pages/admin/AdminTournamentsPage.tsx` in full (2159 lines) — specifically: the `DialogState` union (~line 152), where `onGroupEdit`/`{ kind: 'group-edit', tournament: t }` is wired near the row-rendering call (~line 665), where `GroupEditDialogBody` is defined (~line 1373) and mounted (~line 1361-1368), and the `TournamentRow` component's props/dropdown-menu structure (~line 2020-2135). This task adds a parallel `'quests'` dialog kind following that exact pattern.

- [ ] **Step 1: Extend the `DialogState` union**

Find:
```ts
type DialogState =
  | { kind: 'create' }
  ...
  | { kind: 'group-edit'; tournament: TournamentDto }
  | null;
```
Add `| { kind: 'quests'; tournament: TournamentDto }` right after the `'group-edit'` line.

- [ ] **Step 2: Add imports**

At the top of the file, add to the `@/lib/queries` import: `useTournamentQuestsList, useCreateQuest, useUpdateQuest, useReplaceQuestConditions, usePublishQuest, useArchiveQuest,`. Add to the `@/lib/api/types` import: `QuestDto, ConditionRowDto, GAMIFICATION_STATUS_LABEL,` (skip any already imported — `GamificationStatus`-adjacent labels may already be present after Task 6 if this file happens to import from the same shared module; check first). Add `import { ConditionBuilder } from '@/components/admin/ConditionBuilder';` and `import { Badge } from '@/components/ui/badge';` if `Badge` isn't already imported (it almost certainly already is, given `statusVariant`/status badges elsewhere in this file — verify, don't double-import).

- [ ] **Step 3: Wire the trigger — find `onGroupEdit` prop wiring (~line 665) and `TournamentRow`'s prop list (~line 2020-2045)**

Where `onGroupEdit={() => setDialog({ kind: 'group-edit', tournament: t })}` is passed to `<TournamentRow>`, add right after it:
```tsx
                  onQuests={() =>
                    setDialog({ kind: 'quests', tournament: t })
                  }
```

In the `TournamentRow` props interface (near `onGroupEdit: () => void;`), add `onQuests: () => void;`. In the `TournamentRow` function's destructured params (near `onGroupEdit,`), add `onQuests,`. In the `DropdownMenu` inside `TournamentRow` (near `<DropdownMenuItem onClick={onGroupEdit}>Состав групп</DropdownMenuItem>`), add right after it:
```tsx
            <DropdownMenuItem onClick={onQuests}>Квесты</DropdownMenuItem>
```

- [ ] **Step 4: Mount the dialog body — find where `GroupEditDialogBody` is mounted (~line 1361-1368)**

Right after that block, add:
```tsx
      {/* Tournament quests. Mounted only while open so the quests-list GET fires
          exactly once per open, matching the group-edit dialog above. */}
      {dialog?.kind === 'quests' && (
        <QuestsDialogBody
          tournament={dialog.tournament}
          onClose={closeDialog}
        />
      )}
```
(Use whatever the existing close-handler function is actually called at that call site — it's `onClose={closeDialog}` in the `GroupEditDialogBody` mount right above; copy that exact prop name/handler.)

- [ ] **Step 5: Define `QuestsDialogBody`**

Add this new function at the bottom of the file, right after `GroupEditDialogBody`'s closing brace (keeps related per-tournament dialog components grouped together):

```tsx
function QuestsDialogBody({
  tournament,
  onClose,
}: {
  tournament: TournamentDto;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const questsQ = useTournamentQuestsList(tournament.id, { size: 50 });
  const createMut = useCreateQuest();
  const updateMut = useUpdateQuest();
  const conditionsMut = useReplaceQuestConditions();
  const publishMut = usePublishQuest();
  const archiveMut = useArchiveQuest();

  type QuestFormState = { name: string; description: string };
  const EMPTY_QUEST_FORM: QuestFormState = { name: '', description: '' };

  type QuestDialogState =
    | { kind: 'create' }
    | { kind: 'edit'; quest: QuestDto }
    | { kind: 'conditions'; quest: QuestDto }
    | null;

  const [subDialog, setSubDialog] = useState<QuestDialogState>(null);
  const [form, setForm] = useState<QuestFormState>(EMPTY_QUEST_FORM);
  const [conditions, setConditions] = useState<ConditionRowDto[]>([]);

  function closeSubDialog() {
    setSubDialog(null);
    setForm(EMPTY_QUEST_FORM);
    setConditions([]);
  }

  async function handleSubmit() {
    if (!subDialog) return;
    if (!form.name.trim()) {
      toast({ title: 'Ошибка', description: 'Укажите название', variant: 'destructive' });
      return;
    }
    if (subDialog.kind === 'create') {
      try {
        await createMut.mutateAsync({
          tournamentId: tournament.id,
          body: { name: form.name.trim(), description: form.description.trim() || null },
        });
        toast({ title: 'Квест создан' });
        closeSubDialog();
      } catch (e) {
        toast({ title: 'Не удалось создать', description: describeError(e), variant: 'destructive' });
      }
      return;
    }
    if (subDialog.kind === 'edit') {
      try {
        await updateMut.mutateAsync({
          id: subDialog.quest.id,
          patch: { name: form.name.trim(), description: form.description.trim() || null },
        });
        toast({ title: 'Квест обновлён' });
        closeSubDialog();
      } catch (e) {
        toast({ title: 'Не удалось обновить', description: describeError(e), variant: 'destructive' });
      }
    }
  }

  async function handleSaveConditions() {
    if (!subDialog || subDialog.kind !== 'conditions') return;
    try {
      await conditionsMut.mutateAsync({ id: subDialog.quest.id, conditions });
      toast({ title: 'Условия сохранены' });
      closeSubDialog();
    } catch (e) {
      toast({ title: 'Не удалось сохранить условия', description: describeError(e), variant: 'destructive' });
    }
  }

  async function handlePublish(quest: QuestDto) {
    try {
      await publishMut.mutateAsync(quest.id);
      toast({ title: 'Квест опубликован' });
    } catch (e) {
      toast({ title: 'Не удалось опубликовать', description: describeError(e), variant: 'destructive' });
    }
  }

  async function handleArchive(quest: QuestDto) {
    try {
      await archiveMut.mutateAsync(quest.id);
      toast({ title: 'Квест архивирован' });
    } catch (e) {
      toast({ title: 'Не удалось архивировать', description: describeError(e), variant: 'destructive' });
    }
  }

  const quests = questsQ.data?.items ?? [];
  const mutating = createMut.isPending || updateMut.isPending;

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Квесты — {tournament.name}</DialogTitle>
          </DialogHeader>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setForm(EMPTY_QUEST_FORM);
                setSubDialog({ kind: 'create' });
              }}
            >
              Новый квест
            </Button>
          </div>

          {questsQ.isLoading && <Skeleton className="h-32 w-full" />}
          {questsQ.isError && (
            <div className="text-sm text-destructive">
              {describeError(questsQ.error)}
            </div>
          )}
          {questsQ.data && quests.length === 0 && (
            <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
              Квестов пока нет.
            </div>
          )}
          {quests.length > 0 && (
            <div className="max-h-[50vh] space-y-2 overflow-y-auto">
              {quests.map((quest) => (
                <div key={quest.id} className="space-y-2 rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{quest.name}</div>
                      {quest.description && (
                        <div className="text-xs text-muted-foreground">
                          {quest.description}
                        </div>
                      )}
                    </div>
                    <Badge variant={quest.status === 'PUBLISHED' ? 'default' : quest.status === 'ARCHIVED' ? 'outline' : 'secondary'}>
                      {GAMIFICATION_STATUS_LABEL[quest.status]}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={mutating || quest.status === 'ARCHIVED'}
                      onClick={() => {
                        setForm({ name: quest.name, description: quest.description ?? '' });
                        setSubDialog({ kind: 'edit', quest });
                      }}
                    >
                      Изм.
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={mutating || quest.status === 'ARCHIVED'}
                      onClick={() => {
                        setConditions(quest.conditions);
                        setSubDialog({ kind: 'conditions', quest });
                      }}
                    >
                      Условия
                    </Button>
                    {quest.status === 'DRAFT' && (
                      <Button size="sm" disabled={publishMut.isPending} onClick={() => handlePublish(quest)}>
                        Опубликовать
                      </Button>
                    )}
                    {quest.status !== 'ARCHIVED' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={archiveMut.isPending}
                        onClick={() => handleArchive(quest)}
                      >
                        В архив
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quest create/edit sub-dialog */}
      <Dialog
        open={subDialog?.kind === 'create' || subDialog?.kind === 'edit'}
        onOpenChange={(open) => { if (!open) closeSubDialog(); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {subDialog?.kind === 'edit' ? 'Редактировать квест' : 'Новый квест'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="quest-name">Название</Label>
              <Input
                id="quest-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={128}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quest-desc">Описание</Label>
              <textarea
                id="quest-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="min-h-[5rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeSubDialog}>Отмена</Button>
            <Button onClick={handleSubmit} disabled={mutating}>
              {mutating ? 'Сохранение…' : subDialog?.kind === 'edit' ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quest conditions sub-dialog */}
      <Dialog
        open={subDialog?.kind === 'conditions'}
        onOpenChange={(open) => { if (!open) closeSubDialog(); }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Условия — {subDialog?.kind === 'conditions' ? subDialog.quest.name : ''}
            </DialogTitle>
          </DialogHeader>
          <ConditionBuilder
            conditions={conditions}
            onChange={setConditions}
            disabled={conditionsMut.isPending}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={closeSubDialog}>Отмена</Button>
            <Button onClick={handleSaveConditions} disabled={conditionsMut.isPending}>
              {conditionsMut.isPending ? 'Сохранение…' : 'Сохранить условия'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 6: Verify**

```powershell
npx tsc -b
```
Expected: no output. If `Input`/`Label`/`Dialog*`/`Skeleton`/`Badge`/`Button`/`useToast`/`useState` aren't already imported at the top of this file for some reason, add them — but given the file already uses all of these extensively (per `GroupEditDialogBody` alone), they should already be present; don't add duplicate imports.

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/AdminTournamentsPage.tsx
git commit -m "feat(gamification): диалог квестов турнира на строке AdminTournamentsPage"
```

## Context

Task 8 of 10, depends on Tasks 5 and 7 (`ConditionBuilder`, quest hooks — already committed). This is the highest-risk task in the plan — it edits a 2159-line file you haven't fully seen yet rather than creating a fresh one, and the exact line numbers given above (665, 1361-1368, 2020-2045) are approximate/may have shifted slightly if the file changed since this plan was written; find the actual anchor text (`onGroupEdit`, `GroupEditDialogBody`, `kind: 'group-edit'`) with a search rather than trusting line numbers literally. `QuestsDialogBody` intentionally has its OWN internal `subDialog` state (nested dialogs: the outer "Квесты — {tournament}" list dialog, and an inner create/edit/conditions dialog on top of it) — this is a new pattern not seen elsewhere in this file (existing dialogs are one level deep), called out explicitly in the design spec as a deliberate choice given the quest builder's own complexity (name+description+conditions, three sub-flows) doesn't fit in a single flat dialog. If a code reviewer flags "why is this nested" — that's the reason, not an oversight.

---

### Task 9: Types + endpoint + query — player achievements + `PlayerPublicPage` card

**Files:**
- Modify: `src/lib/api/types.ts`
- Modify: `src/lib/api/endpoints.ts`
- Modify: `src/lib/queries.ts`
- Modify: `src/pages/PlayerPublicPage.tsx`

- [ ] **Step 1: Add type**

In `src/lib/api/types.ts`, add after the quest types from Task 7:

```ts
export interface PlayerAchievementDto {
  achievementId: string;
  name: string;
  description?: string | null;
  timesEarned: number;
  lastEarnedAt?: string | null;
}
```

- [ ] **Step 2: Add endpoint function**

In `src/lib/api/endpoints.ts`, add near `getPlayerHistory` (search for it — it's in the public players section, not an admin section, since this endpoint is public):

```ts
export function getPlayerAchievements(id: string): Promise<PlayerAchievementDto[]> {
  return api<PlayerAchievementDto[]>(
    `/api/v1/players/${encodeURIComponent(id)}/achievements`,
  );
}
```

Add `PlayerAchievementDto,` to the types-import block.

- [ ] **Step 3: Add query key + hook**

In `src/lib/queries.ts`, add to `qk` near `playerHistory`:
```ts
  playerAchievements: (id: string) => ['player-achievements', id] as const,
```

Add near `usePlayerHistory` (in the "Archive / History" section):
```ts
export function usePlayerAchievements(id: string | undefined) {
  return useQuery<PlayerAchievementDto[]>({
    queryKey: id ? qk.playerAchievements(id) : ['player-achievements', 'none'],
    queryFn: () => getPlayerAchievements(id!),
    enabled: Boolean(id),
  });
}
```

Add `getPlayerAchievements,` and `PlayerAchievementDto,` to the respective import blocks.

- [ ] **Step 4: Add the profile card**

In `src/pages/PlayerPublicPage.tsx`: add `usePlayerAchievements` to the existing `@/lib/queries` import. Add `const achievementsQ = usePlayerAchievements(id);` right after the existing `const historyQ = usePlayerHistory(id);` line. Add a new `<Card>` right after the "История турниров" card closes (before the "Команды" card):

```tsx
      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Достижения</CardTitle>
          <CardDescription>
            {achievementsQ.isLoading
              ? 'Загрузка…'
              : `${achievementsQ.data?.length ?? 0} достижений`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {achievementsQ.isLoading && <Skeleton className="h-24 w-full" />}
          {achievementsQ.isError && (
            <div className="text-sm text-destructive">
              Не удалось загрузить достижения.
            </div>
          )}
          {achievementsQ.data && achievementsQ.data.length === 0 && (
            <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
              Пока нет полученных достижений.
            </div>
          )}
          {achievementsQ.data && achievementsQ.data.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {achievementsQ.data.map((a) => (
                <div key={a.achievementId} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{a.name}</div>
                    {a.timesEarned > 1 && (
                      <Badge variant="secondary">×{a.timesEarned}</Badge>
                    )}
                  </div>
                  {a.description && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {a.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

```

- [ ] **Step 5: Verify**

```powershell
npx tsc -b
```
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/types.ts src/lib/api/endpoints.ts src/lib/queries.ts src/pages/PlayerPublicPage.tsx
git commit -m "feat(gamification): карточка \"Достижения\" на публичном профиле игрока"
```

## Context

Task 9 of 10, independent of Tasks 3/6/8 (only needs Task 1's `GamificationStatus`-adjacent scaffolding indirectly via shared file sections, but no direct code dependency — could technically run in parallel with 2-8, but keep it sequential per plan order for a clean single-implementer history). `Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`Badge`/`Skeleton` are already imported in `PlayerPublicPage.tsx` (used by the existing Tournaments/Teams/MMR cards) — don't re-add if present, check the existing import block first.

---

### Task 10: Full verification + PR

- [ ] **Step 1: Full typecheck**

```powershell
npx tsc -b
```
Expected: no output.

- [ ] **Step 2: Full build (catches anything `tsc -b` alone might miss, e.g. Vite-specific issues)**

```powershell
npm run build
```
Expected: `BUILD SUCCESS`-equivalent (Vite prints a build summary, no errors).

- [ ] **Step 3: Manual browser smoke test**

Start the dev server and walk through the golden path in a real browser:
1. Log in as an ADMIN-role account (or whatever local dev auth this repo uses — check `README`/`.env.example` if unclear).
2. Navigate to `/admin/hero-groups` — create a group ("Тест", pick 2-3 heroes via the picker), confirm it appears in the list, edit it, confirm the heroIds count updates.
3. Navigate to `/admin/achievements` — create an achievement, open "Условия", add a `WIN_REQUIRED` row and a `HERO_POOL` row (pick the group from step 2, set min players), save, confirm it shows 2 conditions in the list, publish it, confirm status badge flips to "Опубликовано".
4. Navigate to `/admin/tournaments`, open any tournament's row menu, click "Квесты" — repeat the same create/conditions/publish flow scoped to that tournament.
5. Navigate to any player's public profile (`/players/:id`) — confirm the "Достижения" card renders (empty state is fine and expected — the backend PR isn't merged yet, so no real award data exists against a live backend unless testing against a local backend build from that branch).
6. Check the browser console for any runtime errors during all of the above.

If backend PR #111 isn't deployed/available against whatever API target this frontend dev server points at (`VITE_API_TARGET`), the network calls will 404/fail — that's expected and NOT a frontend bug; note it in the PR description rather than trying to fix it here. Screenshot or describe what you verified either way.

- [ ] **Step 4: Push and open PR**

```bash
git push -u origin feat/gamification-achievements-quests
```

```bash
gh pr create --base master --head feat/gamification-achievements-quests --title "feat(gamification): конструктор достижений и квестов (frontend)" --body "$(cat <<'EOF'
## Summary
- /admin/hero-groups — CRUD переиспользуемых пулов героев, HeroMultiPicker.
- /admin/achievements — CRUD достижений + ConditionBuilder (HERO_POOL/WIN_REQUIRED) + publish/archive.
- Квесты турнира — диалог на строке /admin/tournaments (QuestsDialogBody), тот же ConditionBuilder.
- Профиль игрока — карточка "Достижения".
- Типы — ручные interface в types.ts (backend PR #111 ещё не смёржен, openapi.yaml здесь устарел); TODO-комментарии для regen после мёржа.

Потребляет контракт из github.com/OziePozie/DiscordForFemka#111 (backend, ещё не смёржен).

## Test plan
- [x] `npx tsc -b` — чисто
- [x] `npm run build` — чисто
- [ ] Ручной смоук в браузере (см. Task 10 плана) — зависит от доступности бэкенда с этим контрактом
EOF
)"
```

## Context

Task 10 of 10, final task — depends on all previous tasks. Do NOT skip the manual browser smoke test even if the backend isn't reachable — at minimum confirm every new page/dialog renders without a React error boundary crash and the empty/loading states look right; that's verifiable even with a 404ing API.
