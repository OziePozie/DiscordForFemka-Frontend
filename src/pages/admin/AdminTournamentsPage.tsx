import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useCreateTournament,
  useUpdateTournament,
  useOpenTournamentRegistration,
  useCloseTournamentRegistration,
  useStartTournament,
  useFinishTournament,
  useGenerateBracket,
  useTournamentEligibility,
  useUpdateTournamentEligibility,
} from '@/lib/queries';
import { getSeasonsPage, getSeasonBySlug } from '@/lib/api/endpoints';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
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
import {
  GAME_MODES,
  GAME_MODE_LABEL,
  REGIONS,
  REGION_LABEL,
  TOURNAMENT_FORMAT_LABEL,
  TOURNAMENT_STATUS_LABEL,
  type BracketDto,
  type GameMode,
  type Region,
  type SeasonDto,
  type TournamentDto,
  type TournamentEligibilityDto,
  type TournamentFormat,
  type TournamentStatus,
} from '@/lib/api/types';
import { formatDateTimeLocal, parseLocalDateTime } from '@/lib/utils';

const PAGE_SIZE = 25;
const SLUG_RE = /^[a-z0-9-]+$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FORMATS: TournamentFormat[] = [
  'SINGLE_ELIM',
  'DOUBLE_ELIM',
  'ROUND_ROBIN',
  'SWISS',
  'SHOWMATCH',
];

// "—" sentinel for nullable selects (Radix Select disallows empty-string values).
const NONE = '__none__';

type FormState = {
  name: string;
  slug: string;
  seasonId: string;
  format: TournamentFormat;
  description: string;
  rules: string;
  prizePoolText: string;
  maxTeams: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
  startsAt: string;
  endsAt: string;
  // Match defaults (captain-readiness feature).
  defaultGameMode: string; // GameMode | NONE
  defaultRegion: string; // Region | NONE
  defaultCoinToss: boolean;
  defaultAutoLaunch: boolean;
  dotaLeagueId: string;
};

function emptyForm(seasonId: string | null): FormState {
  return {
    name: '',
    slug: '',
    seasonId: seasonId ?? '',
    format: 'SINGLE_ELIM',
    description: '',
    rules: '',
    prizePoolText: '',
    maxTeams: '',
    registrationOpensAt: '',
    registrationClosesAt: '',
    startsAt: '',
    endsAt: '',
    defaultGameMode: NONE,
    defaultRegion: NONE,
    defaultCoinToss: true,
    defaultAutoLaunch: false,
    dotaLeagueId: '',
  };
}

type DialogState =
  | { kind: 'create' }
  | { kind: 'edit'; tournament: TournamentDto }
  | { kind: 'eligibility'; tournament: TournamentDto }
  | { kind: 'confirm-bracket'; tournament: TournamentDto }
  | { kind: 'finish'; tournament: TournamentDto }
  | { kind: 'bracket-result'; tournament: TournamentDto; bracket: BracketDto }
  | null;

function statusVariant(s: TournamentStatus) {
  switch (s) {
    case 'LIVE':
      return 'default' as const;
    case 'REGISTRATION_OPEN':
      return 'default' as const;
    case 'REGISTRATION_CLOSED':
      return 'secondary' as const;
    case 'ANNOUNCED':
      return 'secondary' as const;
    case 'CANCELLED':
      return 'destructive' as const;
    case 'FINISHED':
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

export default function AdminTournamentsPage() {
  const { toast } = useToast();

  // Load all seasons (small set) once for the filter / create form.
  const seasonsQ = useQuery({
    queryKey: ['admin-tournaments-seasons'],
    queryFn: () => getSeasonsPage({ size: 50 }),
    staleTime: 60_000,
  });

  const seasons: SeasonDto[] = seasonsQ.data?.items ?? [];

  const [seasonSlug, setSeasonSlug] = useState<string>('');

  // Auto-select first season once loaded.
  useEffect(() => {
    if (!seasonSlug && seasons.length > 0) {
      setSeasonSlug(seasons[0].slug);
    }
  }, [seasons, seasonSlug]);

  const seasonDetailsQ = useQuery({
    queryKey: ['admin-season-details', seasonSlug],
    queryFn: () => getSeasonBySlug(seasonSlug),
    enabled: !!seasonSlug,
  });

  const allTournaments: TournamentDto[] = seasonDetailsQ.data?.tournaments ?? [];

  const [page, setPage] = useState(0);
  useEffect(() => {
    setPage(0);
  }, [seasonSlug]);

  const pageItems = useMemo(
    () => allTournaments.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [allTournaments, page],
  );
  const totalPages = Math.max(1, Math.ceil(allTournaments.length / PAGE_SIZE));

  // Mutations.
  const createMut = useCreateTournament();
  const updateMut = useUpdateTournament();
  const openRegMut = useOpenTournamentRegistration();
  const closeRegMut = useCloseTournamentRegistration();
  const startMut = useStartTournament();
  const finishMut = useFinishTournament();
  const bracketMut = useGenerateBracket();

  const mutating =
    createMut.isPending ||
    updateMut.isPending ||
    openRegMut.isPending ||
    closeRegMut.isPending ||
    startMut.isPending ||
    finishMut.isPending ||
    bracketMut.isPending;

  const [dialog, setDialog] = useState<DialogState>(null);
  const [form, setForm] = useState<FormState>(emptyForm(null));
  const [winnerTeamId, setWinnerTeamId] = useState('');

  function openCreate() {
    const currentSeason = seasons.find((s) => s.slug === seasonSlug);
    setForm(emptyForm(currentSeason?.id ?? null));
    setDialog({ kind: 'create' });
  }

  function openEdit(t: TournamentDto) {
    // TODO: drop the `extra` cast once openapi regenerates with the new
    // tournament defaults — they are not yet in TournamentDto.
    const extra = t as TournamentDto & {
      defaultGameMode?: GameMode | null;
      defaultRegion?: Region | null;
      defaultCoinToss?: boolean | null;
      defaultAutoLaunch?: boolean | null;
      dotaLeagueId?: number | null;
    };
    setForm({
      name: t.name,
      slug: t.slug,
      seasonId: t.seasonId ?? '',
      format: t.format,
      description: t.description ?? '',
      rules: '',
      prizePoolText: t.prizePoolText ?? '',
      maxTeams: t.maxTeams != null ? String(t.maxTeams) : '',
      registrationOpensAt: formatDateTimeLocal(t.registrationOpensAt),
      registrationClosesAt: formatDateTimeLocal(t.registrationClosesAt),
      startsAt: formatDateTimeLocal(t.startsAt),
      endsAt: formatDateTimeLocal(t.endsAt),
      defaultGameMode: extra.defaultGameMode ?? NONE,
      defaultRegion: extra.defaultRegion ?? NONE,
      defaultCoinToss: extra.defaultCoinToss ?? true,
      defaultAutoLaunch: extra.defaultAutoLaunch ?? false,
      dotaLeagueId:
        extra.dotaLeagueId != null ? String(extra.dotaLeagueId) : '',
    });
    setDialog({ kind: 'edit', tournament: t });
  }

  function closeDialog() {
    setDialog(null);
    setWinnerTeamId('');
  }

  function validateCreate(): string | null {
    if (!form.name.trim()) return 'Укажите название';
    if (!form.slug.trim()) return 'Укажите slug';
    if (!SLUG_RE.test(form.slug)) {
      return 'Slug может содержать только a-z, 0-9 и дефис';
    }
    if (form.slug.length > 64) return 'Slug не длиннее 64 символов';
    if (!form.seasonId) return 'Выберите сезон';
    if (form.maxTeams && !/^\d+$/.test(form.maxTeams)) {
      return 'maxTeams должно быть целым числом';
    }
    if (form.dotaLeagueId && !/^\d+$/.test(form.dotaLeagueId)) {
      return 'Dota league ID должен быть целым числом';
    }
    return null;
  }

  function matchDefaultsPayload() {
    return {
      defaultGameMode:
        form.defaultGameMode === NONE
          ? null
          : (form.defaultGameMode as GameMode),
      defaultRegion:
        form.defaultRegion === NONE ? null : (form.defaultRegion as Region),
      defaultCoinToss: form.defaultCoinToss,
      defaultAutoLaunch: form.defaultAutoLaunch,
      dotaLeagueId: form.dotaLeagueId ? Number(form.dotaLeagueId) : null,
    };
  }

  async function handleSubmit() {
    if (!dialog) return;

    if (dialog.kind === 'create') {
      const err = validateCreate();
      if (err) {
        toast({ title: 'Ошибка', description: err, variant: 'destructive' });
        return;
      }
      try {
        const t = await createMut.mutateAsync({
          name: form.name.trim(),
          slug: form.slug.trim(),
          seasonId: form.seasonId,
          format: form.format,
          description: form.description.trim() || null,
          rules: form.rules.trim() || null,
          prizePoolText: form.prizePoolText.trim() || null,
          maxTeams: form.maxTeams ? Number(form.maxTeams) : null,
          registrationOpensAt: parseLocalDateTime(form.registrationOpensAt),
          registrationClosesAt: parseLocalDateTime(form.registrationClosesAt),
          startsAt: parseLocalDateTime(form.startsAt),
          endsAt: parseLocalDateTime(form.endsAt),
          ...matchDefaultsPayload(),
        });
        toast({ title: 'Турнир создан', description: t.name });
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
      if (!form.name.trim()) {
        toast({
          title: 'Ошибка',
          description: 'Название обязательно',
          variant: 'destructive',
        });
        return;
      }
      if (form.maxTeams && !/^\d+$/.test(form.maxTeams)) {
        toast({
          title: 'Ошибка',
          description: 'maxTeams должно быть целым числом',
          variant: 'destructive',
        });
        return;
      }
      if (form.dotaLeagueId && !/^\d+$/.test(form.dotaLeagueId)) {
        toast({
          title: 'Ошибка',
          description: 'Dota league ID должен быть целым числом',
          variant: 'destructive',
        });
        return;
      }
      try {
        await updateMut.mutateAsync({
          id: dialog.tournament.id,
          patch: {
            name: form.name.trim(),
            description: form.description.trim() || null,
            rules: form.rules.trim() || null,
            prizePoolText: form.prizePoolText.trim() || null,
            maxTeams: form.maxTeams ? Number(form.maxTeams) : null,
            registrationOpensAt: parseLocalDateTime(form.registrationOpensAt),
            registrationClosesAt: parseLocalDateTime(form.registrationClosesAt),
            startsAt: parseLocalDateTime(form.startsAt),
            endsAt: parseLocalDateTime(form.endsAt),
            ...matchDefaultsPayload(),
          },
        });
        toast({ title: 'Турнир обновлён' });
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

  async function handleGenerateBracket() {
    if (!dialog || dialog.kind !== 'confirm-bracket') return;
    try {
      const bracket = await bracketMut.mutateAsync(dialog.tournament.id);
      setDialog({
        kind: 'bracket-result',
        tournament: dialog.tournament,
        bracket,
      });
    } catch (e) {
      toast({
        title: 'Не удалось сгенерировать сетку',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  async function handleFinish() {
    if (!dialog || dialog.kind !== 'finish') return;
    const id = winnerTeamId.trim();
    if (id && !UUID_RE.test(id)) {
      toast({
        title: 'Невалидный UUID',
        description: 'Введите корректный UUID или оставьте пустым',
        variant: 'destructive',
      });
      return;
    }
    try {
      await finishMut.mutateAsync({
        id: dialog.tournament.id,
        winnerTeamId: id || undefined,
      });
      toast({ title: 'Турнир завершён' });
      closeDialog();
    } catch (e) {
      toast({
        title: 'Не удалось завершить',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  async function runTransition(
    t: TournamentDto,
    action: 'open' | 'close' | 'start',
  ) {
    try {
      if (action === 'open') {
        await openRegMut.mutateAsync(t.id);
        toast({ title: 'Регистрация открыта' });
      } else if (action === 'close') {
        await closeRegMut.mutateAsync(t.id);
        toast({ title: 'Регистрация закрыта' });
      } else {
        await startMut.mutateAsync(t.id);
        toast({ title: 'Турнир запущен' });
      }
    } catch (e) {
      toast({
        title: 'Ошибка',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Турниры</h1>
        <Button onClick={openCreate} disabled={seasons.length === 0}>
          Новый турнир
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor="season-filter" className="text-sm">
          Сезон:
        </Label>
        <Select
          value={seasonSlug || undefined}
          onValueChange={(v) => setSeasonSlug(v)}
        >
          <SelectTrigger id="season-filter" className="w-64">
            <SelectValue placeholder="Выберите сезон" />
          </SelectTrigger>
          <SelectContent>
            {seasons.map((s) => (
              <SelectItem key={s.id} value={s.slug}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(seasonsQ.isLoading || seasonDetailsQ.isLoading) && (
        <Skeleton className="h-80 w-full" />
      )}

      {seasonDetailsQ.isError && (
        <div className="text-sm text-destructive">
          Не удалось загрузить турниры:{' '}
          {seasonDetailsQ.error?.message ?? 'unknown error'}
        </div>
      )}

      {seasonsQ.data && seasons.length === 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          Нет сезонов. Создайте сезон во вкладке «Сезоны».
        </div>
      )}

      {seasonDetailsQ.data && allTournaments.length === 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          В этом сезоне ещё нет турниров.
        </div>
      )}

      {pageItems.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Название</th>
                <th className="px-4 py-2 font-medium">Slug</th>
                <th className="px-4 py-2 font-medium">Формат</th>
                <th className="px-4 py-2 font-medium">Статус</th>
                <th className="px-4 py-2 font-medium">Макс. команд</th>
                <th className="px-4 py-2 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((t) => (
                <TournamentRow
                  key={t.id}
                  t={t}
                  mutating={mutating}
                  onEdit={() => openEdit(t)}
                  onEligibility={() =>
                    setDialog({ kind: 'eligibility', tournament: t })
                  }
                  onOpenReg={() => runTransition(t, 'open')}
                  onCloseReg={() => runTransition(t, 'close')}
                  onGenerateBracket={() =>
                    setDialog({ kind: 'confirm-bracket', tournament: t })
                  }
                  onStart={() => runTransition(t, 'start')}
                  onFinish={() => setDialog({ kind: 'finish', tournament: t })}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Назад
          </Button>
          <div className="text-sm text-muted-foreground">
            Страница {page + 1} из {totalPages}
          </div>
          <Button
            variant="outline"
            disabled={page + 1 >= totalPages}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialog?.kind === 'edit'
                ? 'Редактировать турнир'
                : 'Новый турнир'}
            </DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'edit'
                ? 'Slug, формат и сезон изменить нельзя.'
                : 'Поля, отмеченные звёздочкой — обязательны.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="tn-name">Название *</Label>
                <Input
                  id="tn-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tn-slug">Slug *</Label>
                <Input
                  id="tn-slug"
                  value={form.slug}
                  onChange={(e) =>
                    setForm({ ...form, slug: e.target.value.toLowerCase() })
                  }
                  disabled={dialog?.kind === 'edit'}
                  maxLength={64}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="tn-season">Сезон *</Label>
                <Select
                  value={form.seasonId || undefined}
                  onValueChange={(v) => setForm({ ...form, seasonId: v })}
                  disabled={dialog?.kind === 'edit'}
                >
                  <SelectTrigger id="tn-season">
                    <SelectValue placeholder="Выберите сезон" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="tn-format">Формат *</Label>
                <Select
                  value={form.format}
                  onValueChange={(v) =>
                    setForm({ ...form, format: v as TournamentFormat })
                  }
                  disabled={dialog?.kind === 'edit'}
                >
                  <SelectTrigger id="tn-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {TOURNAMENT_FORMAT_LABEL[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="tn-desc">Описание</Label>
              <textarea
                id="tn-desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tn-rules">Правила</Label>
              <textarea
                id="tn-rules"
                value={form.rules}
                onChange={(e) => setForm({ ...form, rules: e.target.value })}
                className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="tn-prize">Призовой фонд</Label>
                <Input
                  id="tn-prize"
                  value={form.prizePoolText}
                  onChange={(e) =>
                    setForm({ ...form, prizePoolText: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tn-maxteams">Макс. команд</Label>
                <Input
                  id="tn-maxteams"
                  type="number"
                  min={0}
                  value={form.maxTeams}
                  onChange={(e) =>
                    setForm({ ...form, maxTeams: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="tn-regopen">Регистрация откр.</Label>
                <Input
                  id="tn-regopen"
                  type="datetime-local"
                  value={form.registrationOpensAt}
                  onChange={(e) =>
                    setForm({ ...form, registrationOpensAt: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tn-regclose">Регистрация закр.</Label>
                <Input
                  id="tn-regclose"
                  type="datetime-local"
                  value={form.registrationClosesAt}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      registrationClosesAt: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="tn-starts">Старт</Label>
                <Input
                  id="tn-starts"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) =>
                    setForm({ ...form, startsAt: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tn-ends">Финиш</Label>
                <Input
                  id="tn-ends"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) =>
                    setForm({ ...form, endsAt: e.target.value })
                  }
                />
              </div>
            </div>

            <details className="rounded-md border bg-muted/30 px-3 py-2">
              <summary className="cursor-pointer select-none text-sm font-medium">
                Настройки матчей по умолчанию
              </summary>
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="tn-gamemode">Режим игры</Label>
                    <Select
                      value={form.defaultGameMode}
                      onValueChange={(v) =>
                        setForm({ ...form, defaultGameMode: v })
                      }
                    >
                      <SelectTrigger id="tn-gamemode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>—</SelectItem>
                        {GAME_MODES.map((g) => (
                          <SelectItem key={g} value={g}>
                            {GAME_MODE_LABEL[g]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="tn-region">Регион</Label>
                    <Select
                      value={form.defaultRegion}
                      onValueChange={(v) =>
                        setForm({ ...form, defaultRegion: v })
                      }
                    >
                      <SelectTrigger id="tn-region">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>—</SelectItem>
                        {REGIONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {REGION_LABEL[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input"
                      checked={form.defaultCoinToss}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          defaultCoinToss: e.target.checked,
                        })
                      }
                    />
                    Coin toss (выбор стороны)
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input"
                      checked={form.defaultAutoLaunch}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          defaultAutoLaunch: e.target.checked,
                        })
                      }
                    />
                    Auto-launch матча
                  </label>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tn-leagueid">Dota league ID</Label>
                  <Input
                    id="tn-leagueid"
                    type="number"
                    min={0}
                    value={form.dotaLeagueId}
                    onChange={(e) =>
                      setForm({ ...form, dotaLeagueId: e.target.value })
                    }
                    placeholder="опционально"
                  />
                </div>
              </div>
            </details>
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

      {/* Confirm bracket generation */}
      <Dialog
        open={dialog?.kind === 'confirm-bracket'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сгенерировать сетку?</DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'confirm-bracket'
                ? dialog.tournament.name
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              Отмена
            </Button>
            <Button onClick={handleGenerateBracket} disabled={mutating}>
              {bracketMut.isPending ? 'Генерация…' : 'Сгенерировать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bracket result */}
      <Dialog
        open={dialog?.kind === 'bracket-result'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сетка сгенерирована</DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'bracket-result'
                ? `${dialog.tournament.name}: ${dialog.bracket.rounds.reduce(
                    (acc, r) => acc + (r.matches?.length ?? 0),
                    0,
                  )} матчей в ${dialog.bracket.rounds.length} раундах`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={closeDialog}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finish dialog */}
      <Dialog
        open={dialog?.kind === 'finish'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Завершить турнир</DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'finish' ? dialog.tournament.name : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="winner-id">
              ID команды-победителя (опционально)
            </Label>
            <Input
              id="winner-id"
              value={winnerTeamId}
              onChange={(e) => setWinnerTeamId(e.target.value)}
              placeholder="UUID или пусто — взять из сетки"
            />
            <p className="text-xs text-muted-foreground">
              Если оставить пустым, бекенд определит победителя по финальному
              матчу сетки.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleFinish}
              disabled={mutating}
            >
              {finishMut.isPending ? 'Применение…' : 'Завершить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Eligibility rules dialog. Mounted only while open so the GET fires
          exactly once per open. */}
      {dialog?.kind === 'eligibility' && (
        <EligibilityDialog
          tournament={dialog.tournament}
          onClose={closeDialog}
        />
      )}
    </div>
  );
}

interface EligibilityDialogProps {
  tournament: TournamentDto;
  onClose: () => void;
}

type EligibilityFormState = {
  expectedTeamSize: string;
  minMaleCount: string;
  minFemaleCount: string;
  maxPlayerMmr: string;
  maxTeamAvgMmr: string;
};

function emptyEligibilityForm(): EligibilityFormState {
  return {
    expectedTeamSize: '',
    minMaleCount: '',
    minFemaleCount: '',
    maxPlayerMmr: '',
    maxTeamAvgMmr: '',
  };
}

function eligibilityToForm(e: TournamentEligibilityDto): EligibilityFormState {
  const s = (n: number | null | undefined) => (n != null ? String(n) : '');
  return {
    expectedTeamSize: s(e.expectedTeamSize),
    minMaleCount: s(e.minMaleCount),
    minFemaleCount: s(e.minFemaleCount),
    maxPlayerMmr: s(e.maxPlayerMmr),
    maxTeamAvgMmr: s(e.maxTeamAvgMmr),
  };
}

function parseRule(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

function EligibilityDialog({ tournament, onClose }: EligibilityDialogProps) {
  const { toast } = useToast();
  const query = useTournamentEligibility(tournament.id);
  const mutation = useUpdateTournamentEligibility();

  const [form, setForm] = useState<EligibilityFormState>(emptyEligibilityForm());

  useEffect(() => {
    if (query.data) setForm(eligibilityToForm(query.data));
  }, [query.data]);

  function update<K extends keyof EligibilityFormState>(
    key: K,
    value: EligibilityFormState[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    const parsed = {
      expectedTeamSize: parseRule(form.expectedTeamSize),
      minMaleCount: parseRule(form.minMaleCount),
      minFemaleCount: parseRule(form.minFemaleCount),
      maxPlayerMmr: parseRule(form.maxPlayerMmr),
      maxTeamAvgMmr: parseRule(form.maxTeamAvgMmr),
    };
    for (const [k, v] of Object.entries(parsed)) {
      if (Number.isNaN(v as number)) {
        toast({
          title: 'Ошибка',
          description: `${k}: целое число ≥ 0 или пусто`,
          variant: 'destructive',
        });
        return;
      }
    }
    try {
      await mutation.mutateAsync({ id: tournament.id, body: parsed });
      toast({
        title: 'Правила сохранены',
        description: 'Команды этого турнира пересчитаны.',
      });
      onClose();
    } catch (e) {
      toast({
        title: 'Ошибка',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  async function handleClearAll() {
    try {
      await mutation.mutateAsync({
        id: tournament.id,
        body: {
          expectedTeamSize: null,
          minMaleCount: null,
          minFemaleCount: null,
          maxPlayerMmr: null,
          maxTeamAvgMmr: null,
        },
      });
      toast({ title: 'Правила сброшены' });
      onClose();
    } catch (e) {
      toast({
        title: 'Ошибка',
        description: describeError(e),
        variant: 'destructive',
      });
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Правила турнира — {tournament.name}</DialogTitle>
          <DialogDescription>
            Все поля опциональны. Пусто = «не проверять это правило». Soft
            валидация: регистрации не блокируются, нарушения помечаются флагами
            для админа.
          </DialogDescription>
        </DialogHeader>

        {query.isLoading ? (
          <div className="text-sm text-muted-foreground">Загрузка…</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rule-team-size">Размер команды</Label>
              <Input
                id="rule-team-size"
                type="number"
                min={0}
                value={form.expectedTeamSize}
                onChange={(e) => update('expectedTeamSize', e.target.value)}
                placeholder="напр., 5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule-min-male">Минимум мужчин в команде</Label>
              <Input
                id="rule-min-male"
                type="number"
                min={0}
                value={form.minMaleCount}
                onChange={(e) => update('minMaleCount', e.target.value)}
                placeholder="напр., 3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule-min-female">Минимум женщин в команде</Label>
              <Input
                id="rule-min-female"
                type="number"
                min={0}
                value={form.minFemaleCount}
                onChange={(e) => update('minFemaleCount', e.target.value)}
                placeholder="напр., 2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule-max-player-mmr">
                Макс. MMR на игрока
              </Label>
              <Input
                id="rule-max-player-mmr"
                type="number"
                min={0}
                value={form.maxPlayerMmr}
                onChange={(e) => update('maxPlayerMmr', e.target.value)}
                placeholder="напр., 8000"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="rule-max-team-avg-mmr">
                Макс. средний MMR команды
              </Label>
              <Input
                id="rule-max-team-avg-mmr"
                type="number"
                min={0}
                value={form.maxTeamAvgMmr}
                onChange={(e) => update('maxTeamAvgMmr', e.target.value)}
                placeholder="напр., 7000"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={handleClearAll}
            disabled={mutation.isPending || query.isLoading}
          >
            Сбросить все правила
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TournamentRowProps {
  t: TournamentDto;
  mutating: boolean;
  onEdit: () => void;
  onEligibility: () => void;
  onOpenReg: () => void;
  onCloseReg: () => void;
  onGenerateBracket: () => void;
  onStart: () => void;
  onFinish: () => void;
}

function TournamentRow({
  t,
  mutating,
  onEdit,
  onEligibility,
  onOpenReg,
  onCloseReg,
  onGenerateBracket,
  onStart,
  onFinish,
}: TournamentRowProps) {
  const canOpen = t.status === 'ANNOUNCED';
  const canClose = t.status === 'REGISTRATION_OPEN';
  const canGenerate = t.status === 'REGISTRATION_CLOSED';
  const canStart =
    t.status === 'REGISTRATION_CLOSED' || t.status === 'ANNOUNCED';
  const canFinish = t.status === 'LIVE';

  return (
    <tr className="border-t align-top">
      <td className="px-4 py-3 font-medium">{t.name}</td>
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
        {t.slug}
      </td>
      <td className="px-4 py-3">
        <Badge variant="outline">{TOURNAMENT_FORMAT_LABEL[t.format]}</Badge>
      </td>
      <td className="px-4 py-3">
        <Badge variant={statusVariant(t.status)}>
          {TOURNAMENT_STATUS_LABEL[t.status]}
        </Badge>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{t.maxTeams ?? '—'}</td>
      <td className="px-4 py-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" disabled={mutating}>
              Действия
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Редактировать</DropdownMenuItem>
            <DropdownMenuItem onClick={onEligibility}>
              Правила (eligibility)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onOpenReg}
              disabled={!canOpen}
              title={canOpen ? undefined : 'Доступно только для ANNOUNCED'}
            >
              Открыть регистрацию
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onCloseReg}
              disabled={!canClose}
              title={
                canClose
                  ? undefined
                  : 'Доступно только когда регистрация открыта'
              }
            >
              Закрыть регистрацию
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onGenerateBracket}
              disabled={!canGenerate}
              title={
                canGenerate
                  ? undefined
                  : 'Доступно после закрытия регистрации'
              }
            >
              Сгенерировать сетку
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onStart}
              disabled={!canStart}
              title={
                canStart ? undefined : 'Перед стартом закройте регистрацию'
              }
            >
              Старт
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onFinish}
              disabled={!canFinish}
              title={canFinish ? undefined : 'Доступно только для LIVE'}
            >
              Финиш
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
