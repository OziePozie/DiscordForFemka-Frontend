import { useCurrentSeason, usePlayerRating } from '@/lib/queries';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RankBadge } from '@/components/RankBadge';

type Props = {
  playerId: string | undefined;
};

/**
 * Self-contained internal-rating widget for a player profile. Shows the player's
 * rating in the current (ACTIVE) season. Renders nothing if there is no current
 * season or the rating cannot be loaded, so it never breaks the page.
 */
export function PlayerRatingCard({ playerId }: Props) {
  const seasonQ = useCurrentSeason();
  const season = seasonQ.data;
  const q = usePlayerRating(playerId, season?.slug);

  if (seasonQ.isLoading || q.isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }
  if (!season || q.isError || !q.data) {
    return null;
  }

  const r = q.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Внутренний рейтинг · {season.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <div className="ec-num text-4xl font-bold text-brand">
              {r.rating}
            </div>
            <div className="mt-1">
              <RankBadge tier={r.rankTier} />
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:grid-cols-4">
            <Stat label="Игр" value={r.gamesPlayed} />
            <Stat label="Побед" value={r.wins} valueClass="text-success" />
            <Stat label="Поражений" value={r.losses} valueClass="text-live" />
            <Stat label="Серия" value={r.currentStreak} />
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`font-semibold ${valueClass ?? ''}`}>{value}</dd>
    </div>
  );
}
