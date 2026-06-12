import React from 'react';
import type { TournamentData, Round } from './bracketTypes';
import MatchCard from './MatchCard';
import styles from './TournamentCanvas.module.css';

interface Props {
  tournament: TournamentData;
}

const CARD_H   = 83;
const CARD_W   = 210;
const COL_GAP  = 44;
const COL_W    = CARD_W + COL_GAP;
const SLOT_H   = 100;
const HEADER_H = 36;
const GAP      = 120;
const LINE_CLR = '#2d3252';
const LINE_W   = 1.5;

function computePos(rounds: Round[], canvasH: number): number[][] {
  if (!rounds.length) return [];
  const slot = canvasH / rounds[0].matches.length;
  const r0   = rounds[0].matches.map((_, i) => i * slot + slot / 2);
  const all: number[][] = [r0];

  for (let r = 1; r < rounds.length; r++) {
    const prev    = all[r - 1];
    const currLen = rounds[r].matches.length;
    const prevLen = rounds[r - 1].matches.length;

    if (currLen === prevLen) {
      all.push([...prev]);
    } else {
      const curr: number[] = [];
      for (let i = 0; i < currLen; i++) {
        const a = prev[i * 2]     ?? prev[prev.length - 1];
        const b = prev[i * 2 + 1] ?? prev[prev.length - 1];
        curr.push((a + b) / 2);
      }
      all.push(curr);
    }
  }
  return all;
}

function buildConnectors(
  rounds: Round[],
  pos: number[][],
  yOff: number,
  prefix: string,
): React.ReactNode[] {
  const els: React.ReactNode[] = [];

  for (let r = 1; r < rounds.length; r++) {
    const currLen = rounds[r].matches.length;
    const srcX = (r - 1) * COL_W + CARD_W;
    const dstX = r * COL_W;
    const midX = srcX + COL_GAP / 2;

    if (currLen === rounds[r - 1].matches.length) {
      for (let mi = 0; mi < currLen; mi++) {
        const sy = pos[r - 1][mi] + yOff;
        const dy = pos[r][mi]     + yOff;
        const pts = sy === dy
          ? `${srcX},${sy} ${dstX},${dy}`
          : `${srcX},${sy} ${midX},${sy} ${midX},${dy} ${dstX},${dy}`;
        els.push(
          <polyline key={`${prefix}-${r}-${mi}`} points={pts}
            fill="none" stroke={LINE_CLR} strokeWidth={LINE_W} />,
        );
      }
    } else {
      for (let mi = 0; mi < currLen; mi++) {
        const sy1 = pos[r - 1][mi * 2]     + yOff;
        const sy2 = pos[r - 1][mi * 2 + 1] + yOff;
        const dy  = pos[r][mi]              + yOff;
        els.push(
          <g key={`${prefix}-${r}-${mi}`}>
            <line x1={srcX} y1={sy1} x2={midX} y2={sy1} stroke={LINE_CLR} strokeWidth={LINE_W} />
            <line x1={srcX} y1={sy2} x2={midX} y2={sy2} stroke={LINE_CLR} strokeWidth={LINE_W} />
            <line x1={midX} y1={sy1} x2={midX} y2={sy2} stroke={LINE_CLR} strokeWidth={LINE_W} />
            <line x1={midX} y1={dy}  x2={dstX} y2={dy}  stroke={LINE_CLR} strokeWidth={LINE_W} />
          </g>,
        );
      }
    }
  }
  return els;
}

export default function TournamentCanvas({ tournament }: Props) {
  const { upperBracket, lowerBracket, grandFinal } = tournament;
  const ubRounds = upperBracket.rounds;
  const lbRounds = lowerBracket.rounds;

  const ubH = (ubRounds[0]?.matches.length ?? 4) * SLOT_H;
  const lbH = ubH;

  const ubPos = computePos(ubRounds, ubH);
  const lbPos = computePos(lbRounds, lbH);

  const ubYStart = HEADER_H;
  const lbYStart = HEADER_H + ubH + GAP + HEADER_H;
  const totalH   = lbYStart + lbH;

  const ubFinalY  = ubYStart + (ubPos[ubRounds.length - 1]?.[0] ?? ubH / 2);
  const lbFinalY  = lbYStart + (lbPos[lbRounds.length - 1]?.[0] ?? lbH / 2);
  const gfCenterY = (ubFinalY + lbFinalY) / 2;

  const maxRounds      = Math.max(ubRounds.length, lbRounds.length);
  const gfX            = maxRounds * COL_W;
  const gfMidX         = gfX - COL_GAP / 2;
  const gfCardTop      = gfCenterY - CARD_H / 2;
  const ubFinalRightX  = (ubRounds.length - 1) * COL_W + CARD_W;
  const lbFinalRightX  = (lbRounds.length - 1) * COL_W + CARD_W;
  const totalW         = gfX + CARD_W + 12;

  const lines: React.ReactNode[] = [
    ...buildConnectors(ubRounds, ubPos, ubYStart, 'ub'),
    ...buildConnectors(lbRounds, lbPos, lbYStart, 'lb'),
    <polyline key="ub-gf"
      points={`${ubFinalRightX},${ubFinalY} ${gfMidX},${ubFinalY} ${gfMidX},${gfCenterY} ${gfX},${gfCenterY}`}
      fill="none" stroke={LINE_CLR} strokeWidth={LINE_W} />,
    <polyline key="lb-gf"
      points={`${lbFinalRightX},${lbFinalY} ${gfMidX},${lbFinalY} ${gfMidX},${gfCenterY} ${gfX},${gfCenterY}`}
      fill="none" stroke={LINE_CLR} strokeWidth={LINE_W} />,
  ];

  return (
    <div className={styles.scroll}>
      <div className={styles.canvas} style={{ width: totalW, height: totalH }}>

        <svg className={styles.svg} width={totalW} height={totalH}>
          {lines}
        </svg>

        <div className={styles.bracketLabel} style={{ top: 0, left: 0 }}>
          <span className={styles.ubBadge}>Upper Bracket</span>
        </div>
        {ubRounds.map((r, ri) => (
          <div key={`ubh-${r.id}`} className={styles.roundName}
            style={{ left: ri * COL_W, top: HEADER_H - 16, width: COL_W }}>
            {r.name}
          </div>
        ))}
        {ubRounds.map((round, ri) =>
          round.matches.map((match, mi) => (
            <div key={match.id} className={styles.card}
              style={{ left: ri * COL_W, top: ubYStart + ubPos[ri][mi] - CARD_H / 2, width: CARD_W }}>
              <MatchCard match={match} />
            </div>
          )),
        )}

        <div className={styles.bracketLabel}
          style={{ top: lbYStart - HEADER_H, left: 0 }}>
          <span className={styles.lbBadge}>Lower Bracket</span>
        </div>
        {lbRounds.map((r, ri) => (
          <div key={`lbh-${r.id}`} className={styles.roundName}
            style={{ left: ri * COL_W, top: lbYStart - 16, width: COL_W }}>
            {r.name}
          </div>
        ))}
        {lbRounds.map((round, ri) =>
          round.matches.map((match, mi) => (
            <div key={match.id} className={styles.card}
              style={{ left: ri * COL_W, top: lbYStart + lbPos[ri][mi] - CARD_H / 2, width: CARD_W }}>
              <MatchCard match={match} />
            </div>
          )),
        )}

        <div className={styles.gfLabel}
          style={{ left: gfX, top: gfCardTop - 30, width: CARD_W }}>
          Grand Final
        </div>
        <div className={styles.card} style={{ left: gfX, top: gfCardTop, width: CARD_W }}>
          <MatchCard match={grandFinal} highlight />
        </div>

      </div>
    </div>
  );
}
