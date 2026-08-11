import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPrivacySettings, updatePrivacySettings } from '@/lib/api/endpoints';
import {
  FIELD_VISIBILITY_LABEL,
  PROFILE_FIELD_KEYS,
  PROFILE_FIELD_LABEL,
  type FieldVisibility,
  type ProfileFieldKey,
} from '@/lib/api/types';
import { PageTitle } from '../ui/Bits';

const LEVELS: FieldVisibility[] = ['PUBLIC', 'PLAYERS', 'PRIVATE'];

export default function PrivacyPage() {
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ['tg', 'privacy'], queryFn: getPrivacySettings });

  const save = useMutation({
    mutationFn: (change: Partial<Record<ProfileFieldKey, FieldVisibility>>) =>
      updatePrivacySettings(change),
    onSuccess: (data) => qc.setQueryData(['tg', 'privacy'], data),
  });

  if (settings.isLoading) return <PageTitle title="Приватность" subtitle="Загружаем…" />;
  if (settings.isError) return <PageTitle title="Приватность" subtitle="Не удалось загрузить." />;

  return (
    <div className="py-2">
      <PageTitle
        title="Приватность"
        subtitle="Кто видит поля вашей анкеты. Администрация видит всё."
      />

      <div className="mt-4 divide-y divide-line border-y border-line">
        {PROFILE_FIELD_KEYS.map((key) => {
          const current = settings.data?.[key] ?? 'PUBLIC';
          return (
            <div key={key} className="py-3">
              <p className="text-sm font-medium text-ink">{PROFILE_FIELD_LABEL[key]}</p>
              <div className="mt-2 flex gap-2">
                {LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    disabled={save.isPending}
                    onClick={() => save.mutate({ [key]: level })}
                    className={
                      'flex-1 rounded-pill border px-3 py-2 text-xs font-semibold transition-colors ' +
                      (current === level
                        ? 'border-transparent bg-primary text-primary-foreground'
                        : 'border-line text-ink-muted hover:border-line-strong')
                    }
                  >
                    {FIELD_VISIBILITY_LABEL[level]}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {save.isError && (
        <p className="mt-4 text-sm text-destructive">Не удалось сохранить. Попробуйте ещё раз.</p>
      )}

      <p className="mt-6 text-xs text-ink-faint">
        Никнейм, аватар и состав команд видны всегда — по ним работает поиск и составы турниров.
      </p>
    </div>
  );
}
