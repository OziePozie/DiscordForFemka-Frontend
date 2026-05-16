import { api } from './client';
import type {
  SessionDto,
  MeDto,
  UpdateMeRequest,
  PlayerPublicDto,
  AttachmentDto,
  AccountProvider,
} from './types';

export async function getSession(): Promise<SessionDto | null> {
  // Backend may return either body `null` or HTTP 200 with literal null in body.
  const data = await api<SessionDto | null>('/api/v1/auth/session');
  return data ?? null;
}

export function getMe(): Promise<MeDto> {
  return api<MeDto>('/api/v1/me');
}

export function updateMe(patch: Partial<UpdateMeRequest>): Promise<MeDto> {
  return api<MeDto>('/api/v1/me', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function uploadAvatar(file: File): Promise<AttachmentDto> {
  const fd = new FormData();
  fd.append('file', file);
  return api<AttachmentDto>('/api/v1/me/avatar', {
    method: 'POST',
    body: fd,
  });
}

export function getPlayer(id: string): Promise<PlayerPublicDto> {
  return api<PlayerPublicDto>(`/api/v1/players/${encodeURIComponent(id)}`);
}

export function logout(): Promise<void> {
  return api<void>('/api/v1/auth/logout', { method: 'POST' });
}

export function unlinkProvider(
  provider: Lowercase<AccountProvider>,
): Promise<void> {
  return api<void>(`/api/v1/me/links/${provider}`, { method: 'DELETE' });
}

export function steamLoginUrl(returnTo: string): string {
  return `/oauth/steam/login?returnTo=${encodeURIComponent(returnTo)}`;
}

// TODO: backend route to be implemented
export function discordLinkUrl(returnTo: string): string {
  return `/oauth/discord/link?returnTo=${encodeURIComponent(returnTo)}`;
}

// TODO: backend route to be implemented
export function twitchLinkUrl(returnTo: string): string {
  return `/oauth/twitch/link?returnTo=${encodeURIComponent(returnTo)}`;
}
