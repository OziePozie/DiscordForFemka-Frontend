import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAudit } from '@/lib/queries';
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
import type { AuditLogDto } from '@/lib/api/types';
import { parseLocalDateTime } from '@/lib/utils';

const PAGE_SIZE = 50;

function fmtDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function payloadPreview(payload: AuditLogDto['payload']): string {
  if (payload == null) return '—';
  try {
    const s = JSON.stringify(payload);
    return s.length > 80 ? `${s.slice(0, 80)}…` : s;
  } catch {
    return '[unserializable]';
  }
}

function actorLabel(log: AuditLogDto): { id?: string; label: string } {
  if (log.actor) {
    return {
      id: log.actor.id,
      label: log.actor.nickname ?? log.actor.id,
    };
  }
  if (log.actorId) {
    return { id: log.actorId, label: log.actorId };
  }
  return { label: 'system' };
}

export default function AdminAuditPage() {
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [actorId, setActorId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);

  const q = useAdminAudit({
    action: action.trim() || undefined,
    targetType: targetType.trim() || undefined,
    actorId: actorId.trim() || undefined,
    from: parseLocalDateTime(from) ?? undefined,
    to: parseLocalDateTime(to) ?? undefined,
    page,
    size: PAGE_SIZE,
  });

  const [detail, setDetail] = useState<AuditLogDto | null>(null);

  function resetFilters() {
    setAction('');
    setTargetType('');
    setActorId('');
    setFrom('');
    setTo('');
    setPage(0);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Журнал аудита</h1>
        <div className="text-sm text-muted-foreground">
          {q.data?.totalItems ?? 0} записей
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="au-action">Action</Label>
          <Input
            id="au-action"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(0);
            }}
            placeholder="напр. mmr.approved"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="au-target">Target type</Label>
          <Input
            id="au-target"
            value={targetType}
            onChange={(e) => {
              setTargetType(e.target.value);
              setPage(0);
            }}
            placeholder="напр. PLAYER, TEAM"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="au-actor">Actor ID</Label>
          <Input
            id="au-actor"
            value={actorId}
            onChange={(e) => {
              setActorId(e.target.value);
              setPage(0);
            }}
            placeholder="UUID игрока"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="au-from">С</Label>
          <Input
            id="au-from"
            type="datetime-local"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="au-to">По</Label>
          <Input
            id="au-to"
            type="datetime-local"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <div className="flex items-end">
          <Button variant="outline" onClick={resetFilters}>
            Сбросить фильтры
          </Button>
        </div>
      </div>

      {q.isLoading && <Skeleton className="h-80 w-full" />}

      {q.isError && (
        <div className="text-sm text-destructive">
          Не удалось загрузить журнал: {q.error?.message ?? 'unknown error'}
        </div>
      )}

      {q.data && (q.data.items?.length ?? 0) === 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          Записей нет.
        </div>
      )}

      {q.data && (q.data.items?.length ?? 0) > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Время</th>
                <th className="px-4 py-2 font-medium">Action</th>
                <th className="px-4 py-2 font-medium">Target</th>
                <th className="px-4 py-2 font-medium">Actor</th>
                <th className="px-4 py-2 font-medium">Payload</th>
              </tr>
            </thead>
            <tbody>
              {q.data.items!.map((log) => {
                const actor = actorLabel(log);
                return (
                  <tr
                    key={log.id}
                    className="cursor-pointer border-t align-top hover:bg-muted/30"
                    onClick={() => setDetail(log)}
                  >
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                      {fmtDateTime(log.at)}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {log.action}
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-mono text-xs">{log.targetType}</div>
                      {log.targetId && (
                        <div className="font-mono text-xs text-muted-foreground">
                          {log.targetId}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {actor.id ? (
                        <Link
                          to={`/players/${actor.id}`}
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {actor.label}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">
                          {actor.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                      {payloadPreview(log.payload)}
                    </td>
                  </tr>
                );
              })}
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
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Запись аудита</DialogTitle>
            <DialogDescription>
              {detail ? `${detail.action} @ ${fmtDateTime(detail.at)}` : ''}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid gap-1 sm:grid-cols-2">
                <div>
                  <div className="text-muted-foreground">ID</div>
                  <div className="font-mono text-xs">{detail.id}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Action</div>
                  <div className="font-mono text-xs">{detail.action}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Target type</div>
                  <div className="font-mono text-xs">{detail.targetType}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Target ID</div>
                  <div className="font-mono text-xs">
                    {detail.targetId ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Actor</div>
                  <div className="font-mono text-xs">
                    {actorLabel(detail).label}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Время</div>
                  <div className="font-mono text-xs">
                    {fmtDateTime(detail.at)}
                  </div>
                </div>
              </div>
              <div>
                <div className="mb-1 text-muted-foreground">Payload</div>
                <pre className="max-h-[60vh] overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
                  {detail.payload
                    ? JSON.stringify(detail.payload, null, 2)
                    : '—'}
                </pre>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetail(null)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
