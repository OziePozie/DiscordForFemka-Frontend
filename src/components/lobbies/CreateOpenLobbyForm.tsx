import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateOpenLobby } from '@/lib/queries';
import {
  MATCH_FORMAT_LABEL,
  OPEN_LOBBY_MODE_LABEL,
  type CreateOpenLobbyRequest,
  type MatchFormat,
  type OpenLobbyMode,
} from '@/lib/api/types';
import { ProblemDetailError } from '@/lib/api/client';
import { formatDateTimeLocal, parseLocalDateTime } from '@/lib/utils';

interface Props {
  onCreated: (id: string) => void;
  onCancel: () => void;
}

const FORMATS: MatchFormat[] = ['BO1', 'BO3', 'BO5'];
const MODES: OpenLobbyMode[] = ['SIMPLIFIED', 'WITH_ROLES'];

export function CreateOpenLobbyForm({ onCreated, onCancel }: Props) {
  const [mode, setMode] = useState<OpenLobbyMode>('SIMPLIFIED');
  const [format, setFormat] = useState<MatchFormat>('BO3');
  const [region, setRegion] = useState('EU');
  const [mmrMin, setMmrMin] = useState('');
  const [mmrMax, setMmrMax] = useState('');
  const [startsAt, setStartsAt] = useState(formatDateTimeLocal(new Date(Date.now() + 60 * 60_000).toISOString()));
  const [description, setDescription] = useState('');
  const [creatorSlotIndex, setCreatorSlotIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mutation = useCreateOpenLobby();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const body: CreateOpenLobbyRequest = {
        mode,
        format,
        region: region.trim() || undefined,
        avgMmrMin: mmrMin ? Number(mmrMin) : undefined,
        avgMmrMax: mmrMax ? Number(mmrMax) : undefined,
        startsAt: parseLocalDateTime(startsAt) ?? new Date().toISOString(),
        description: description.trim() || undefined,
        creatorSlotIndex: mode === 'WITH_ROLES' ? creatorSlotIndex : undefined,
      };
      const created = await mutation.mutateAsync(body);
      onCreated(created.id);
    } catch (e) {
      if (e instanceof ProblemDetailError) {
        setError(e.detail ?? e.code ?? 'Не удалось создать лобби');
      } else {
        setError('Не удалось создать лобби');
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Режим</Label>
        <div className="flex gap-2">
          {MODES.map((m) => (
            <Button
              key={m}
              type="button"
              variant={m === mode ? 'default' : 'outline'}
              onClick={() => setMode(m)}
            >
              {OPEN_LOBBY_MODE_LABEL[m]}
            </Button>
          ))}
        </div>
      </div>

      {mode === 'WITH_ROLES' && (
        <div>
          <Label>Ваш слот (0..4 — Radiant 1..5, 5..9 — Dire 1..5)</Label>
          <Input
            type="number"
            min={0}
            max={9}
            value={creatorSlotIndex}
            onChange={(e) => setCreatorSlotIndex(Number(e.target.value))}
          />
        </div>
      )}

      <div>
        <Label>Формат</Label>
        <div className="flex gap-2">
          {FORMATS.map((f) => (
            <Button
              key={f}
              type="button"
              variant={f === format ? 'default' : 'outline'}
              onClick={() => setFormat(f)}
            >
              {MATCH_FORMAT_LABEL[f]}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label>Регион</Label>
        <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="EU" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>MMR от</Label>
          <Input type="number" value={mmrMin} onChange={(e) => setMmrMin(e.target.value)} />
        </div>
        <div>
          <Label>MMR до</Label>
          <Input type="number" value={mmrMax} onChange={(e) => setMmrMax(e.target.value)} />
        </div>
      </div>

      <div>
        <Label>Время</Label>
        <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
      </div>

      <div>
        <Label>Описание</Label>
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Отмена</Button>
        <Button type="submit" disabled={mutation.isPending}>Создать лобби</Button>
      </div>
    </form>
  );
}
