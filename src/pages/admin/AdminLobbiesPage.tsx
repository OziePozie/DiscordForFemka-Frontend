import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { HeroIcon } from '@/components/match/HeroIcon';
import { PlayerNameLink } from '@/components/PlayerNameLink';
import { ProblemDetailError } from '@/lib/api/client';
import type { AdminLobbyDto, AdminLobbyMemberDto } from '@/lib/api/types';
import { useAdminKickLobbyPlayer, useAdminLobbies } from '@/lib/queries';

const LOBBY_STATE_LABEL: Record<number, string> = {
  0: 'UI',
  1: 'SERVERSETUP',
  2: 'RUN',
  3: 'POSTGAME',
  4: 'READYUP',
  5: 'NOTREADY',
  6: 'SERVERASSIGN',
};

// Radiant/Dire columns + a catch-all "Прочие" for every other team value
// (PLAYER_POOL/BROADCASTER/SPECTATOR/NOTEAM or anything the GC adds later), so no
// member can silently disappear from the display.
function groupMembers(members: AdminLobbyMemberDto[]) {
  const bySlot = (a: AdminLobbyMemberDto, b: AdminLobbyMemberDto) => a.slot - b.slot;
  return [
    { key: 'radiant', label: 'Radiant', members: members.filter((m) => m.team === 'RADIANT').sort(bySlot) },
    { key: 'dire', label: 'Dire', members: members.filter((m) => m.team === 'DIRE').sort(bySlot) },
    {
      key: 'other',
      label: 'Прочие',
      members: members.filter((m) => m.team !== 'RADIANT' && m.team !== 'DIRE').sort(bySlot),
    },
  ];
}

function describeError(err: unknown): string {
  if (err instanceof ProblemDetailError) {
    return err.detail ?? err.title;
  }
  if (err instanceof Error) return err.message;
  return 'неизвестная ошибка';
}

type KickTarget = { lobbyId: string; accountId: number; label: string };

export default function AdminLobbiesPage() {
  const { toast } = useToast();
  const q = useAdminLobbies();
  const kick = useAdminKickLobbyPlayer();
  const [target, setTarget] = useState<KickTarget | null>(null);

  async function confirmKick() {
    if (!target) return;
    try {
      await kick.mutateAsync({ lobbyId: target.lobbyId, accountId: target.accountId });
      toast({ title: 'Игрок кикнут', description: target.label });
      setTarget(null);
    } catch (err) {
      toast({
        title: 'Не удалось кикнуть',
        description: `${target.label}: ${describeError(err)}`,
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Лобби Dota 2</h1>
        <div className="text-sm text-muted-foreground">
          {q.data?.length ?? 0} активных · обновляется каждые 5 с
        </div>
      </div>

      {q.isLoading && <Skeleton className="h-64 w-full" />}

      {q.isError && (
        <div className="text-sm text-destructive">
          Не удалось загрузить список: {describeError(q.error)}
        </div>
      )}

      {q.data && q.data.length === 0 && (
        <div className="rounded-md border px-4 py-12 text-center text-sm text-muted-foreground">
          Нет активных лобби.
        </div>
      )}

      {q.data?.map((lobby) => (
        <LobbyCard
          key={lobby.lobbyId}
          lobby={lobby}
          pendingAccountId={
            kick.isPending && kick.variables?.lobbyId === lobby.lobbyId
              ? kick.variables?.accountId
              : undefined
          }
          onKick={(m) =>
            setTarget({
              lobbyId: lobby.lobbyId,
              accountId: m.accountId,
              label: m.nickname ?? String(m.accountId),
            })
          }
        />
      ))}

      <Dialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Кикнуть игрока?</DialogTitle>
            <DialogDescription>
              {target
                ? `${target.label} будет полностью удалён из лобби ${target.lobbyId}.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTarget(null)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={confirmKick} disabled={kick.isPending}>
              {kick.isPending ? 'Кик…' : 'Кикнуть'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LobbyCard({
  lobby,
  onKick,
  pendingAccountId,
}: {
  lobby: AdminLobbyDto;
  onKick: (m: AdminLobbyMemberDto) => void;
  pendingAccountId?: number;
}) {
  return (
    <div className="rounded-md border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {lobby.gameName || `Лобби ${lobby.lobbyId}`}
          </span>
          <Badge variant="secondary">
            {LOBBY_STATE_LABEL[lobby.state] ?? `state ${lobby.state}`}
          </Badge>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          bot {lobby.botUsername} · {lobby.memberCount} чел · id {lobby.lobbyId}
        </div>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-3">
        {groupMembers(lobby.members).map((group) => (
          <div key={group.key}>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label} ({group.members.length})
            </div>
            <div className="space-y-1">
              {group.members.length === 0 && (
                <div className="text-xs text-muted-foreground">—</div>
              )}
              {group.members.map((m) => (
                <MemberRow
                  key={m.accountId}
                  m={m}
                  pending={pendingAccountId === m.accountId}
                  onKick={() => onKick(m)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MemberRow({
  m,
  onKick,
  pending,
}: {
  m: AdminLobbyMemberDto;
  onKick: () => void;
  pending: boolean;
}) {
  const initials = (m.nickname ?? String(m.accountId)).slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <HeroIcon heroId={m.heroId} size={24} />
      <Avatar className="h-6 w-6">
        <AvatarImage src={m.avatarUrl ?? undefined} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 truncate text-sm">
        {m.playerId ? (
          <PlayerNameLink playerId={m.playerId} nickname={m.nickname} />
        ) : (
          <span className="font-mono text-xs text-muted-foreground">{m.accountId}</span>
        )}
      </div>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={onKick}
        title="Полный кик из лобби"
      >
        {pending ? '…' : 'Kick'}
      </Button>
    </div>
  );
}
