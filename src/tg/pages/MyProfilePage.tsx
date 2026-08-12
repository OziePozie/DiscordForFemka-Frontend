import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMe } from '@/lib/api/endpoints';
import { POSITION_LABEL } from '@/lib/api/types';
import { Field, PageTitle } from '../ui/Bits';

export default function MyProfilePage() {
  const me = useQuery({ queryKey: ['tg', 'me'], queryFn: getMe });

  if (me.isLoading) return <PageTitle title="Профиль" subtitle="Загружаем…" />;
  if (me.isError || !me.data) return <PageTitle title="Профиль" subtitle="Не удалось загрузить." />;

  const p = me.data.profile;
  const secondary = (p.secondaryRoles ?? []).map((r) => POSITION_LABEL[r]).join(', ');

  return (
    <div className="py-2">
      <PageTitle title={p.nickname ?? 'Без никнейма'} subtitle="Ваша анкета" />

      <dl className="mt-6 divide-y divide-line border-y border-line">
        <Field label="MMR" value={me.data.mmr?.mmr != null ? String(me.data.mmr.mmr) : '—'} />
        <Field label="Основная позиция" value={p.primaryRole ? POSITION_LABEL[p.primaryRole] : '—'} />
        <Field label="Доп. позиции" value={secondary || '—'} />
        <Field label="Страна" value={p.country ?? '—'} />
        <Field label="Telegram" value={p.telegramUsername ? `@${p.telegramUsername}` : '—'} />
        <Field label="Discord" value={p.discordId ?? '—'} />
        <Field label="Twitch" value={p.twitchLogin ?? '—'} />
      </dl>

      <div className="mt-6 grid gap-3">
        <Link to="/profile/edit" className="ec-btn ec-btn-dark w-full">
          Редактировать
        </Link>
        <Link to="/profile/privacy" className="ec-btn ec-btn-outline w-full">
          Настройки приватности
        </Link>
      </div>

      <p className="mt-6 text-xs text-ink-faint">
        MMR, история и турнирные данные меняет администрация — заявку на смену MMR можно подать на
        сайте.
      </p>
    </div>
  );
}
