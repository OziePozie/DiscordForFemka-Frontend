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

  // Covers the create/edit dialog's own submit button. Row actions (Edit/Conditions/
  // Publish/Archive) additionally gate on their own mutation's isPending below — a
  // shared flag isn't needed for cross-row protection because every dialog here
  // (create/edit and conditions) is a modal Dialog: while conditionsMut is in flight
  // the conditions dialog is still open and its overlay blocks pointer events on the
  // table underneath, so no other row's buttons are reachable to double-submit against.
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
