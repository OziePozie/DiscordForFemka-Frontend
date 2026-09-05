import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getPlayer } from '@/lib/api/endpoints';
import { POSITION_LABEL } from '@/lib/api/types';
import { Field, PageTitle } from '../ui/Bits';

export default function PlayerViewPage() {
  const { id = '' } = useParams();
  const player = useQuery({ queryKey: ['tg', 'player', id], queryFn: () => getPlayer(id) });

  if (player.isLoading) return <PageTitle title="Профиль" subtitle="Загружаем…" />;
  if (player.isError || !player.data) {
    return <PageTitle title="Профиль" subtitle="Игрок не найден." />;
  }

  const p = player.data;
  const secondary = (p.secondaryRoles ?? []).map((r) => POSITION_LABEL[r]).join(', ');
  // Скрытые бэкендом поля приходят как null — просто не рисуем их.
  const rows: { label: string; value: string }[] = [];
  if (p.mmr?.mmr != null) rows.push({ label: 'MMR', value: String(p.mmr.mmr) });
  if (p.primaryRole) rows.push({ label: 'Основная позиция', value: POSITION_LABEL[p.primaryRole] });
  if (secondary) rows.push({ label: 'Доп. позиции', value: secondary });
  if (p.country) rows.push({ label: 'Страна', value: p.country });
  if (p.telegramUsername) rows.push({ label: 'Telegram', value: `@${p.telegramUsername}` });
  if (p.twitchLogin) rows.push({ label: 'Twitch', value: p.twitchLogin });
  if (p.discordId) rows.push({ label: 'Discord', value: p.discordId });

  return (
    <div className="py-2">
      <PageTitle
        title={p.nickname ?? 'Без никнейма'}
        subtitle={p.femaleVerified ? 'Профиль подтверждён' : undefined}
      />

      {rows.length > 0 ? (
        <dl className="mt-6 divide-y divide-line border-y border-line">
          {rows.map((r) => (
            <Field key={r.label} label={r.label} value={r.value} />
          ))}
        </dl>
      ) : (
        <p className="mt-6 text-sm text-ink-muted">Игрок скрыл данные профиля.</p>
      )}

      {(p.nicknameHistory?.length ?? 0) > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Прежние никнеймы
          </h2>
          <ul className="mt-2 space-y-1">
            {p.nicknameHistory!.map((h, i) => (
              <li key={`${h.nickname}-${i}`} className="text-sm text-ink-muted">
                {h.nickname ?? '—'}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
