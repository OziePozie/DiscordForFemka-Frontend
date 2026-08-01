import { useMemo, useState } from 'react';
import { HeroIcon } from '@/components/match/HeroIcon';
import { Input } from '@/components/ui/input';
import { useDotaHeroesCatalog } from '@/lib/queries';
import { cn } from '@/lib/utils';

interface Props {
  selected: number[];
  onChange: (heroIds: number[]) => void;
  disabled?: boolean;
}

/**
 * Grid of hero tiles, click-to-toggle selection, with a name filter. No shadcn
 * Command/Popover in this repo yet — hand-rolled to match the codebase's low-tooling
 * bias (see `broadcasterAccountIds` CSV-input precedent in AdminTournamentsPage).
 */
export function HeroMultiPicker({ selected, onChange, disabled }: Props) {
  const heroesQ = useDotaHeroesCatalog();
  const [filter, setFilter] = useState('');

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const filtered = useMemo(() => {
    const all = heroesQ.data ?? [];
    const f = filter.trim().toLowerCase();
    if (!f) return all;
    return all.filter((h) => h.name.toLowerCase().includes(f));
  }, [heroesQ.data, filter]);

  function toggle(heroId: number) {
    if (disabled) return;
    if (selectedSet.has(heroId)) {
      onChange(selected.filter((id) => id !== heroId));
    } else {
      onChange([...selected, heroId]);
    }
  }

  return (
    <div className="space-y-2">
      <Input
        placeholder="Поиск героя…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        disabled={disabled}
      />
      {heroesQ.isLoading && (
        <div className="text-sm text-muted-foreground">Загрузка героев…</div>
      )}
      {heroesQ.isError && (
        <div className="text-sm text-destructive">
          Не удалось загрузить справочник героев.
        </div>
      )}
      {heroesQ.data && (
        <div className="grid max-h-64 grid-cols-6 gap-2 overflow-y-auto rounded-md border p-2 sm:grid-cols-8">
          {filtered.map((hero) => {
            const isSelected = selectedSet.has(hero.id);
            return (
              <button
                key={hero.id}
                type="button"
                onClick={() => toggle(hero.id)}
                disabled={disabled}
                title={hero.name}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-md border p-1 text-center transition-colors',
                  isSelected
                    ? 'border-primary bg-accent'
                    : 'border-transparent hover:bg-accent/50',
                  disabled && 'cursor-not-allowed opacity-50',
                )}
              >
                <HeroIcon heroId={hero.id} size={40} />
                <span className="line-clamp-1 text-[10px] text-muted-foreground">
                  {hero.name}
                </span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full py-4 text-center text-sm text-muted-foreground">
              Ничего не найдено
            </div>
          )}
        </div>
      )}
      <div className="text-xs text-muted-foreground">
        Выбрано героев: {selected.length}
      </div>
    </div>
  );
}
