import type { ReactNode } from 'react';
import { HeroIcon } from './HeroIcon';
import { ItemIcon } from './ItemIcon';
import { PlayerNameLink } from '@/components/PlayerNameLink';
import { formatGameTime, heroName } from '@/lib/dota/format';
import { teamName } from '@/lib/format';
import type {
  MatchBanDto,
  MatchDto,
  MatchPlayerStatDto,
  MatchResultDto,
} from '@/lib/api/types';

interface Props {
  match: MatchDto;
  result: MatchResultDto;
  meId?: string;
}

/**
 * Общий шаблон колонок для шапки и всех строк ОБЕИХ команд — единая
 * grid-раскладка чинит расползание таблицы из-за длинных ников (колонка
 * игрока фиксирована, ник обрезается по ellipsis).
 *
 * герой · игрок · LVL · K/D/A · LH/DN · GPM · XPM · NW · HD · TD · HH · items
 */
const GRID_COLS =
  'grid grid-cols-[46px_140px_40px_64px_56px_50px_50px_66px_66px_54px_44px_1fr] [column-gap:8px] items-center';

export function ResultStatsCard({ match, result, meId }: Props) {
  const radiantWon = result.winnerTeamId === match.teamA?.id;
  const winnerName = radiantWon ? teamName(match.teamA) : teamName(match.teamB);
  const mvpId = result.mvpSteamAccountId ?? null;

  const bans = result.bans ?? [];
  const radiantBans = bans
    .filter((b) => b.team === 'RADIANT')
    .sort((a, b) => a.order - b.order);
  const direBans = bans
    .filter((b) => b.team === 'DIRE')
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-8">
      {/* Итог игры — без карточки, без 🏆 */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="ec-kicker text-[0.6875rem] text-ink-faint [letter-spacing:0.1em]">
            Победитель
          </div>
          <div className="ec-display mt-1 text-[1.375rem] text-success">
            {winnerName}
          </div>
        </div>
        <div className="text-right">
          <div className="ec-num flex items-baseline justify-end gap-2 text-[1.75rem] text-ink">
            <span className={radiantWon ? 'text-ink' : 'text-ink-disabled'}>
              {result.radiantScore}
            </span>
            <span className="text-line-num">—</span>
            <span className={!radiantWon ? 'text-ink' : 'text-ink-disabled'}>
              {result.direScore}
            </span>
          </div>
          <div className="ec-num mt-1 text-[0.75rem] text-ink-faint">
            Длительность {formatGameTime(result.durationSec)}
          </div>
        </div>
      </div>

      {bans.length > 0 && (
        <div className="border-b border-line pb-5">
          <div className="ec-kicker mb-3 text-[0.6875rem] text-ink-faint [letter-spacing:0.1em]">
            Баны
          </div>
          <div className="space-y-2">
            <BanRow sideLabel="Radiant" bans={radiantBans} won={radiantWon} />
            <BanRow sideLabel="Dire" bans={direBans} won={!radiantWon} />
          </div>
        </div>
      )}

      <ResultSide
        teamName={teamName(match.teamA)}
        sideLabel="Radiant"
        rows={result.radiant}
        won={radiantWon}
        meId={meId}
        mvpId={mvpId}
      />
      <ResultSide
        teamName={teamName(match.teamB)}
        sideLabel="Dire"
        rows={result.dire}
        won={!radiantWon}
        meId={meId}
        mvpId={mvpId}
      />
    </div>
  );
}

function ResultSide({
  teamName,
  sideLabel,
  rows,
  won,
  meId,
  mvpId,
}: {
  teamName: string;
  sideLabel: string;
  rows: MatchPlayerStatDto[];
  won: boolean;
  meId?: string;
  mvpId: number | null;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <h3 className="ec-display text-[1.0625rem] text-ink">{teamName}</h3>
        <span
          className={`ec-kicker text-[0.75rem] [letter-spacing:0.1em] ${
            won ? 'text-success' : 'text-live'
          }`}
        >
          {sideLabel.toUpperCase()}
          {won ? ' · WIN' : ''}
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Шапка */}
          <div
            className={`${GRID_COLS} ec-kicker border-b-[1.5px] border-ink pb-2 text-[0.6875rem] text-ink-faint [letter-spacing:0.1em]`}
          >
            <span />
            <span>Игрок</span>
            <span className="text-right">LVL</span>
            <span className="text-right">K/D/A</span>
            <span className="text-right">LH/DN</span>
            <span className="text-right">GPM</span>
            <span className="text-right">XPM</span>
            <span className="text-right">NW</span>
            <span className="text-right">HD</span>
            <span className="text-right">TD</span>
            <span className="text-right">HH</span>
            <span>Предметы</span>
          </div>

          {rows.map((r) => {
            const isMe = !!meId && r.playerId === meId;
            const isMvp = mvpId != null && r.steamAccountId === mvpId;
            return (
              <div
                key={r.steamAccountId}
                className={`${GRID_COLS} border-b border-line py-[9px]`}
              >
                {/* Герой 42×24 */}
                <span title={heroName(r.heroId)} className="inline-flex">
                  <HeroIcon
                    heroId={r.heroId}
                    width={42}
                    height={24}
                    className="!rounded-[4px]"
                  />
                </span>
                {/* Игрок — фикс 140px, ellipsis */}
                <div
                  className="flex min-w-0 items-center gap-1"
                  title={r.playerName ?? `#${r.steamAccountId}`}
                >
                  <PlayerNameLink
                    playerId={r.playerId}
                    nickname={r.playerName ?? `#${r.steamAccountId}`}
                    className={`min-w-0 flex-1 truncate font-semibold ${
                      isMe ? 'text-brand' : 'text-ink'
                    }`}
                  />
                  {isMvp && (
                    <span
                      className="shrink-0 text-brand"
                      aria-label="MVP"
                    >
                      ★
                    </span>
                  )}
                </div>
                <Num className="text-ink font-semibold">{r.level}</Num>
                <Num className="text-ink font-semibold">
                  {r.kills}/{r.deaths}/{r.assists}
                </Num>
                <Num>
                  {r.lastHits}/{r.denies}
                </Num>
                <Num>{r.gpm}</Num>
                <Num>{r.xpm}</Num>
                <Num className="text-brand font-bold">
                  {r.netWorth.toLocaleString('ru-RU')}
                </Num>
                <Num>{r.heroDamage.toLocaleString('ru-RU')}</Num>
                <Num>{r.towerDamage.toLocaleString('ru-RU')}</Num>
                <Num>{r.heroHealing.toLocaleString('ru-RU')}</Num>
                {/* Предметы 26×19, gap 3px */}
                <div className="flex flex-wrap gap-[3px]">
                  {r.items.slice(0, 6).map((id, i) => (
                    <ItemIcon key={`inv-${i}`} itemId={id} size={26} />
                  ))}
                </div>
              </div>
            );
          })}

          {rows.length === 0 && (
            <div className="py-3 text-center text-sm text-ink-muted">
              Нет данных
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BanRow({
  sideLabel,
  bans,
  won,
}: {
  sideLabel: string;
  bans: MatchBanDto[];
  won: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`ec-kicker w-16 shrink-0 text-[0.6875rem] [letter-spacing:0.1em] ${
          won ? 'text-success' : 'text-live'
        }`}
      >
        {sideLabel.toUpperCase()}
      </span>
      {bans.length > 0 ? (
        <div className="flex flex-wrap gap-[3px]">
          {bans.map((b) => (
            <span
              key={`${b.team}-${b.order}`}
              title={heroName(b.heroId)}
              className="inline-flex"
            >
              <HeroIcon
                heroId={b.heroId}
                width={42}
                height={24}
                className="!rounded-[4px] opacity-70 grayscale"
              />
            </span>
          ))}
        </div>
      ) : (
        <span className="text-ink-faint">—</span>
      )}
    </div>
  );
}

function Num({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`ec-num text-right text-[0.78125rem] ${className ?? 'text-ink-muted'}`}
    >
      {children}
    </span>
  );
}
