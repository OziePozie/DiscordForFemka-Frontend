import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/lib/api/endpoints';

export default function HomePage() {
  const me = useQuery({ queryKey: ['tg', 'me'], queryFn: getMe });

  return (
    <div className="py-4">
      <p className="ec-kicker text-xs text-brand">Play Stage</p>
      <h1 className="ec-display mt-2 text-2xl text-ink">
        {me.data?.profile?.nickname ? `Привет, ${me.data.profile.nickname}` : 'База игроков'}
      </h1>

      <nav className="mt-6 grid gap-3">
        <HomeLink to="/profile" title="Мой профиль" hint="Данные, MMR, позиции" />
        <HomeLink to="/profile/privacy" title="Приватность" hint="Кто что видит в анкете" />
        <HomeLink to="/players" title="Игроки" hint="Поиск и фильтры по базе" />
      </nav>
    </div>
  );
}

function HomeLink({ to, title, hint }: { to: string; title: string; hint: string }) {
  return (
    <Link
      to={to}
      className="rounded-lg border border-line px-4 py-4 transition-colors hover:border-line-strong"
    >
      <span className="block text-base font-semibold text-ink">{title}</span>
      <span className="mt-1 block text-sm text-ink-muted">{hint}</span>
    </Link>
  );
}
