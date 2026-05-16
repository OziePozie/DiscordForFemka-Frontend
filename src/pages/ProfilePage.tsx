import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  useMe,
  useUpdateMe,
  useUploadAvatar,
  useUnlinkProvider,
} from '@/lib/queries';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { ProblemDetailError } from '@/lib/api/client';
import { discordLinkUrl, twitchLinkUrl } from '@/lib/api/endpoints';
import {
  MMR_SOURCE_LABEL,
  PLAYER_POSITIONS,
  POSITION_LABEL,
  type PlayerPosition,
  type UpdateMeRequest,
} from '@/lib/api/types';
import { timeAgo } from '@/lib/utils';

export default function ProfilePage() {
  const me = useMe();
  const updateMe = useUpdateMe();
  const uploadAvatar = useUploadAvatar();
  const unlink = useUnlinkProvider();
  const { toast } = useToast();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UpdateMeRequest>({});
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (me.data) {
      setForm({
        nickname: me.data.profile.nickname ?? '',
        country: me.data.profile.country ?? '',
        primaryRole: me.data.profile.primaryRole ?? undefined,
        secondaryRoles: me.data.profile.secondaryRoles ?? [],
        dotabuffUrl: me.data.profile.dotabuffUrl ?? '',
        stratzUrl: me.data.profile.stratzUrl ?? '',
      });
    }
  }, [me.data]);

  if (me.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (me.isError || !me.data) {
    return (
      <div className="text-sm text-destructive">
        Не удалось загрузить профиль:{' '}
        {me.error instanceof Error ? me.error.message : 'unknown error'}
      </div>
    );
  }

  const data = me.data;
  const profile = data.profile;
  const profileIncomplete =
    !profile.nickname || !profile.country || !profile.primaryRole;
  const initials = (profile.nickname ?? '?').slice(0, 2).toUpperCase();

  function update<K extends keyof UpdateMeRequest>(
    key: K,
    value: UpdateMeRequest[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleSecondary(pos: PlayerPosition) {
    setForm((f) => {
      const current = f.secondaryRoles ?? [];
      const next = current.includes(pos)
        ? current.filter((p) => p !== pos)
        : [...current, pos];
      return { ...f, secondaryRoles: next };
    });
  }

  async function handleSave() {
    try {
      await updateMe.mutateAsync(form);
      toast({ title: 'Профиль обновлён' });
      setEditing(false);
    } catch (e) {
      const msg =
        e instanceof ProblemDetailError
          ? `${e.title}${e.detail ? `: ${e.detail}` : ''}`
          : e instanceof Error
            ? e.message
            : 'Неизвестная ошибка';
      toast({ title: 'Ошибка сохранения', description: msg, variant: 'destructive' });
    }
  }

  async function handleAvatarPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAvatar.mutateAsync(file);
      toast({ title: 'Аватар обновлён' });
    } catch (err) {
      toast({
        title: 'Не удалось загрузить аватар',
        description: err instanceof Error ? err.message : 'unknown error',
        variant: 'destructive',
      });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleUnlink(provider: 'discord' | 'twitch') {
    try {
      await unlink.mutateAsync(provider);
      toast({ title: `${provider === 'discord' ? 'Discord' : 'Twitch'} отвязан` });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'unknown error',
        variant: 'destructive',
      });
    }
  }

  const discord = data.links.find((l) => l.provider === 'DISCORD');
  const twitch = data.links.find((l) => l.provider === 'TWITCH');

  return (
    <div className="space-y-6">
      {profileIncomplete && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
          Заполните профиль (никнейм, страна, основная роль) для активации
          аккаунта.
        </div>
      )}

      {/* Профиль */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Профиль</CardTitle>
            <CardDescription>
              Steam ID: {String(data.steamId)}
            </CardDescription>
          </div>
          {!editing ? (
            <Button variant="outline" onClick={() => setEditing(true)}>
              Редактировать
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Отмена
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMe.isPending}
              >
                {updateMe.isPending ? 'Сохранение…' : 'Сохранить'}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title="Сменить аватар"
            >
              <Avatar className="h-20 w-20">
                {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="" />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarPick}
            />
            <div className="text-sm text-muted-foreground">
              Нажмите на аватар, чтобы загрузить новое изображение
              (≤ 2MB).
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nickname">Никнейм</Label>
              <Input
                id="nickname"
                value={form.nickname ?? ''}
                onChange={(e) => update('nickname', e.target.value)}
                disabled={!editing}
                maxLength={64}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Страна (2 буквы)</Label>
              <Input
                id="country"
                value={form.country ?? ''}
                onChange={(e) => update('country', e.target.value.toUpperCase())}
                disabled={!editing}
                maxLength={2}
                placeholder="RU"
              />
            </div>

            <div className="space-y-2">
              <Label>Основная роль</Label>
              <Select
                value={form.primaryRole ?? undefined}
                onValueChange={(v) => update('primaryRole', v as PlayerPosition)}
                disabled={!editing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите позицию" />
                </SelectTrigger>
                <SelectContent>
                  {PLAYER_POSITIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {POSITION_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Запасные роли</Label>
              <div className="flex flex-wrap gap-2">
                {PLAYER_POSITIONS.map((p) => {
                  const selected = (form.secondaryRoles ?? []).includes(p);
                  return (
                    <Button
                      key={p}
                      type="button"
                      size="sm"
                      variant={selected ? 'default' : 'outline'}
                      disabled={!editing}
                      onClick={() => toggleSecondary(p)}
                    >
                      {p.replace('POS_', 'P')}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="dotabuff">Dotabuff URL</Label>
              <Input
                id="dotabuff"
                value={form.dotabuffUrl ?? ''}
                onChange={(e) => update('dotabuffUrl', e.target.value)}
                disabled={!editing}
                placeholder="https://www.dotabuff.com/players/..."
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="stratz">Stratz URL</Label>
              <Input
                id="stratz"
                value={form.stratzUrl ?? ''}
                onChange={(e) => update('stratzUrl', e.target.value)}
                disabled={!editing}
                placeholder="https://stratz.com/players/..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MMR */}
      <Card>
        <CardHeader>
          <CardTitle>MMR</CardTitle>
          <CardDescription>
            Источник и время последнего обновления.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl font-bold">{data.mmr.mmr}</span>
            <Badge variant="outline">{MMR_SOURCE_LABEL[data.mmr.source]}</Badge>
            <span className="text-sm text-muted-foreground">
              обновлён {timeAgo(data.mmr.fetchedAt)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled
              title="Будет в следующей итерации"
            >
              Обновить через OpenDota
            </Button>
            <Button
              variant="outline"
              disabled
              title="Будет в следующей итерации"
            >
              Заявка на изменение
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Привязанные аккаунты */}
      <Card>
        <CardHeader>
          <CardTitle>Привязанные аккаунты</CardTitle>
          <CardDescription>Discord и Twitch — опционально.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Discord */}
          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div>
              <div className="font-medium">Discord</div>
              <div className="text-sm text-muted-foreground">
                {discord
                  ? discord.externalLogin ?? discord.externalId
                  : 'Не привязан'}
              </div>
            </div>
            {discord ? (
              <Button
                variant="outline"
                onClick={() => handleUnlink('discord')}
                disabled={unlink.isPending}
              >
                Отвязать
              </Button>
            ) : (
              <Button
                onClick={() => {
                  // TODO: backend route to be implemented
                  window.location.href = discordLinkUrl('/profile');
                }}
              >
                Привязать
              </Button>
            )}
          </div>

          {/* Twitch */}
          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div>
              <div className="font-medium">Twitch</div>
              <div className="text-sm text-muted-foreground">
                {twitch
                  ? twitch.externalLogin ?? twitch.externalId
                  : 'Не привязан'}
              </div>
            </div>
            {twitch ? (
              <Button
                variant="outline"
                onClick={() => handleUnlink('twitch')}
                disabled={unlink.isPending}
              >
                Отвязать
              </Button>
            ) : (
              <Button
                onClick={() => {
                  // TODO: backend route to be implemented
                  window.location.href = twitchLinkUrl('/profile');
                }}
              >
                Привязать
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
