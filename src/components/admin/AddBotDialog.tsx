import { useState, type FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ProblemDetailError } from '@/lib/api/client';
import { useCreateAdminBot } from '@/lib/queries';

interface AddBotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddBotDialog({ open, onOpenChange }: AddBotDialogProps) {
  const { toast } = useToast();
  const mutation = useCreateAdminBot();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setUsername('');
    setPassword('');
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const bot = await mutation.mutateAsync({ username, password });
      toast({ title: 'Бот добавлен', description: `${bot.username} готов` });
      reset();
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof ProblemDetailError
          ? (err.detail ?? err.title)
          : err instanceof Error
            ? err.message
            : 'неизвестная ошибка';
      setError(message);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!mutation.isPending) {
          if (!next) reset();
          onOpenChange(next);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить бота</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bot-username">Логин Steam</Label>
            <Input
              id="bot-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              disabled={mutation.isPending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bot-password">Пароль</Label>
            <Input
              id="bot-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={mutation.isPending}
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {mutation.isPending && (
            <p className="text-sm text-muted-foreground">
              Поднимаем бота и ждём готовности — это может занять до минуты…
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={mutation.isPending || !username || !password}>
              {mutation.isPending ? 'Добавляем…' : 'Добавить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
