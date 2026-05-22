import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  useAdminBots,
  useAdminBotGcRehello,
  useAdminBotLeaveLobby,
  useAdminBotSteamReconnect,
} from '@/lib/queries';
import { ProblemDetailError } from '@/lib/api/client';
import type { BotStatusDto } from '@/lib/api/types';

type Tone = 'good' | 'warn' | 'bad' | 'mute';

function steamTone(state: string): Tone {
  if (state === 'LOGGED_ON') return 'good';
  if (state === 'DISCONNECTED') return 'bad';
  return 'warn';
}

function gcTone(state: string): Tone {
  if (state === 'READY') return 'good';
  if (state === 'NOT_CONNECTED') return 'bad';
  return 'warn';
}

function StateBadge({ label, tone }: { label: string; tone: Tone }) {
  const className =
    tone === 'good'
      ? 'border-transparent bg-emerald-500/15 text-emerald-400'
      : tone === 'warn'
        ? 'border-transparent bg-amber-500/15 text-amber-400'
        : tone === 'bad'
          ? 'border-transparent bg-destructive/15 text-destructive'
          : 'border-transparent bg-muted text-muted-foreground';
  return <Badge className={className}>{label}</Badge>;
}

function describeError(err: unknown): string {
  if (err instanceof ProblemDetailError) {
    return err.detail ?? err.title;
  }
  if (err instanceof Error) return err.message;
  return 'неизвестная ошибка';
}

export default function AdminBotsPage() {
  const { toast } = useToast();
  const q = useAdminBots();
  const leave = useAdminBotLeaveLobby();
  const rehello = useAdminBotGcRehello();
  const reconnect = useAdminBotSteamReconnect();

  function run(
    title: string,
    username: string,
    mutate: (u: string) => Promise<void>,
  ) {
    mutate(username)
      .then(() => toast({ title, description: `Бот ${username}` }))
      .catch((err) =>
        toast({
          title: `${title} не удалось`,
          description: `${username}: ${describeError(err)}`,
          variant: 'destructive',
        }),
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Боты Dota 2</h1>
        <div className="text-sm text-muted-foreground">
          {q.data?.length ?? 0} ботов · обновляется каждые 5 с
        </div>
      </div>

      {q.isLoading && <Skeleton className="h-80 w-full" />}

      {q.isError && (
        <div className="text-sm text-destructive">
          Не удалось загрузить список: {describeError(q.error)}
        </div>
      )}

      {q.data && q.data.length === 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          Ни одного бота не зарегистрировано.
        </div>
      )}

      {q.data && q.data.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Username</th>
                <th className="px-4 py-2 font-medium">Account ID</th>
                <th className="px-4 py-2 font-medium">Steam</th>
                <th className="px-4 py-2 font-medium">GC</th>
                <th className="px-4 py-2 font-medium">Лобби</th>
                <th className="px-4 py-2 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {q.data.map((bot: BotStatusDto) => {
                const busyLeave =
                  leave.isPending && leave.variables === bot.username;
                const busyRehello =
                  rehello.isPending && rehello.variables === bot.username;
                const busyReconnect =
                  reconnect.isPending && reconnect.variables === bot.username;
                return (
                  <tr key={bot.username} className="border-t align-middle">
                    <td className="px-4 py-2 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            bot.healthy
                              ? 'h-2 w-2 rounded-full bg-emerald-500'
                              : 'h-2 w-2 rounded-full bg-destructive'
                          }
                          title={bot.healthy ? 'OK' : 'unhealthy'}
                        />
                        {bot.username}
                      </div>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                      {bot.accountId}
                    </td>
                    <td className="px-4 py-2">
                      <StateBadge
                        label={bot.steamState}
                        tone={steamTone(bot.steamState)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <StateBadge
                        label={bot.gcState}
                        tone={gcTone(bot.gcState)}
                      />
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {bot.inLobby ? (
                        bot.currentLobbyId != null ? (
                          <span>{bot.currentLobbyId}</span>
                        ) : (
                          <span className="text-amber-400">orphan</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyLeave}
                          onClick={() =>
                            run(
                              'Команда «выйти из лобби» отправлена',
                              bot.username,
                              leave.mutateAsync,
                            )
                          }
                          title="Forced leaveLobby + release in pool"
                        >
                          Leave lobby
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyRehello}
                          onClick={() =>
                            run(
                              'GC Hello отправлен',
                              bot.username,
                              rehello.mutateAsync,
                            )
                          }
                          title="Re-send ClientGamesPlayed + GC Hello"
                        >
                          Re-Hello GC
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyReconnect}
                          onClick={() =>
                            run(
                              'Steam reconnect инициирован',
                              bot.username,
                              reconnect.mutateAsync,
                            )
                          }
                          title="Drop Steam transport; reconnect cycle takes over"
                        >
                          Steam reconnect
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
