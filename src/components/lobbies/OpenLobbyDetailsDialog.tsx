import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  useConfirmOpenLobby,
  useJoinOpenLobbySlot,
  useLeaveOpenLobby,
  useOpenLobby,
  useStartOpenLobby,
} from '@/lib/queries';
import { OPEN_LOBBY_STATUS_LABEL } from '@/lib/api/types';

interface Props {
  open: boolean;
  lobbyId: string | undefined;
  onOpenChange: (v: boolean) => void;
  currentPlayerId?: string;
}

function roleLabel(slotIndex: number): string {
  const team = slotIndex < 5 ? 'Radiant' : 'Dire';
  const pos = (slotIndex % 5) + 1;
  return `${team} #${pos}`;
}

function countdown(toIso?: string | null): string {
  if (!toIso) return '';
  const ms = new Date(toIso).getTime() - Date.now();
  if (ms < 0) return 'просрочено';
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function OpenLobbyDetailsDialog({ open, lobbyId, onOpenChange, currentPlayerId }: Props) {
  const query = useOpenLobby(open ? lobbyId : undefined);
  const joinMut = useJoinOpenLobbySlot();
  const leaveMut = useLeaveOpenLobby();
  const confirmMut = useConfirmOpenLobby();
  const startMut = useStartOpenLobby();

  const lobby = query.data;
  const isCreator = lobby?.creatorPlayerId === currentPlayerId;
  const mine = lobby?.slots.some((s) => s.playerId === currentPlayerId) ?? false;

  const remaining = useMemo(
    () => countdown(lobby?.confirmationExpiresAt),
    [lobby?.confirmationExpiresAt],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Открытое лобби {lobby ? `(${OPEN_LOBBY_STATUS_LABEL[lobby.status]})` : ''}
          </DialogTitle>
        </DialogHeader>

        {!lobby && <div>Загрузка…</div>}

        {lobby && (
          <div className="space-y-4">
            {lobby.mode === 'SIMPLIFIED' ? (
              <div className="grid grid-cols-2 gap-2">
                {lobby.slots.map((slot) => (
                  <div key={slot.slotIndex} className="border rounded p-2 flex justify-between items-center">
                    <span>{slot.playerNickname ?? '— свободно —'}</span>
                    {!slot.playerId && !isCreator && !mine && (
                      <Button size="sm" onClick={() => joinMut.mutate({ id: lobby.id, slotIndex: slot.slotIndex })}>
                        Занять
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-medium mb-2">Radiant</div>
                  {lobby.slots.slice(0, 5).map((slot) => (
                    <div key={slot.slotIndex} className="border rounded p-2 flex justify-between mb-1">
                      <span>{roleLabel(slot.slotIndex)}: {slot.playerNickname ?? '— свободно —'}</span>
                      {!slot.playerId && !isCreator && !mine && (
                        <Button size="sm" onClick={() => joinMut.mutate({ id: lobby.id, slotIndex: slot.slotIndex })}>
                          Занять
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="font-medium mb-2">Dire</div>
                  {lobby.slots.slice(5, 10).map((slot) => (
                    <div key={slot.slotIndex} className="border rounded p-2 flex justify-between mb-1">
                      <span>{roleLabel(slot.slotIndex)}: {slot.playerNickname ?? '— свободно —'}</span>
                      {!slot.playerId && !isCreator && !mine && (
                        <Button size="sm" onClick={() => joinMut.mutate({ id: lobby.id, slotIndex: slot.slotIndex })}>
                          Занять
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isCreator && mine && lobby.status !== 'LAUNCHED' && lobby.status !== 'IN_PROGRESS' && (
              <Button variant="outline" onClick={() => leaveMut.mutate(lobby.id)}>Выйти из слота</Button>
            )}

            {isCreator && lobby.status === 'READY' && (
              <div className="space-y-2">
                <div className="text-sm">Лобби заполнено. Подтвердите создание: <span className="font-mono">{remaining}</span></div>
                <Button onClick={() => confirmMut.mutate(lobby.id)} disabled={confirmMut.isPending}>
                  Создать Dota-лобби
                </Button>
              </div>
            )}

            {isCreator && lobby.status === 'LAUNCHED' && lobby.dotaLobbyId && (
              <div className="space-y-2">
                <div className="text-sm">Dota-лобби: <span className="font-mono">{lobby.dotaLobbyId}</span></div>
                <Button onClick={() => startMut.mutate(lobby.id)} disabled={startMut.isPending}>
                  Запустить игру
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
