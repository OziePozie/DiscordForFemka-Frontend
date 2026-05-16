import { api } from './client';
import type {
  SessionDto,
  MeDto,
  UpdateMeRequest,
  PlayerPublicDto,
  AttachmentDto,
  AccountProvider,
  SeasonDto,
  SeasonDetailsDto,
  TournamentDetailsDto,
  TournamentTeamDto,
  BracketDto,
  MatchDto,
  TeamDto,
  TeamPublicDto,
  MmrChangeRequestAdminDto,
  PagedResponse,
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

// ──────────────── helpers ────────────────

function buildQuery(params: object): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    usp.append(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export function attachmentUrl(id: string): string {
  return `/api/v1/attachments/${encodeURIComponent(id)}`;
}

// ──────────────── Seasons (public) ────────────────

export interface SeasonsPageParams {
  page?: number;
  size?: number;
}

export function getSeasonsPage(
  params: SeasonsPageParams = {},
): Promise<PagedResponse<SeasonDto>> {
  return api<PagedResponse<SeasonDto>>(`/api/v1/seasons${buildQuery(params)}`);
}

export async function getCurrentSeason(): Promise<SeasonDto | null> {
  const data = await api<SeasonDto | null>('/api/v1/seasons/current');
  return data ?? null;
}

export function getSeasonBySlug(slug: string): Promise<SeasonDetailsDto> {
  return api<SeasonDetailsDto>(
    `/api/v1/seasons/${encodeURIComponent(slug)}`,
  );
}

// ──────────────── Tournaments (public) ────────────────

export function getTournamentBySlug(
  slug: string,
): Promise<TournamentDetailsDto> {
  return api<TournamentDetailsDto>(
    `/api/v1/tournaments/${encodeURIComponent(slug)}`,
  );
}

export function getTournamentTeams(
  tournamentId: string,
): Promise<TournamentTeamDto[]> {
  return api<TournamentTeamDto[]>(
    `/api/v1/tournaments/${encodeURIComponent(tournamentId)}/teams`,
  );
}

export interface TournamentMatchesParams {
  page?: number;
  size?: number;
}

export function getTournamentMatchesPage(
  tournamentId: string,
  params: TournamentMatchesParams = {},
): Promise<PagedResponse<MatchDto>> {
  return api<PagedResponse<MatchDto>>(
    `/api/v1/tournaments/${encodeURIComponent(tournamentId)}/matches${buildQuery(params)}`,
  );
}

export function getTournamentBracket(tournamentId: string): Promise<BracketDto> {
  return api<BracketDto>(
    `/api/v1/tournaments/${encodeURIComponent(tournamentId)}/bracket`,
  );
}

export function registerTeamForTournament(
  tournamentId: string,
): Promise<TournamentTeamDto> {
  return api<TournamentTeamDto>(
    `/api/v1/tournaments/${encodeURIComponent(tournamentId)}/registrations`,
    { method: 'POST' },
  );
}

// ──────────────── Teams (public) ────────────────

export interface TeamsPageParams {
  q?: string;
  status?: string;
  page?: number;
  size?: number;
}

export function getTeamsPage(
  params: TeamsPageParams = {},
): Promise<PagedResponse<TeamPublicDto>> {
  return api<PagedResponse<TeamPublicDto>>(
    `/api/v1/teams${buildQuery(params)}`,
  );
}

export function getTeamById(id: string): Promise<TeamDto> {
  return api<TeamDto>(`/api/v1/teams/${encodeURIComponent(id)}`);
}

export function disbandTeam(id: string): Promise<TeamDto> {
  return api<TeamDto>(
    `/api/v1/teams/${encodeURIComponent(id)}/disband`,
    { method: 'POST' },
  );
}

export function transferCaptaincy(
  teamId: string,
  newCaptainPlayerId: string,
): Promise<TeamDto> {
  return api<TeamDto>(
    `/api/v1/teams/${encodeURIComponent(teamId)}/captain`,
    {
      method: 'POST',
      body: JSON.stringify({ newCaptainPlayerId }),
    },
  );
}

// ──────────────── MMR Admin ────────────────

export interface AdminMmrRequestsParams {
  status?: 'pending' | 'all';
  page?: number;
  size?: number;
}

export function getAdminMmrRequestsPage(
  params: AdminMmrRequestsParams = {},
): Promise<PagedResponse<MmrChangeRequestAdminDto>> {
  return api<PagedResponse<MmrChangeRequestAdminDto>>(
    `/api/v1/admin/mmr/requests${buildQuery(params)}`,
  );
}

export function approveMmrRequest(
  id: string,
  comment?: string,
): Promise<MmrChangeRequestAdminDto> {
  return api<MmrChangeRequestAdminDto>(
    `/api/v1/admin/mmr/requests/${encodeURIComponent(id)}/approve`,
    {
      method: 'POST',
      body: comment ? JSON.stringify({ comment }) : JSON.stringify({}),
    },
  );
}

export function rejectMmrRequest(
  id: string,
  comment: string,
): Promise<MmrChangeRequestAdminDto> {
  return api<MmrChangeRequestAdminDto>(
    `/api/v1/admin/mmr/requests/${encodeURIComponent(id)}/reject`,
    {
      method: 'POST',
      body: JSON.stringify({ comment }),
    },
  );
}
