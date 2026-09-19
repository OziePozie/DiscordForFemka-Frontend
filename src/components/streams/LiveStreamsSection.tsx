import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlayerNameLink } from '@/components/PlayerNameLink';
import type { LiveStreamDto } from '@/lib/api/types';
import { cn } from '@/lib/utils';

type Mode = 'match' | 'season';

interface Props {
  mode: Mode;
  streams: LiveStreamDto[] | undefined;
}

const THUMB_W = 440;
const THUMB_H = 248;

function thumbnailSrc(template: string | null | undefined): string | null {
  if (!template) return null;
  const url = template
    .replace('{width}', String(THUMB_W))
    .replace('{height}', String(THUMB_H));
  const minute = Math.floor(Date.now() / 60_000);
  return `${url}${url.includes('?') ? '&' : '?'}t=${minute}`;
}

function channelUrl(login: string): string {
  return `https://twitch.tv/${encodeURIComponent(login)}`;
}

function playerUrl(login: string): string {
  const parent = encodeURIComponent(window.location.hostname);
  return `https://player.twitch.tv/?channel=${encodeURIComponent(login)}&parent=${parent}&muted=true`;
}

function fmtViewers(n: number): string {
  return n.toLocaleString('ru-RU');
}

function initials(nickname: string): string {
  return nickname.trim().slice(0, 2).toUpperCase() || '?';
}

function matchLine(s: LiveStreamDto): string {
  const teams = `${s.match.teamAName ?? '?'} — ${s.match.teamBName ?? '?'}`;
  return s.match.tournamentName ? `${teams} · ${s.match.tournamentName}` : teams;
}

export function LiveStreamsSection({ mode, streams }: Props) {
  const [activeLogin, setActiveLogin] = useState<string | null>(null);

  if (!streams || streams.length === 0) return null;

  const active = streams.find((s) => s.twitchLogin === activeLogin) ?? null;

  function toggle(login: string) {
    setActiveLogin((cur) => (cur === login ? null : login));
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4 border-b border-line pb-3">
        <div className="flex items-center gap-3">
          <span className="ec-dot animate-pulse bg-live" />
          <h2 className="ec-display text-[1.0625rem] text-ink">Сейчас в эфире</h2>
        </div>
        <span className="ec-num text-[0.8125rem] text-ink-faint">
          {streams.length}
        </span>
      </div>

      {active && (
        <div className="space-y-2">
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-line bg-ink">
            <iframe
              key={active.twitchLogin}
              src={playerUrl(active.twitchLogin)}
              title={`Twitch: ${active.twitchLogin}`}
              allowFullScreen
              className="h-full w-full"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[0.8125rem]">
            <span className="min-w-0 truncate text-ink-muted">
              {active.player.nickname}
              {active.title ? ` · ${active.title}` : ''}
            </span>
            <a
              href={channelUrl(active.twitchLogin)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-brand hover:underline"
            >
              Открыть на Twitch
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {streams.map((s) => (
          <StreamCard
            key={s.twitchLogin}
            stream={s}
            mode={mode}
            active={s.twitchLogin === activeLogin}
            onToggle={() => toggle(s.twitchLogin)}
          />
        ))}
      </div>
    </section>
  );
}

interface CardProps {
  stream: LiveStreamDto;
  mode: Mode;
  active: boolean;
  onToggle: () => void;
}

function StreamCard({ stream: s, mode, active, onToggle }: CardProps) {
  const thumb = thumbnailSrc(s.thumbnailUrl);
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={active}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        'group flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-lg border bg-card text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-brand ring-1 ring-brand'
          : 'border-line hover:border-ink',
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {thumb && (
          <img
            src={thumb}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        )}
        <span className="ec-kicker absolute left-2 top-2 rounded-sm bg-live px-1.5 py-0.5 text-[0.625rem] leading-none text-white [letter-spacing:0.1em]">
          Live
        </span>
        <span className="ec-num absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-sm bg-ink/80 px-1.5 py-0.5 text-[0.6875rem] leading-none text-white">
          <Eye className="h-3 w-3" aria-hidden />
          {fmtViewers(s.viewerCount)}
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-2 p-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className="h-7 w-7">
            {s.player.avatarUrl && (
              <AvatarImage src={s.player.avatarUrl} alt="" />
            )}
            <AvatarFallback className="text-[0.625rem]">
              {initials(s.player.nickname)}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 truncate" onClick={stop} onKeyDown={stop}>
            <PlayerNameLink
              playerId={s.player.id}
              nickname={s.player.nickname}
              className="text-[0.9375rem] font-semibold text-ink"
            />
          </span>
        </div>

        {s.title && (
          <div className="line-clamp-2 text-[0.875rem] leading-snug text-ink">
            {s.title}
          </div>
        )}

        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-ink-muted">
          <span className="ec-num inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" aria-hidden />
            {fmtViewers(s.viewerCount)}
          </span>
          {s.gameName && (
            <>
              <span className="text-line-num">·</span>
              <span className="min-w-0 truncate">{s.gameName}</span>
            </>
          )}
        </div>

        {mode === 'season' && (
          <Link
            to={`/matches/${s.match.id}`}
            onClick={stop}
            onKeyDown={stop}
            className="min-w-0 truncate text-[0.8125rem] text-brand hover:underline"
          >
            {matchLine(s)}
          </Link>
        )}
      </div>
    </div>
  );
}
