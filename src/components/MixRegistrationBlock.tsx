import { useState } from 'react';
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

  const notRegistered =
    myEntryQ.isError &&
    myEntryQ.error instanceof ProblemDetailError &&
    myEntryQ.error.status === 404;

  if (myEntryQ.isError && !notRegistered) {
    return (
      <div className="text-sm text-destructive">
        Не удалось загрузить статус регистрации:{' '}
        {myEntryQ.error?.message ?? 'unknown error'}
      </div>
    );
  }

  const entry = notRegistered ? null : (myEntryQ.data ?? null);

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
          <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-green-900">
            Вы отметились и готовы к турниру.
          </div>
        ) : (
          <div className="space-y-2 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-900">
            <p className="font-medium">Подтвердите участие в турнире</p>
            <p className="text-xs">
              Отметьтесь, что будете играть — организатор собирает составы
              только из отметившихся игроков. Открытие и закрытие чек-ина
              объявит организатор.
            </p>
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
