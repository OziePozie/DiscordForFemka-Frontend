import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  useAcceptLobby,
  useCancelLobby,
  useCreateLobby,
  useLobbies,
  useMe,
} from '@/lib/queries';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { ProblemDetailError } from '@/lib/api/client';
import {
  MATCH_FORMAT_LABEL,
  MATCH_KIND_LABEL,
  type CreateMatchRequestDto,
  type MatchFormat,
  type MatchKind,
  type TeamMembershipDto,
} from '@/lib/api/types';
import { formatDateTimeLocal, parseLocalDateTime } from '@/lib/utils';

const PAGE_SIZE = 12;

const KIND_OPTIONS: Array<{ value: 'ALL' | MatchKind; label: string }> = [
  { value: 'ALL', label: 'Все типы' },
  { value: 'CLAN_WAR', label: MATCH_KIND_LABEL.CLAN_WAR },
  { value: 'SHOWMATCH', label: MATCH_KIND_LABEL.SHOWMATCH },
];

const FORMAT_OPTIONS: Array<{ value: 'ALL' | MatchFormat; label: string }> = [
  { value: 'ALL', label: 'Любой формат' },
  { value: 'BO1', label: MATCH_FORMAT_LABEL.BO1 },
  { value: 'BO3', label: MATCH_FORMAT_LABEL.BO3 },
];

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function mmrRange(min?: number | null, max?: number | null): string {
  if (min == null && max == null) return 'Любой MMR';
  if (min == null) return `до ${max}`;
  if (max == null) return `от ${min}`;
  return `${min}–${max}`;
}

function myCaptainTeams(teams: TeamMembershipDto[] | undefined) {
  return (teams ?? []).filter(
    (t) => t.role === 'CAPTAIN' && t.teamStatus === 'ACTIVE',
  );
}

export default function LobbiesPage() {
  const { isAuthenticated } = useAuth();
  const me = useMe();
  const { toast } = useToast();

  const [kind, setKind] = useState<'ALL' | MatchKind>('ALL');
  const [format, setFormat] = useState<'ALL' | MatchFormat>('ALL');
  const [region, setRegion] = useState('');
  const [mmrMin, setMmrMin] = useState('');
  const [mmrMax, setMmrMax] = useState('');
  const [fromDt, setFromDt] = useState('');
  const [toDt, setToDt] = useState('');
  const [page, setPage] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);

  const captainTeams = isAuthenticated
    ? myCaptainTeams(me.data?.teams)
    : [];
  const canCreate = captainTeams.length > 0;
  const canAcceptAsCaptain = canCreate;

  const lobbies = useLobbies({
    kind: kind === 'ALL' ? undefined : kind,
    format: format === 'ALL' ? undefined : format,
    region: region.trim() || undefined,
    mmrMin: mmrMin ? Number(mmrMin) : undefined,
    mmrMax: mmrMax ? Number(mmrMax) : undefined,
    from: parseLocalDateTime(fromDt) ?? undefined,
    to: parseLocalDateTime(toDt) ?? undefined,
    page,
    size: PAGE_SIZE,
  });

  const acceptLobby = useAcceptLobby();
  const cancelLobby = useCancelLobby();

  function describeError(e: unknown): string {
    if (e instanceof ProblemDetailError) {
      return `${e.title}${e.detail ? `: ${e.detail}` : ''}`;
    }
    return e instanceof Error ? e.message : 'Неизвестная ошибка';
  }

  async function handleAccept(id: string) {
    try {
      const match = await acceptLobby.mutateAsync(id);
      // TODO: navigate to /matches/:id page when it exists
      toast({ title: `Создан матч ${match.id}` });
    } catch (e) {
      toast({
        title: 'Не удалось принять лобби',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  async function handleCancel(id: string) {
    try {
      await cancelLobby.mutateAsync(id);
      toast({ title: 'Лобби отменено' });
    } catch (e) {
      toast({
        title: 'Не удалось отменить',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  function resetFilters() {
    setKind('ALL');
    setFormat('ALL');
    setRegion('');
    setMmrMin('');
    setMmrMax('');
    setFromDt('');
    setToDt('');
    setPage(0);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Открытые лобби</h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {lobbies.data?.totalItems ?? 0} всего
          </div>
          {canCreate && (
            <Button onClick={() => setCreateOpen(true)}>Создать лобби</Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label>Тип</Label>
            <Select
              value={kind}
              onValueChange={(v) => {
                setKind(v as typeof kind);
                setPage(0);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KIND_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Формат</Label>
            <Select
              value={format}
              onValueChange={(v) => {
                setFormat(v as typeof format);
                setPage(0);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Регион</Label>
            <Input
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                setPage(0);
              }}
              placeholder="EU / RU / NA"
            />
          </div>
          <div className="space-y-1">
            <Label>MMR от / до</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={mmrMin}
                onChange={(e) => {
                  setMmrMin(e.target.value);
                  setPage(0);
                }}
                placeholder="мин"
              />
              <Input
                type="number"
                value={mmrMax}
                onChange={(e) => {
                  setMmrMax(e.target.value);
                  setPage(0);
                }}
                placeholder="макс"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>С</Label>
            <Input
              type="datetime-local"
              value={fromDt}
              onChange={(e) => {
                setFromDt(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <div className="space-y-1">
            <Label>По</Label>
            <Input
              type="datetime-local"
              value={toDt}
              onChange={(e) => {
                setToDt(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={resetFilters}>
              Сбросить фильтры
            </Button>
          </div>
        </CardContent>
      </Card>

      {lobbies.isLoading && (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {lobbies.isError && (
        <div className="text-sm text-destructive">
          Не удалось загрузить лобби:{' '}
          {lobbies.error?.message ?? 'unknown error'}
        </div>
      )}

      {lobbies.data && (lobbies.data.items?.length ?? 0) === 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          Открытых лобби нет.
        </div>
      )}

      {lobbies.data && (lobbies.data.items?.length ?? 0) > 0 && (
        <div className="space-y-3">
          {lobbies.data.items!.map((lobby) => {
            const isOwner =
              !!me.data &&
              captainTeams.some((t) => t.teamId === lobby.creatorTeam.id);
            const isMyTeamsLobby =
              !!me.data &&
              (me.data.teams ?? []).some(
                (t) => t.teamId === lobby.creatorTeam.id,
              );
            const canAccept =
              canAcceptAsCaptain && !isMyTeamsLobby && lobby.status === 'OPEN';

            return (
              <Card key={lobby.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg">
                        <Link
                          to={`/teams/${lobby.creatorTeam.id}`}
                          className="hover:underline"
                        >
                          {lobby.creatorTeam.name}{' '}
                          <span className="text-sm text-muted-foreground">
                            [{lobby.creatorTeam.tag}]
                          </span>
                        </Link>
                      </CardTitle>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge variant="default">
                          {MATCH_KIND_LABEL[lobby.kind]}
                        </Badge>
                        <Badge variant="secondary">
                          {MATCH_FORMAT_LABEL[lobby.format]}
                        </Badge>
                        {lobby.region && (
                          <Badge variant="outline">{lobby.region}</Badge>
                        )}
                        <Badge variant="outline">
                          MMR: {mmrRange(lobby.avgMmrMin, lobby.avgMmrMax)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {isOwner ? (
                        <Button
                          variant="outline"
                          onClick={() => handleCancel(lobby.id)}
                          disabled={cancelLobby.isPending}
                        >
                          Отменить
                        </Button>
                      ) : canAccept ? (
                        <Button
                          onClick={() => handleAccept(lobby.id)}
                          disabled={acceptLobby.isPending}
                        >
                          Принять
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  <div className="text-muted-foreground">
                    Старт:{' '}
                    <span className="text-foreground">
                      {fmtDateTime(lobby.startsAt)}
                    </span>
                  </div>
                  {lobby.description && (
                    <div className="whitespace-pre-wrap text-foreground">
                      {lobby.description}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {lobbies.data && (lobbies.data.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Назад
          </Button>
          <div className="text-sm text-muted-foreground">
            Страница {(lobbies.data.page ?? page) + 1} из{' '}
            {lobbies.data.totalPages}
          </div>
          <Button
            variant="outline"
            disabled={page + 1 >= (lobbies.data.totalPages ?? 1)}
            onClick={() => setPage((p) => p + 1)}
          >
            Дальше
          </Button>
        </div>
      )}

      <CreateLobbyDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        captainTeams={captainTeams}
      />
    </div>
  );
}

interface CreateLobbyDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  captainTeams: TeamMembershipDto[];
}

function CreateLobbyDialog({
  open,
  onOpenChange,
  captainTeams,
}: CreateLobbyDialogProps) {
  const { toast } = useToast();
  const createLobby = useCreateLobby();

  const [kind, setKind] = useState<MatchKind>('CLAN_WAR');
  const [format, setFormat] = useState<MatchFormat>('BO1');
  const [region, setRegion] = useState('');
  const [mmrMin, setMmrMin] = useState('');
  const [mmrMax, setMmrMax] = useState('');
  const [startsAt, setStartsAt] = useState(formatDateTimeLocal(new Date().toISOString()));
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setKind('CLAN_WAR');
    setFormat('BO1');
    setRegion('');
    setMmrMin('');
    setMmrMax('');
    setStartsAt(formatDateTimeLocal(new Date().toISOString()));
    setDescription('');
    setError(null);
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    setError(null);

    const startsAtIso = parseLocalDateTime(startsAt);
    if (!startsAtIso) {
      setError('Укажите дату и время старта');
      return;
    }

    const body: CreateMatchRequestDto = {
      kind,
      format,
      region: region.trim() || undefined,
      avgMmrMin: mmrMin ? Number(mmrMin) : undefined,
      avgMmrMax: mmrMax ? Number(mmrMax) : undefined,
      startsAt: startsAtIso,
      description: description.trim() || undefined,
    };

    try {
      await createLobby.mutateAsync(body);
      toast({ title: 'Лобби создано' });
      onOpenChange(false);
      reset();
    } catch (e) {
      const msg =
        e instanceof ProblemDetailError
          ? e.detail ?? e.title
          : e instanceof Error
            ? e.message
            : 'Неизвестная ошибка';
      setError(msg);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать лобби</DialogTitle>
          <DialogDescription>
            {captainTeams.length === 1
              ? `От имени команды ${captainTeams[0].name} [${captainTeams[0].tag}]`
              : 'От имени вашей активной команды'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Тип</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as MatchKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLAN_WAR">
                    {MATCH_KIND_LABEL.CLAN_WAR}
                  </SelectItem>
                  <SelectItem value="SHOWMATCH">
                    {MATCH_KIND_LABEL.SHOWMATCH}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Формат</Label>
              <Select
                value={format}
                onValueChange={(v) => setFormat(v as MatchFormat)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BO1">{MATCH_FORMAT_LABEL.BO1}</SelectItem>
                  <SelectItem value="BO3">{MATCH_FORMAT_LABEL.BO3}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Регион</Label>
              <Input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="EU"
              />
            </div>
            <div className="space-y-1">
              <Label>Старт</Label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>MMR от</Label>
              <Input
                type="number"
                value={mmrMin}
                onChange={(e) => setMmrMin(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>MMR до</Label>
              <Input
                type="number"
                value={mmrMax}
                onChange={(e) => setMmrMax(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="desc">Описание</Label>
            <textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Дополнительные условия, контакты и т.д."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={createLobby.isPending}>
              {createLobby.isPending ? 'Создание…' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
