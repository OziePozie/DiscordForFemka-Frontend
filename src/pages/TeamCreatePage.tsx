import { useState, useRef, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ProblemDetailError } from '@/lib/api/client';
import { useCreateTeam, useUploadAttachment } from '@/lib/queries';

const TAG_PATTERN = /^[A-Za-z0-9._-]+$/;

interface FieldErrors {
  name?: string;
  tag?: string;
  logo?: string;
  _global?: string;
}

export default function TeamCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createTeam = useCreateTeam();
  const uploadAttachment = useUploadAttachment();

  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const fileRef = useRef<HTMLInputElement | null>(null);

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    const n = name.trim();
    const t = tag.trim();
    if (!n) e.name = 'Введите название';
    else if (n.length > 64) e.name = 'Максимум 64 символа';
    if (!t) e.tag = 'Введите тег';
    else if (t.length < 2 || t.length > 8)
      e.tag = 'Длина тега 2..8 символов';
    else if (!TAG_PATTERN.test(t))
      e.tag = 'Только латиница, цифры и символы . _ -';
    return e;
  }

  function handleLogoPick(ev: ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0] ?? null;
    setLogoFile(f);
    setErrors((p) => ({ ...p, logo: undefined }));
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    const local = validate();
    if (Object.keys(local).length > 0) {
      setErrors(local);
      return;
    }
    setErrors({});

    try {
      let logoAttachmentId: string | undefined;
      if (logoFile) {
        try {
          const att = await uploadAttachment.mutateAsync({
            file: logoFile,
            kind: 'TEAM_LOGO',
          });
          logoAttachmentId = att.id;
        } catch (err) {
          const msg =
            err instanceof ProblemDetailError
              ? err.detail ?? err.title
              : err instanceof Error
                ? err.message
                : 'Ошибка загрузки логотипа';
          setErrors({ logo: msg });
          return;
        }
      }

      const team = await createTeam.mutateAsync({
        name: name.trim(),
        tag: tag.trim(),
        logoAttachmentId,
      });
      toast({ title: 'Команда создана' });
      navigate(`/teams/${team.id}`);
    } catch (err) {
      if (err instanceof ProblemDetailError) {
        if (err.status === 403 && err.code === 'PLATFORM_ACCOUNT_INACTIVE') {
          setErrors({
            _global:
              'Профиль не активен — заполните MMR и получите одобрение.',
          });
          return;
        }
        if (err.status === 409 && err.code === 'PLATFORM_CONFLICT') {
          setErrors({ tag: 'Такой тег уже существует' });
          return;
        }
        if (err.status === 400 && err.errors && err.errors.length > 0) {
          const fieldErrs: FieldErrors = {};
          for (const fe of err.errors) {
            const f = (fe.field ?? '').toLowerCase();
            if (f.includes('name')) fieldErrs.name = fe.message;
            else if (f.includes('tag')) fieldErrs.tag = fe.message;
            else if (f.includes('logo')) fieldErrs.logo = fe.message;
            else fieldErrs._global = fe.message;
          }
          if (Object.keys(fieldErrs).length === 0) {
            fieldErrs._global = err.detail ?? err.title;
          }
          setErrors(fieldErrs);
          return;
        }
        setErrors({ _global: err.detail ?? err.title });
        return;
      }
      setErrors({
        _global: err instanceof Error ? err.message : 'Неизвестная ошибка',
      });
    }
  }

  const submitting = createTeam.isPending || uploadAttachment.isPending;

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Создание команды</CardTitle>
          <CardDescription>
            Вы станете капитаном новой команды. Состав можно собрать позже —
            через приглашения.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errors._global && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errors._global}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={64}
                placeholder="Например, Femka eSports"
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag">Тег</Label>
              <Input
                id="tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                maxLength={8}
                placeholder="FEM"
                aria-invalid={!!errors.tag}
              />
              <p className="text-xs text-muted-foreground">
                2..8 символов; латиница, цифры, точка, подчёркивание, дефис.
              </p>
              {errors.tag && (
                <p className="text-sm text-destructive">{errors.tag}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Логотип (опционально)</Label>
              <Input
                id="logo"
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleLogoPick}
              />
              {logoFile && (
                <p className="text-xs text-muted-foreground">
                  Файл: {logoFile.name} ({Math.round(logoFile.size / 1024)} KB)
                </p>
              )}
              {errors.logo && (
                <p className="text-sm text-destructive">{errors.logo}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Создание…' : 'Создать команду'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/teams')}
              >
                Отмена
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
