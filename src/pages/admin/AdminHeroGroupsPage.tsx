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
