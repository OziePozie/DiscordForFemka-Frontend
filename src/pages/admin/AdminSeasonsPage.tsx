import { useState, type ChangeEvent } from 'react';
import {
  useSeasonsList,
  useCreateSeason,
  useUpdateSeason,
  useStartSeason,
  useFinishSeason,
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
  SEASON_STATUS_LABEL,
  type SeasonDto,
  type SeasonStatus,
} from '@/lib/api/types';
import { formatDateTimeLocal, parseLocalDateTime } from '@/lib/utils';
import { uploadAttachment } from '@/lib/api/endpoints';

const PAGE_SIZE = 25;
const SLUG_RE = /^[a-z0-9-]+$/;

type FormState = {
  name: string;
  slug: string;
  description: string;
  startsAt: string; // datetime-local
  endsAt: string;
  bannerAttachmentId: string | null;
  bannerPreviewUrl: string | null;
  bannerDirty: boolean;
};

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  description: '',
  startsAt: '',
  endsAt: '',
  bannerAttachmentId: null,
  bannerPreviewUrl: null,
  bannerDirty: false,
};

type DialogState =
  | { kind: 'create' }
  | { kind: 'edit'; season: SeasonDto }
  | { kind: 'confirm'; action: 'start' | 'finish'; season: SeasonDto }
  | null;

function statusVariant(s: SeasonStatus) {
  switch (s) {
    case 'ACTIVE':
      return 'default' as const;
    case 'PLANNED':
      return 'secondary' as const;
    case 'FINISHED':
      return 'outline' as const;
  }
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function describeError(e: unknown): string {
  if (e instanceof ProblemDetailError) {
    return `${e.title}${e.detail ? `: ${e.detail}` : ''}`;
  }
  if (e instanceof Error) return e.message;
  return 'Неизвестная ошибка';
}

export default function AdminSeasonsPage() {
  const [page, setPage] = useState(0);
  const q = useSeasonsList({ page, size: PAGE_SIZE });

  const createMut = useCreateSeason();
  const updateMut = useUpdateSeason();
  const startMut = useStartSeason();
  const finishMut = useFinishSeason();

  const { toast } = useToast();

  const [dialog, setDialog] = useState<DialogState>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);

  function openCreate() {
    setForm(EMPTY_FORM);
    setDialog({ kind: 'create' });
  }

  function openEdit(season: SeasonDto) {
    setForm({
      name: season.name,
      slug: season.slug,
      description: season.description ?? '',
      startsAt: formatDateTimeLocal(season.startsAt),
      endsAt: formatDateTimeLocal(season.endsAt),
      bannerAttachmentId: null,
      bannerPreviewUrl: season.bannerUrl ?? null,
      bannerDirty: false,
    });
    setDialog({ kind: 'edit', season });
  }

  function closeDialog() {
    setDialog(null);
    setForm(EMPTY_FORM);
  }

  async function handleBannerChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const att = await uploadAttachment(file, 'SEASON_BANNER');
      setForm((prev) => ({
        ...prev,
        bannerAttachmentId: att.id,
        bannerPreviewUrl: att.url,
        bannerDirty: true,
      }));
    } catch (err) {
      toast({
        title: 'Не удалось загрузить баннер',
        description: describeError(err),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // reset input so selecting the same file again re-fires onChange
      e.target.value = '';
    }
  }

  function validateForm(includeSlug: boolean): string | null {
    if (!form.name.trim()) return 'Укажите название';
    if (includeSlug) {
      if (!form.slug.trim()) return 'Укажите slug';
      if (form.slug.length > 64) return 'Slug не длиннее 64 символов';
      if (!SLUG_RE.test(form.slug)) {
        return 'Slug может содержать только a-z, 0-9 и дефис';
      }
    }
    if (!form.startsAt) return 'Укажите дату начала';
    if (!form.endsAt) return 'Укажите дату окончания';
    const s = parseLocalDateTime(form.startsAt);
    const e = parseLocalDateTime(form.endsAt);
    if (s && e && new Date(s).getTime() >= new Date(e).getTime()) {
      return 'Дата окончания должна быть позже даты начала';
    }
    return null;
  }

  async function handleSubmit() {
    if (!dialog) return;
    if (dialog.kind === 'create') {
      const err = validateForm(true);
      if (err) {
        toast({ title: 'Ошибка', description: err, variant: 'destructive' });
        return;
      }
      try {
        await createMut.mutateAsync({
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || null,
          startsAt: parseLocalDateTime(form.startsAt)!,
          endsAt: parseLocalDateTime(form.endsAt)!,
          bannerAttachmentId: form.bannerAttachmentId,
        });
        toast({ title: 'Сезон создан' });
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
      const err = validateForm(false);
      if (err) {
        toast({ title: 'Ошибка', description: err, variant: 'destructive' });
        return;
      }
      try {
        await updateMut.mutateAsync({
          id: dialog.season.id,
          patch: {
            name: form.name.trim(),
            description: form.description.trim() || null,
            startsAt: parseLocalDateTime(form.startsAt),
            endsAt: parseLocalDateTime(form.endsAt),
            bannerAttachmentId: form.bannerDirty ? form.bannerAttachmentId : null,
          },
        });
        toast({ title: 'Сезон обновлён' });
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

  async function handleConfirm() {
    if (!dialog || dialog.kind !== 'confirm') return;
    const { action, season } = dialog;
    try {
      if (action === 'start') {
        await startMut.mutateAsync(season.id);
        toast({ title: 'Сезон запущен' });
      } else {
        await finishMut.mutateAsync(season.id);
        toast({ title: 'Сезон завершён' });
      }
      closeDialog();
    } catch (e) {
      toast({
        title: 'Ошибка',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  const mutating =
    createMut.isPending ||
    updateMut.isPending ||
    startMut.isPending ||
    finishMut.isPending ||
    uploading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Сезоны</h1>
        <Button onClick={openCreate}>Новый сезон</Button>
      </div>

      {q.isLoading && <Skeleton className="h-80 w-full" />}

      {q.isError && (
        <div className="text-sm text-destructive">
          Не удалось загрузить сезоны: {q.error?.message ?? 'unknown error'}
        </div>
      )}

      {q.data && (q.data.items?.length ?? 0) === 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          Сезонов нет.
        </div>
      )}

      {q.data && (q.data.items?.length ?? 0) > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Название</th>
                <th className="px-4 py-2 font-medium">Slug</th>
                <th className="px-4 py-2 font-medium">Статус</th>
                <th className="px-4 py-2 font-medium">Период</th>
                <th className="px-4 py-2 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {q.data.items!.map((s) => (
                <tr key={s.id} className="border-t align-top">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {s.slug}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(s.status)}>
                      {SEASON_STATUS_LABEL[s.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {fmtDate(s.startsAt)} → {fmtDate(s.endsAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(s)}
                        disabled={mutating}
                        title="Редактировать"
                      >
                        Изм.
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          setDialog({ kind: 'confirm', action: 'start', season: s })
                        }
                        disabled={mutating || s.status !== 'PLANNED'}
                        title={
                          s.status === 'PLANNED'
                            ? 'Запустить сезон'
                            : 'Доступно только для PLANNED'
                        }
                      >
                        Старт
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          setDialog({
                            kind: 'confirm',
                            action: 'finish',
                            season: s,
                          })
                        }
                        disabled={mutating || s.status !== 'ACTIVE'}
                        title={
                          s.status === 'ACTIVE'
                            ? 'Завершить сезон'
                            : 'Доступно только для ACTIVE'
                        }
                      >
                        Финиш
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
              {dialog?.kind === 'edit' ? 'Редактировать сезон' : 'Новый сезон'}
            </DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'edit'
                ? 'Slug изменить нельзя.'
                : 'Slug используется в URL и не меняется после создания.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="season-name">Название</Label>
              <Input
                id="season-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={64}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="season-slug">Slug</Label>
              <Input
                id="season-slug"
                value={form.slug}
                onChange={(e) =>
                  setForm({ ...form, slug: e.target.value.toLowerCase() })
                }
                maxLength={64}
                placeholder="season-2026-spring"
                disabled={dialog?.kind === 'edit'}
              />
              <p className="text-xs text-muted-foreground">
                a-z, 0-9, дефис. До 64 символов.
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="season-desc">Описание</Label>
              <textarea
                id="season-desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="season-banner">Баннер</Label>
              {form.bannerPreviewUrl && (
                <img
                  src={form.bannerPreviewUrl}
                  alt=""
                  className="max-h-32 w-full rounded-md object-cover"
                />
              )}
              <Input
                id="season-banner"
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                disabled={uploading}
              />
              {uploading && (
                <p className="text-xs text-muted-foreground">Загрузка…</p>
              )}
              <p className="text-xs text-muted-foreground">
                Опционально. PNG/JPEG/WebP. Снять баннер через интерфейс нельзя — загрузите новый.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="season-starts">Старт</Label>
                <Input
                  id="season-starts"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) =>
                    setForm({ ...form, startsAt: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="season-ends">Финиш</Label>
                <Input
                  id="season-ends"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) =>
                    setForm({ ...form, endsAt: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={mutating}>
              {uploading
                ? 'Загрузка баннера…'
                : mutating
                  ? 'Сохранение…'
                  : dialog?.kind === 'edit'
                    ? 'Сохранить'
                    : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm dialog */}
      <Dialog
        open={dialog?.kind === 'confirm'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.kind === 'confirm' && dialog.action === 'start'
                ? 'Запустить сезон?'
                : 'Завершить сезон?'}
            </DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'confirm' ? dialog.season.name : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              Отмена
            </Button>
            <Button
              variant={
                dialog?.kind === 'confirm' && dialog.action === 'finish'
                  ? 'destructive'
                  : 'default'
              }
              onClick={handleConfirm}
              disabled={mutating}
            >
              {mutating
                ? 'Применение…'
                : dialog?.kind === 'confirm' && dialog.action === 'start'
                  ? 'Старт'
                  : 'Финиш'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
