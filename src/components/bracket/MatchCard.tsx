import type { Match } from './bracketTypes';
import styles from './MatchCard.module.css';

interface Props {
  match: Match;
  highlight?: boolean;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) +
    ' ' +
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  );
}

export default function MatchCard({ match, highlight }: Props) {
  const { teamA, teamB, scoreA, scoreB, format, status, completedAt, winnerId } = match;
  const done = status === 'completed';
  const aWon = done && winnerId === teamA?.id;
  const bWon = done && winnerId === teamB?.id;

  return (
    <div className={`${styles.card} ${styles[status]} ${highlight ? styles.highlight : ''}`}>
      <div className={styles.header}>
        <span className={styles.format}>{format}</span>
        {status === 'live' && <span className={styles.live}>LIVE</span>}
        {done && completedAt && <span className={styles.date}>{formatDate(completedAt)}</span>}
        {status === 'pending' && <span className={styles.pending}>TBD</span>}
      </div>

      <div className={`${styles.team} ${aWon ? styles.won : ''} ${bWon ? styles.lost : ''}`}>
        <span className={styles.name}>{teamA?.name ?? '???'}</span>
        {status !== 'pending' && teamA && <span className={styles.score}>{scoreA}</span>}
      </div>

      <div className={styles.sep} />

      <div className={`${styles.team} ${bWon ? styles.won : ''} ${aWon ? styles.lost : ''}`}>
        <span className={styles.name}>{teamB?.name ?? '???'}</span>
        {status !== 'pending' && teamB && <span className={styles.score}>{scoreB}</span>}
      </div>
    </div>
  );
}
