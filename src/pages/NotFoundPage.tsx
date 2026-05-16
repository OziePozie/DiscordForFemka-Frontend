import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <h1 className="text-5xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground">Такой страницы не существует.</p>
      <Button asChild>
        <Link to="/">На главную</Link>
      </Button>
    </div>
  );
}
