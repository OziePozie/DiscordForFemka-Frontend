import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { steamLoginUrl } from '@/lib/api/endpoints';
import { useCurrentSeason, useSeason } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SEASON_STATUS_LABEL } from '@/lib/api/types';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const currentSeason = useCurrentSeason();
  // Pull season details to know tournaments list (only when we know slug).
  const seasonDetails = useSeason(currentSeason.data?.slug);

  const season = currentSeason.data;
  const tournaments = seasonDetails.data?.tournaments ?? [];
  const tournamentsCount = tournaments.length;
  const featured =
    tournaments.find(
      (t) => t.status === 'LIVE' || t.status === 'REGISTRATION_OPEN',
    ) ??
    tournaments.find((t) => t.status === 'ANNOUNCED') ??
    tournaments[0];

  return (
    <div className="space-y-12">
      <section className="space-y-6 py-12 text-center">
        {currentSeason.isLoading ? (
          <div className="mx-auto max-w-xl space-y-3">
            <Skeleton className="mx-auto h-10 w-2/3" />
            <Skeleton className="mx-auto h-5 w-1/2" />
          </div>
        ) : season ? (
          <>
            <div className="flex justify-center">
              <Badge variant="secondary">
                {SEASON_STATUS_LABEL[season.status]}
              </Badge>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {season.name}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {tournamentsCount} турниров
              {season.description ? ` · ${season.description}` : ''}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" onClick={() => navigate(`/seasons/${season.slug}`)}>
                Открыть сезон
              </Button>
              {!isAuthenticated && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    window.location.href = steamLoginUrl('/profile');
                  }}
                >
                  Войти через Steam
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Турнирная экосистема
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Регистрация, MMR, команды, сезоны — в одном месте.
            </p>
            <div className="flex justify-center">
              {isAuthenticated ? (
                <Button size="lg" onClick={() => navigate('/profile')}>
                  Открыть профиль
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => {
                    window.location.href = steamLoginUrl('/profile');
                  }}
                >
                  Войти через Steam
                </Button>
              )}
            </div>
          </>
        )}
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Команды</CardTitle>
            <CardDescription>
              Реестр команд, состав, переходы.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/teams')}
            >
              К командам
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Текущий турнир</CardTitle>
            <CardDescription>
              {featured ? featured.name : 'Нет активных турниров.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              disabled={!featured}
              onClick={() => featured && navigate(`/tournaments/${featured.slug}`)}
            >
              К турниру
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Архив сезонов</CardTitle>
            <CardDescription>История прошлых сезонов.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/seasons')}
            >
              К сезонам
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
