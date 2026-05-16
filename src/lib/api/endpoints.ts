import { api } from './client';
import type {
  SessionDto,
  MeDto,
  UpdateMeRequest,
  PlayerPublicDto,
  AttachmentDto,
  AttachmentKind,
  AccountProvider,
  SeasonDto,
  SeasonDetailsDto,
  TournamentDto,
  TournamentDetailsDto,
  TournamentTeamDto,
  BracketDto,
  MatchDto,
  TeamDto,
  TeamPublicDto,
  MmrChangeRequestAdminDto,
  MmrChangeRequestDto,
  CreateMmrChangeRequest,
  PlayerMmrDto,
  PagedResponse,
  CreateSeasonRequest,
  UpdateSeasonRequest,
  CreateTournamentRequest,
  UpdateTournamentRequest,
  CreateTeamRequest,
  TeamInviteDto,
  CreateInviteRequest,
  MatchKind,
  MatchFormat,
  MatchRequestDto,
  CreateMatchRequestDto,
  PlayerAdminDto,
  AdminUpdatePlayerRequest,
  AuditLogDto,
  ActivityStatus,
  PlayerRole,
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

export interface PlayersPageParams {
  q?: string;
  country?: string;
  role?: string;
  activity?: 'active' | 'inactive' | 'all';
  page?: number;
  size?: number;
}

export function getPlayersPage(
  params: PlayersPageParams = {},
): Promise<PagedResponse<PlayerPublicDto>> {
  return api<PagedResponse<PlayerPublicDto>>(
    `/api/v1/players${buildQuery(params)}`,
  );
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
  teamId: string,
): Promise<TournamentTeamDto> {
  return api<TournamentTeamDto>(
    `/api/v1/tournaments/${encodeURIComponent(tournamentId)}/registrations?teamId=${encodeURIComponent(teamId)}`,
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

export function listTeamInvites(teamId: string): Promise<TeamInviteDto[]> {
  return api<TeamInviteDto[]>(
    `/api/v1/teams/${encodeURIComponent(teamId)}/invites`,
  );
}

export function createTeamInvite(
  teamId: string,
  body: CreateInviteRequest,
): Promise<TeamInviteDto> {
  return api<TeamInviteDto>(
    `/api/v1/teams/${encodeURIComponent(teamId)}/invites`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

export function cancelTeamInvite(teamId: string, inviteId: string): Promise<void> {
  return api<void>(
    `/api/v1/teams/${encodeURIComponent(teamId)}/invites/${encodeURIComponent(inviteId)}`,
    { method: 'DELETE' },
  );
}

export function leaveTeamMember(
  teamId: string,
  playerId: string,
): Promise<TeamDto> {
  return api<TeamDto>(
    `/api/v1/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(playerId)}/leave`,
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

// ──────────────── MMR (self) ────────────────

export function refreshMyMmr(): Promise<PlayerMmrDto> {
  return api<PlayerMmrDto>('/api/v1/me/mmr/refresh', { method: 'POST' });
}

export function createMyMmrChangeRequest(
  body: CreateMmrChangeRequest,
): Promise<MmrChangeRequestDto> {
  return api<MmrChangeRequestDto>('/api/v1/me/mmr/requests', {
    method: 'POST',
    body: JSON.stringify(body),
  });
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

// ──────────────── Admin Seasons ────────────────

export function createSeason(body: CreateSeasonRequest): Promise<SeasonDto> {
  return api<SeasonDto>('/api/v1/admin/seasons', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateSeason(
  id: string,
  patch: UpdateSeasonRequest,
): Promise<SeasonDto> {
  return api<SeasonDto>(`/api/v1/admin/seasons/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function startSeason(id: string): Promise<SeasonDto> {
  return api<SeasonDto>(
    `/api/v1/admin/seasons/${encodeURIComponent(id)}/start`,
    { method: 'POST' },
  );
}

export function finishSeason(id: string): Promise<SeasonDto> {
  return api<SeasonDto>(
    `/api/v1/admin/seasons/${encodeURIComponent(id)}/finish`,
    { method: 'POST' },
  );
}

// ──────────────── Admin Tournaments ────────────────

export function createTournament(
  body: CreateTournamentRequest,
): Promise<TournamentDto> {
  return api<TournamentDto>('/api/v1/admin/tournaments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateTournament(
  id: string,
  patch: UpdateTournamentRequest,
): Promise<TournamentDto> {
  return api<TournamentDto>(
    `/api/v1/admin/tournaments/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(patch),
    },
  );
}

export function openTournamentRegistration(id: string): Promise<TournamentDto> {
  return api<TournamentDto>(
    `/api/v1/admin/tournaments/${encodeURIComponent(id)}/registration/open`,
    { method: 'POST' },
  );
}

export function closeTournamentRegistration(id: string): Promise<TournamentDto> {
  return api<TournamentDto>(
    `/api/v1/admin/tournaments/${encodeURIComponent(id)}/registration/close`,
    { method: 'POST' },
  );
}

export function startTournament(id: string): Promise<TournamentDto> {
  return api<TournamentDto>(
    `/api/v1/admin/tournaments/${encodeURIComponent(id)}/start`,
    { method: 'POST' },
  );
}

export function finishTournament(
  id: string,
  winnerTeamId?: string,
): Promise<TournamentDto> {
  return api<TournamentDto>(
    `/api/v1/admin/tournaments/${encodeURIComponent(id)}/finish`,
    {
      method: 'POST',
      body: winnerTeamId
        ? JSON.stringify({ winnerTeamId })
        : JSON.stringify({}),
    },
  );
}

export function generateBracket(id: string): Promise<BracketDto> {
  return api<BracketDto>(
    `/api/v1/admin/tournaments/${encodeURIComponent(id)}/bracket/generate`,
    { method: 'POST' },
  );
}

// ──────────────── Teams (authoring) ────────────────

export function createTeam(body: CreateTeamRequest): Promise<TeamDto> {
  return api<TeamDto>('/api/v1/teams', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ──────────────── Attachments ────────────────

export function uploadAttachment(
  file: File,
  kind: AttachmentKind,
): Promise<AttachmentDto> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('kind', kind);
  return api<AttachmentDto>('/api/v1/attachments', {
    method: 'POST',
    body: fd,
  });
}

// ──────────────── Match-requests (KV lobbies) ────────────────

export interface LobbiesPageParams {
  kind?: MatchKind;
  format?: MatchFormat;
  region?: string;
  mmrMin?: number;
  mmrMax?: number;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export function listLobbies(
  params: LobbiesPageParams = {},
): Promise<PagedResponse<MatchRequestDto>> {
  return api<PagedResponse<MatchRequestDto>>(
    `/api/v1/match-requests${buildQuery(params)}`,
  );
}

export function createLobby(
  body: CreateMatchRequestDto,
): Promise<MatchRequestDto> {
  return api<MatchRequestDto>('/api/v1/match-requests', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function acceptLobby(id: string): Promise<MatchDto> {
  return api<MatchDto>(
    `/api/v1/match-requests/${encodeURIComponent(id)}/accept`,
    { method: 'POST' },
  );
}

export function cancelLobby(id: string): Promise<void> {
  return api<void>(`/api/v1/match-requests/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ──────────────── My incoming invites ────────────────

export interface MyInvitesPageParams {
  status?: 'PENDING' | 'ALL';
  page?: number;
  size?: number;
}

export function listMyInvites(
  params: MyInvitesPageParams = {},
): Promise<PagedResponse<TeamInviteDto>> {
  // Backend currently exposes only page/size on /me/invites. We keep `status`
  // as a hint for client-side filtering — see useMyInvites.
  const query: Record<string, number | undefined> = {
    page: params.page,
    size: params.size,
  };
  return api<PagedResponse<TeamInviteDto>>(
    `/api/v1/me/invites${buildQuery(query)}`,
  );
}

export function acceptInvite(id: string): Promise<TeamDto> {
  return api<TeamDto>(
    `/api/v1/me/invites/${encodeURIComponent(id)}/accept`,
    { method: 'POST' },
  );
}

export function declineInvite(id: string): Promise<void> {
  return api<void>(
    `/api/v1/me/invites/${encodeURIComponent(id)}/decline`,
    { method: 'POST' },
  );
}

// ──────────────── Matches (public) ────────────────

export function getMatch(id: string): Promise<MatchDto> {
  return api<MatchDto>(`/api/v1/matches/${encodeURIComponent(id)}`);
}

// ──────────────── Admin Players ────────────────

export interface AdminPlayersPageParams {
  q?: string;
  banned?: boolean;
  activity?: ActivityStatus;
  role?: PlayerRole;
  page?: number;
  size?: number;
}

export function getAdminPlayersPage(
  params: AdminPlayersPageParams = {},
): Promise<PagedResponse<PlayerAdminDto>> {
  return api<PagedResponse<PlayerAdminDto>>(
    `/api/v1/admin/players${buildQuery(params)}`,
  );
}

export function updateAdminPlayer(
  id: string,
  patch: AdminUpdatePlayerRequest,
): Promise<PlayerAdminDto> {
  return api<PlayerAdminDto>(
    `/api/v1/admin/players/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(patch),
    },
  );
}

export function banAdminPlayer(
  id: string,
  reason: string,
): Promise<PlayerAdminDto> {
  return api<PlayerAdminDto>(
    `/api/v1/admin/players/${encodeURIComponent(id)}/ban`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    },
  );
}

export function unbanAdminPlayer(id: string): Promise<PlayerAdminDto> {
  return api<PlayerAdminDto>(
    `/api/v1/admin/players/${encodeURIComponent(id)}/unban`,
    { method: 'POST' },
  );
}

// ──────────────── Admin Audit ────────────────

export interface AdminAuditPageParams {
  action?: string;
  targetType?: string;
  actorId?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export function getAdminAuditPage(
  params: AdminAuditPageParams = {},
): Promise<PagedResponse<AuditLogDto>> {
  return api<PagedResponse<AuditLogDto>>(
    `/api/v1/admin/audit${buildQuery(params)}`,
  );
}
