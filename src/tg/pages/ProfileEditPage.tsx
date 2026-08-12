import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, updateMe } from '@/lib/api/endpoints';
import { POSITION_LABEL, type PlayerPosition } from '@/lib/api/types';
import { PageTitle } from '../ui/Bits';

const POSITIONS: PlayerPosition[] = ['POS_1', 'POS_2', 'POS_3', 'POS_4', 'POS_5'];

export default function ProfileEditPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const me = useQuery({ queryKey: ['tg', 'me'], queryFn: getMe });

  const [nickname, setNickname] = useState('');
  const [primaryRole, setPrimaryRole] = useState<PlayerPosition | ''>('');
  const [secondaryRoles, setSecondaryRoles] = useState<PlayerPosition[]>([]);

  // Инициализируем форму один раз, когда профиль приехал.
  useEffect(() => {
    const p = me.data?.profile;
    if (!p) return;
    setNickname(p.nickname ?? '');
    setPrimaryRole(p.primaryRole ?? '');
    setSecondaryRoles(p.secondaryRoles ?? []);
  }, [me.data?.profile]);

  const save = useMutation({
    mutationFn: () =>
      updateMe({
        nickname: nickname.trim() || undefined,
        primaryRole: primaryRole || undefined,
        secondaryRoles,
      }),
    onSuccess: (data) => {
      qc.setQueryData(['tg', 'me'], data);
      navigate('/profile');
    },
  });

  function toggleSecondary(pos: PlayerPosition) {
    setSecondaryRoles((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos],
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  if (me.isLoading) return <PageTitle title="Редактирование" subtitle="Загружаем…" />;

  return (
    <form onSubmit={onSubmit} className="py-2">
      <PageTitle title="Редактирование" subtitle="MMR и турнирные данные меняет администрация." />

      <label htmlFor="nickname" className="mt-6 block text-xs font-semibold uppercase tracking-wider text-ink-faint">
        Никнейм
      </label>
      <input
        id="nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={64}
        className="mt-2 w-full rounded-lg border border-line bg-transparent px-4 py-3 text-ink outline-none focus:border-brand"
      />

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-ink-faint">
        Основная позиция
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            type="button"
            onClick={() => setPrimaryRole(pos === primaryRole ? '' : pos)}
            className={
              'rounded-pill border px-3 py-2 text-xs font-semibold transition-colors ' +
              (primaryRole === pos
                ? 'border-transparent bg-primary text-primary-foreground'
                : 'border-line text-ink-muted hover:border-line-strong')
            }
          >
            {POSITION_LABEL[pos]}
          </button>
        ))}
      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-ink-faint">
        Дополнительные позиции
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            type="button"
            onClick={() => toggleSecondary(pos)}
            className={
              'rounded-pill border px-3 py-2 text-xs font-semibold transition-colors ' +
              (secondaryRoles.includes(pos)
                ? 'border-brand text-brand'
                : 'border-line text-ink-muted hover:border-line-strong')
            }
          >
            {POSITION_LABEL[pos]}
          </button>
        ))}
      </div>

      {save.isError && (
        <p className="mt-4 text-sm text-destructive">Не удалось сохранить. Проверьте поля.</p>
      )}

      <button type="submit" disabled={save.isPending} className="ec-btn ec-btn-dark mt-8 w-full">
        {save.isPending ? 'Сохраняем…' : 'Сохранить'}
      </button>
    </form>
  );
}
