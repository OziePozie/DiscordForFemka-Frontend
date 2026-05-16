import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useAdminMmrRequests,
  useApproveMmrRequest,
  useRejectMmrRequest,
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
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ProblemDetailError } from '@/lib/api/client';
import { attachmentUrl } from '@/lib/api/endpoints';
import {
  MMR_CHANGE_REASON_LABEL,
  type MmrChangeRequestAdminDto,
} from '@/lib/api/types';
import { timeAgo } from '@/lib/utils';

type FilterValue = 'pending' | 'all';

type DialogAction = 'approve' | 'reject';

const PAGE_SIZE = 25;

export default function AdminMmrPage() {
  const [filter, setFilter] = useState<FilterValue>('pending');
  const [page, setPage] = useState(0);
  const q = useAdminMmrRequests({ status: filter, page, size: PAGE_SIZE });

  const approve = useApproveMmrRequest();
  const reject = useRejectMmrRequest();
  const { toast } = useToast();

  const [dialogState, setDialogState] = useState<{
    action: DialogAction;
    item: MmrChangeRequestAdminDto;
  } | null>(null);
  const [comment, setComment] = useState('');

  function openDialog(action: DialogAction, item: MmrChangeRequestAdminDto) {
    setDialogState({ action, item });
    setComment('');
  }

  async function handleConfirm() {
    if (!dialogState) return;
    const { action, item } = dialogState;
    try {
      if (action === 'approve') {
        await approve.mutateAsync({ id: item.id, comment: comment || undefined });
        toast({ title: 'Заявка одобрена' });
      } else {
        if (!comment.trim()) {
          toast({
            title: 'Нужен комментарий',
            description: 'Для отклонения требуется указать причину',
            variant: 'destructive',
          });
          return;
        }
        await reject.mutateAsync({ id: item.id, comment: comment.trim() });
        toast({ title: 'Заявка отклонена' });
      }
      setDialogState(null);
      setComment('');
    } catch (e) {
      const msg =
        e instanceof ProblemDetailError
          ? `${e.title}${e.detail ? `: ${e.detail}` : ''}`
          : e instanceof Error
            ? e.message
            : 'Неизвестная ошибка';
      toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
    }
  }

  const pending = approve.isPending || reject.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">MMR-заявки</h1>
        <Select
          value={filter}
          onValueChange={(v) => {
            setFilter(v as FilterValue);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">В ожидании</SelectItem>
            <SelectItem value="all">Все</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {q.isLoading && <Skeleton className="h-80 w-full" />}

      {q.isError && (
        <div className="text-sm text-destructive">
          Не удалось загрузить заявки: {q.error?.message ?? 'unknown error'}
        </div>
      )}

      {q.data && (q.data.items?.length ?? 0) === 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          Заявок нет.
        </div>
      )}

      {q.data && (q.data.items?.length ?? 0) > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Игрок</th>
                <th className="px-4 py-2 font-medium">MMR</th>
                <th className="px-4 py-2 font-medium">Причина</th>
                <th className="px-4 py-2 font-medium">Комментарий</th>
                <th className="px-4 py-2 font-medium">Скрин</th>
                <th className="px-4 py-2 font-medium">Создана</th>
                <th className="px-4 py-2 font-medium">Статус</th>
                <th className="px-4 py-2 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {q.data.items!.map((it) => (
                <tr key={it.id} className="border-t align-top">
                  <td className="px-4 py-3">
                    <Link
                      to={`/players/${it.player.id}`}
                      className="hover:underline"
                    >
                      {it.player.nickname ?? 'Без ника'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {it.currentMmr} → <strong>{it.requestedMmr}</strong>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">
                      {MMR_CHANGE_REASON_LABEL[it.reason]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {it.comment ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={attachmentUrl(it.screenshotId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Открыть
                    </a>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {timeAgo(it.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {it.status === 'PENDING' && (
                      <Badge variant="secondary">В ожидании</Badge>
                    )}
                    {it.status === 'APPROVED' && (
                      <Badge variant="default">Одобрена</Badge>
                    )}
                    {it.status === 'REJECTED' && (
                      <Badge variant="destructive">Отклонена</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {it.status === 'PENDING' ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => openDialog('approve', it)}
                          disabled={pending}
                        >
                          Одобрить
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDialog('reject', it)}
                          disabled={pending}
                        >
                          Отклонить
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {it.reviewComment ?? '—'}
                      </span>
                    )}
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

      <Dialog
        open={!!dialogState}
        onOpenChange={(open) => {
          if (!open) {
            setDialogState(null);
            setComment('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogState?.action === 'approve'
                ? 'Одобрить заявку'
                : 'Отклонить заявку'}
            </DialogTitle>
            <DialogDescription>
              {dialogState
                ? `${dialogState.item.player.nickname ?? 'Без ника'}: ${dialogState.item.currentMmr} → ${dialogState.item.requestedMmr}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="review-comment">
              Комментарий
              {dialogState?.action === 'reject' ? ' (обязательно)' : ' (необязательно)'}
            </Label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder={
                dialogState?.action === 'reject'
                  ? 'Укажите причину отклонения'
                  : 'Опционально'
              }
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setDialogState(null);
                setComment('');
              }}
            >
              Отмена
            </Button>
            <Button
              variant={
                dialogState?.action === 'reject' ? 'destructive' : 'default'
              }
              onClick={handleConfirm}
              disabled={pending}
            >
              {pending
                ? 'Отправка…'
                : dialogState?.action === 'approve'
                  ? 'Одобрить'
                  : 'Отклонить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
