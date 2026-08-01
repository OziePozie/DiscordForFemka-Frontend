import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useHeroGroupsList } from '@/lib/queries';
import {
  CONDITION_TYPE_LABEL,
  type ConditionRowDto,
  type ConditionType,
} from '@/lib/api/types';

interface Props {
  conditions: ConditionRowDto[];
  onChange: (conditions: ConditionRowDto[]) => void;
  disabled?: boolean;
}

const CONDITION_TYPES: ConditionType[] = ['HERO_POOL', 'WIN_REQUIRED'];

function emptyParamsFor(type: ConditionType): Pick<ConditionRowDto, 'heroGroupId' | 'minPlayers'> {
  if (type === 'HERO_POOL') return { heroGroupId: null, minPlayers: 5 };
  return { heroGroupId: null, minPlayers: null };
}

/**
 * Shared between the Achievement and Quest builders. One row per condition, all
 * ANDed together on the backend. Adding a new ConditionType later means adding one
 * more entry to CONDITION_TYPES + one more param-form branch below — nothing else
 * in this component's structure changes.
 */
export function ConditionBuilder({ conditions, onChange, disabled }: Props) {
  // Small, bounded list (hero groups are admin-authored) — no pagination needed here.
  const heroGroupsQ = useHeroGroupsList({ size: 100 });
  const heroGroups = heroGroupsQ.data?.items ?? [];

  function updateRow(index: number, row: ConditionRowDto) {
    const next = [...conditions];
    next[index] = row;
    onChange(next);
  }

  function removeRow(index: number) {
    onChange(conditions.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...conditions, { type: 'HERO_POOL', ...emptyParamsFor('HERO_POOL') }]);
  }

  return (
    <div className="space-y-3">
      {conditions.map((row, i) => (
        <div key={i} className="space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between gap-2">
            <Select
              value={row.type}
              onValueChange={(v) =>
                updateRow(i, { type: v as ConditionType, ...emptyParamsFor(v as ConditionType) })
              }
              disabled={disabled}
            >
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {CONDITION_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeRow(i)}
              disabled={disabled}
            >
              Удалить
            </Button>
          </div>

          {row.type === 'HERO_POOL' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Группа героев</label>
                <Select
                  value={row.heroGroupId ?? undefined}
                  onValueChange={(v) => updateRow(i, { ...row, heroGroupId: v })}
                  disabled={disabled || heroGroupsQ.isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите группу" />
                  </SelectTrigger>
                  <SelectContent>
                    {heroGroups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name} ({g.heroIds.length})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Мин. игроков команды (из 5)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={row.minPlayers ?? ''}
                  onChange={(e) =>
                    updateRow(i, { ...row, minPlayers: Number(e.target.value) || null })
                  }
                  disabled={disabled}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <Button size="sm" variant="outline" onClick={addRow} disabled={disabled}>
        + Добавить условие
      </Button>

      {conditions.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Условий пока нет. Опубликовать без условий нельзя.
        </p>
      )}
    </div>
  );
}
