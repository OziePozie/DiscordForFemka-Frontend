import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { OpenLobbyDto } from '@/lib/api/types';

interface Props {
  lobby: OpenLobbyDto;
  currentPlayerId?: string;
  onOpen: () => void;
  onJoin: () => void;
  onLeave: () => void;
  onCancel: () => void;
}

export function OpenLobbyCard({ lobby, currentPlayerId, onOpen, onJoin, onLeave, onCancel }: Props) {
  const isCreator = currentPlayerId === lobby.creatorPlayerId;
  const mine = lobby.slots.some((s) => s.playerId === currentPlayerId);
  const fillPct = (lobby.slotsFilled / lobby.slotsTotal) * 100;
  const firstFreeSlot = lobby.slots.find((s) => !s.playerId)?.slotIndex;

  return (
    <div className="border rounded p-4 flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="font-medium">{lobby.creatorNickname ?? 'Игрок'}</div>
          <Badge variant="outline">{lobby.region ?? '—'}</Badge>
          <Badge variant="outline">{lobby.format}</Badge>
          {lobby.avgMmrMin && lobby.avgMmrMax && (
            <Badge variant="outline">{lobby.avgMmrMin}–{lobby.avgMmrMax} MMR</Badge>
          )}
        </div>
        <div className="text-sm text-gray-500">{new Date(lobby.startsAt).toLocaleString()}</div>
        <div className="mt-2 h-2 bg-gray-200 rounded overflow-hidden">
          <div className="h-full bg-blue-500" style={{ width: `${fillPct}%` }} />
        </div>
        <div className="text-xs mt-1">{lobby.slotsFilled} / {lobby.slotsTotal}</div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onOpen}>Открыть</Button>
        {!isCreator && !mine && firstFreeSlot !== undefined && (
          <Button onClick={onJoin}>Присоединиться</Button>
        )}
        {!isCreator && mine && <Button variant="outline" onClick={onLeave}>Выйти</Button>}
        {isCreator && <Button variant="destructive" onClick={onCancel}>Отменить</Button>}
      </div>
    </div>
  );
}
