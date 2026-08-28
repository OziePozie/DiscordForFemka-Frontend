import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/auth';
import {
  useCheckInForMix,
  useMyMixEntry,
  useRegisterForMix,
  useWithdrawFromMix,
} from '@/lib/queries';
import { ProblemDetailError } from '@/lib/api/client';
import {
  PLAYER_POSITIONS,
  POSITION_LABEL,
  type PlayerPosition,
  type TournamentDto,
} from '@/lib/api/types';

function fmtDateTime(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// "H:MM:SS", падает до "MM:SS" внутри одного часа — та же идея, что и
// countdown() в OpenLobbyDetailsDialog (там таймер короче и часы не нужны).
function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

type CheckInPhase = 'no-window' | 'before' | 'open' | 'closed';

/**
 * 'no-window' — организатор ещё не назначил окно чек-ина (одно или оба поля
 * пустые). Бэк требует ОБА таймстампа и без них 409-ит детерминированно —
 * не «может быть отклонит», а гарантированно всегда (см.
 * MixRegistrationService.checkIn: `open = opensAt != null && closesAt !=
 * null && ...`, иначе сразу throw). Успешного чек-ина в этой фазе не бывает
 * никогда, поэтому 'no-window' рендерится как отдельная информационная
 * фаза без кнопки — как и 'before', а не как CTA «на всякий случай».
 */
function checkInPhase(
  nowMs: number,
  opensAt: string | null | undefined,
  closesAt: string | null | undefined,
): CheckInPhase {
  if (!opensAt || !closesAt) return 'no-window';
  const opens = new Date(opensAt).getTime();
  const closes = new Date(closesAt).getTime();
  if (nowMs < opens) return 'before';
  if (nowMs < closes) return 'open';
  return 'closed';
}

// Тикает раз в секунду, пока enabled — реальный интервал, а не пересчёт на
// каждый чужой ререндер, иначе окно "открылось"/"закрылось" не переключится
// само, пока страница открыта (требование задачи). Чистим таймер при
// размонтировании и при выключении enabled.
function useNow(enabled: boolean, intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs]);
  return now;
}

// Игрок записывается на MIX-турнир сам — вместо капитана, который заявляет
// готовую команду (см. TEAM-ветку в Header). Организатор потом сам собирает
// составы из отметившихся игроков, поэтому здесь нет ни выбора состава, ни
// подтверждения от второй стороны — только своя заявка.
export function MixRegistrationBlock({
  tournament,
}: {
  tournament: TournamentDto;
}) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const myEntryQ = useMyMixEntry(isAuthenticated ? tournament.id : undefined);
  const registerMut = useRegisterForMix();
  const withdrawMut = useWithdrawFromMix();
  const checkInMut = useCheckInForMix();
  const [selected, setSelected] = useState<PlayerPosition[]>([]);

  // Резолвим заявку здесь же, а не только после ранних return'ов ниже —
  // это обычные производные значения (не вызовы хуков), так что правилам
  // хуков это не мешает, а useNow() дальше может опираться на них.
  // Важно: `entry`, а не сырой `myEntryQ.data` — TanStack Query держит
  // последний успешный `data` даже когда запрос перешёл в error (например
  // после отзыва заявки: /me возвращает 404, но `data` ещё хранит старую
  // запись), так что тикер на сыром `data` продолжал бы тикать и после
  // отзыва, пока компонент не размонтируется.
  const notRegistered =
    myEntryQ.isError &&
    myEntryQ.error instanceof ProblemDetailError &&
    myEntryQ.error.status === 404;
  const entry = notRegistered ? null : (myEntryQ.data ?? null);

  const hasCheckInWindow = Boolean(
    tournament.checkInOpensAt && tournament.checkInClosesAt,
  );
  const tickingEnabled = Boolean(entry) && !entry?.checkedIn && hasCheckInWindow;
  const now = useNow(tickingEnabled);
  const checkInPhaseNow = checkInPhase(
    now,
    tournament.checkInOpensAt,
    tournament.checkInClosesAt,
  );

  function toggleRole(pos: PlayerPosition) {
    setSelected((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos],
    );
  }

  function describeError(e: unknown, fallbackTitle: string) {
    if (e instanceof ProblemDetailError) {
      if (e.code === 'PLATFORM_MMR_REQUIRED') {
        return {
          title: 'Укажите MMR в профиле',
          description:
            'Без MMR организатор не сможет сбалансировать составы. Добавьте MMR в профиле и повторите запись.',
        };
      }
      // Текстовая эвристика: бэк не отдаёт отдельный код ошибки для «заявку
      // отклонил модератор» (это тот же PLATFORM_CONFLICT, что и любой
      // другой 409 регистрации), только detail на английском. Хрупко, но
      // альтернативы нет без нового кода на бэке — если локализуете это
      // сообщение бэка, поправьте и проверку здесь.
      if (e.status === 409 && e.detail?.toLowerCase().includes('rejected')) {
        return {
          title: 'Заявку отклонил модератор',
          description:
            'Повторная запись недоступна — обратитесь к организатору турнира.',
        };
      }
      return {
        title: fallbackTitle,
        description: `${e.title}${e.detail ? `: ${e.detail}` : ''}`,
      };
    }
    return {
      title: fallbackTitle,
      description: e instanceof Error ? e.message : 'Неизвестная ошибка',
    };
  }

  async function handleRegister() {
    try {
      await registerMut.mutateAsync({
        tournamentId: tournament.id,
        body: { preferredPositions: selected },
      });
      toast({ title: 'Вы записаны на турнир' });
      setSelected([]);
    } catch (e) {
      const { title, description } = describeError(e, 'Ошибка регистрации');
      toast({ title, description, variant: 'destructive' });
    }
  }

  async function handleWithdraw() {
    try {
      await withdrawMut.mutateAsync({ tournamentId: tournament.id });
      toast({ title: 'Заявка отозвана' });
    } catch (e) {
      const { title, description } = describeError(
        e,
        'Не удалось отозвать заявку',
      );
      toast({ title, description, variant: 'destructive' });
    }
  }

  async function handleCheckIn() {
    try {
      await checkInMut.mutateAsync({ tournamentId: tournament.id });
      toast({ title: 'Вы отметились' });
    } catch (e) {
      const { title, description } = describeError(
        e,
        'Не удалось отметиться',
      );
      toast({ title, description, variant: 'destructive' });
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-md border px-4 py-3 text-sm text-muted-foreground">
        Войдите, чтобы записаться на турнир как игрок.
      </div>
    );
  }

  if (myEntryQ.isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  // notRegistered/entry уже посчитаны выше (нужны были раньше useNow()).
  if (myEntryQ.isError && !notRegistered) {
    return (
      <div className="text-sm text-destructive">
        Не удалось загрузить статус регистрации:{' '}
        {myEntryQ.error?.message ?? 'unknown error'}
      </div>
    );
  }

  if (!entry) {
    if (tournament.status !== 'REGISTRATION_OPEN') {
      return (
        <div className="rounded-md border px-4 py-3 text-sm text-muted-foreground">
          Регистрация недоступна для текущего статуса турнира
        </div>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Запись на турнир</CardTitle>
          <CardDescription>
            Отметьте предпочитаемые роли по приоритету — от самой желанной к
            наименее. Состав турнира соберёт организатор.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PLAYER_POSITIONS.map((pos) => {
              const rank = selected.indexOf(pos);
              const isSelected = rank !== -1;
              return (
                <Button
                  key={pos}
                  type="button"
                  size="sm"
                  variant={isSelected ? 'default' : 'outline'}
                  aria-pressed={isSelected}
                  disabled={registerMut.isPending}
                  onClick={() => toggleRole(pos)}
                >
                  {isSelected && (
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary-foreground/20 text-[0.65rem]">
                      {rank + 1}
                    </span>
                  )}
                  {POSITION_LABEL[pos]}
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Можно ничего не выбирать — тогда подставятся роли из вашего
            профиля, а если и там они не указаны, будет считаться, что
            подходит любая роль.
          </p>
          <Button onClick={handleRegister} disabled={registerMut.isPending}>
            {registerMut.isPending ? 'Записываем…' : 'Записаться'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Вы записаны на турнир</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <span className="text-muted-foreground">Роли:</span>{' '}
          <span className="font-medium">
            {formatPositions(entry.preferredPositions)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">
            MMR на момент записи:
          </span>{' '}
          <span className="font-medium">{entry.mmr ?? '—'}</span>
        </div>

        {entry.checkedIn ? (
          <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-green-700 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-400">
            Вы отметились и готовы к турниру.
          </div>
        ) : checkInPhaseNow === 'before' ? (
          <div className="rounded-md border px-4 py-3 text-sm text-muted-foreground">
            Чек-ин ещё не открылся. Он начнётся{' '}
            {fmtDateTime(tournament.checkInOpensAt)} — возвращайтесь сюда, когда
            откроется, и отметьтесь, что будете играть.
          </div>
        ) : checkInPhaseNow === 'no-window' ? (
          // Своя ветка, а не запасной вариант CTA: бэк требует оба
          // таймстампа окна и без них 409-ит всегда (см. checkInPhase()
          // выше) — предлагать кнопку, которая гарантированно не сработает,
          // хуже, чем не предлагать её вовсе.
          <div className="rounded-md border px-4 py-3 text-sm text-muted-foreground">
            Организатор ещё не назначил окно чек-ина для этого турнира. Как
            только это произойдёт, здесь появится кнопка «Отметиться» — а
            пока отмечаться не нужно.
          </div>
        ) : checkInPhaseNow === 'closed' ? (
          <div className="space-y-1 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400">
            <p className="font-medium">Окно чек-ина закрылось</p>
            <p className="text-xs">
              Чек-ин закрылся {fmtDateTime(tournament.checkInClosesAt)}, а вы не
              отметились — скорее всего, место в составе уже потеряно. Это не
              ошибка страницы: если считаете, что так быть не должно, пишите
              организатору турнира, самостоятельно отметиться больше нельзя.
            </p>
          </div>
        ) : (
          // Единственная оставшаяся ветка — 'open': и только в ней чек-ин
          // действительно может пройти.
          <div className="space-y-2 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-700 dark:border-yellow-500/40 dark:bg-yellow-500/10 dark:text-yellow-400">
            <p className="font-medium">Подтвердите участие в турнире</p>
            <p className="text-xs">
              Отметьтесь, что будете играть — организатор собирает составы
              только из отметившихся игроков.
            </p>
            {tournament.checkInClosesAt && (
              <p className="font-mono text-lg font-semibold tabular-nums">
                Осталось{' '}
                {formatCountdown(
                  new Date(tournament.checkInClosesAt).getTime() - now,
                )}
              </p>
            )}
            <Button
              size="sm"
              onClick={handleCheckIn}
              disabled={checkInMut.isPending}
            >
              {checkInMut.isPending ? 'Отмечаем…' : 'Отметиться'}
            </Button>
          </div>
        )}

        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleWithdraw}
            disabled={withdrawMut.isPending}
          >
            {withdrawMut.isPending ? 'Отзываем…' : 'Отозвать заявку'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Для собственной заявки бэк никогда не скрывает позиции (не то же самое,
// что публичный список — см. MixPlayersList.renderPositions), поэтому null
// здесь не про приватность. Пустой список — это осознанный выбор «любая
// роль», как и в публичном списке.
function formatPositions(
  positions: PlayerPosition[] | null | undefined,
): string {
  if (!positions || positions.length === 0) return 'любая роль';
  return positions.map((p, i) => `${i + 1}. ${POSITION_LABEL[p]}`).join(', ');
}
