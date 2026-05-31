import { Badge } from '@/components/ui/badge';
import type { NicknameHistoryEntryDto } from '@/lib/api/types';

type Entry = NicknameHistoryEntryDto;

type Props = {
  current?: string | null;
  history?: Entry[] | null;
};

function fmt(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Compact display of a player's nickname history: the current nickname plus any
 * previous nicknames with the date each was changed. Renders nothing when there is
 * no recorded history, so it never disrupts the profile layout.
 */
export function NicknameHistory({ current, history }: Props) {
  const entries = (history ?? []).filter((e) => e != null);
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="text-sm">
      <div className="mb-1 text-muted-foreground">Прежние ники</div>
      <div className="flex flex-wrap items-center gap-2">
        {current && (
          <Badge variant="secondary" title="Текущий ник">
            {current}
          </Badge>
        )}
        {entries.map((e, i) => (
          <span
            key={`${e.changedAt}-${i}`}
            className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs text-muted-foreground"
            title={`Изменён ${fmt(e.changedAt)}`}
          >
            <span className="line-through">{e.nickname ?? '—'}</span>
            <span className="opacity-70">{fmt(e.changedAt)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
