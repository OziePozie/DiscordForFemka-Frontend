import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { steamLoginUrl } from '@/lib/api/endpoints';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-12">
      <section className="space-y-6 py-12 text-center">
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
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {[
          { title: 'Текущий сезон', desc: 'Расписание турниров и матчей.' },
          { title: 'Команды', desc: 'Реестр команд, заявки, переходы.' },
          { title: 'Архив', desc: 'История прошлых сезонов и матчей.' },
        ].map((c) => (
          <Card key={c.title}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{c.title}</CardTitle>
                <Badge variant="secondary">Скоро</Badge>
              </div>
              <CardDescription>{c.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Появится в следующей итерации.
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
