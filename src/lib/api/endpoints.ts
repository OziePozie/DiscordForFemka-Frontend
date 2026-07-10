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
  TeamStatus,
  MmrChangeRequestAdminDto,
  MmrChangeRequestDto,
  CreateMmrChangeRequest,
  PlayerMmrDto,
  PagedResponse,
  CreateSeasonRequest,
  UpdateSeasonRequest,
  CreateTournamentRequest,
  UpdateTournamentRequest,
  TournamentEligibilityDto,
  CreateTeamRequest,
  UpdateTeamRequest,
  TeamInviteDto,
  CreateInviteRequest,
  MatchKind,
  MatchFormat,
  MatchRequestDto,
  CreateMatchRequestDto,
  PlayerAdminDto,
  AdminUpdatePlayerRequest,
  AuditLogDto,
  BotStatusDto,
  ActivityStatus,
  PlayerRole,
  UpdateMatchRequest,
  TechResultRequest,
  MoveTeamsRequest,
  ChangeFormatRequest,
  SeasonChampionDto,
  PlayerHistoryDto,
  TeamHistoryDto,
  MatchLiveSnapshotDto,
  MatchResultDto,
  CreateOpenLobbyRequest,
  OpenLobbyDto,
  LeaderboardEntryDto,
  PlayerRatingDto,
  PlayerMatchSummaryDto,
  PlayerStatsDto,
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

export interface PlayerMatchesPageParams {
  page?: number;
  size?: number;
}

export function getPlayerMatches(
  id: string,
  params: PlayerMatchesPageParams = {},
): Promise<PagedResponse<PlayerMatchSummaryDto>> {
  return api<PagedResponse<PlayerMatchSummaryDto>>(
    `/api/v1/players/${encodeURIComponent(id)}/matches${buildQuery(params)}`,
  );
}

export function getPlayerStats(id: string): Promise<PlayerStatsDto> {
  return api<PlayerStatsDto>(
    `/api/v1/players/${encodeURIComponent(id)}/stats`,
  );
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

// ──────────────── Internal rating (public) ────────────────

export interface LeaderboardPageParams {
  page?: number;
  size?: number;
}

export function getLeaderboardPage(
  params: LeaderboardPageParams = {},
): Promise<PagedResponse<LeaderboardEntryDto>> {
  return api<PagedResponse<LeaderboardEntryDto>>(
    `/api/v1/ratings/leaderboard${buildQuery(params)}`,
  );
}

export function getPlayerRating(id: string): Promise<PlayerRatingDto> {
  return api<PlayerRatingDto>(
    `/api/v1/ratings/players/${encodeURIComponent(id)}`,
  );
}

export function recalculateRatings(): Promise<{ appliedMatches: number }> {
  return api<{ appliedMatches: number }>(
    '/api/v1/admin/ratings/recalculate',
    { method: 'POST' },
  );
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
  verifiedOnly = false,
): Promise<TournamentTeamDto[]> {
  const qs = verifiedOnly ? '?verifiedOnly=true' : '';
  return api<TournamentTeamDto[]>(
    `/api/v1/tournaments/${encodeURIComponent(tournamentId)}/teams${qs}`,
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

export function hideTournament(id: string): Promise<TournamentDto> {
  return api<TournamentDto>(
    `/api/v1/admin/tournaments/${encodeURIComponent(id)}/hide`,
    { method: 'POST' },
  );
}

export function unhideTournament(id: string): Promise<TournamentDto> {
  return api<TournamentDto>(
    `/api/v1/admin/tournaments/${encodeURIComponent(id)}/unhide`,
    { method: 'POST' },
  );
}

export function getTournamentEligibility(
  id: string,
): Promise<TournamentEligibilityDto> {
  return api<TournamentEligibilityDto>(
    `/api/v1/admin/tournaments/${encodeURIComponent(id)}/eligibility`,
  );
}

export function putTournamentEligibility(
  id: string,
  body: TournamentEligibilityDto,
): Promise<TournamentEligibilityDto> {
  return api<TournamentEligibilityDto>(
    `/api/v1/admin/tournaments/${encodeURIComponent(id)}/eligibility`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
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

export function updateTeam(
  id: string,
  body: UpdateTeamRequest,
): Promise<TeamDto> {
  return api<TeamDto>(`/api/v1/teams/${encodeURIComponent(id)}`, {
    method: 'PATCH',
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

export async function getMatchLive(
  id: string,
): Promise<MatchLiveSnapshotDto | null> {
  // Backend returns 204 No Content when no fresh snapshot is available.
  // The shared `api<T>` helper maps 204 -> undefined; we coerce to `null`
  // for the caller (same pattern as `getSession`).
  const data = await api<MatchLiveSnapshotDto | null>(
    `/api/v1/matches/${encodeURIComponent(id)}/live`,
  );
  return data ?? null;
}

export function getMatchResult(
  id: string,
  gameNumber?: number,
): Promise<MatchResultDto> {
  const q = gameNumber != null ? `?gameNumber=${gameNumber}` : '';
  return api<MatchResultDto>(
    `/api/v1/matches/${encodeURIComponent(id)}/result${q}`,
  );
}

export function markMatchReady(matchId: string): Promise<MatchDto> {
  return api<MatchDto>(
    `/api/v1/matches/${encodeURIComponent(matchId)}/ready`,
    { method: 'POST' },
  );
}

export function markMatchUnready(matchId: string): Promise<MatchDto> {
  return api<MatchDto>(
    `/api/v1/matches/${encodeURIComponent(matchId)}/unready`,
    { method: 'POST' },
  );
}

// ──────────────── Admin: match lobby ────────────────

export function recreateLobby(matchId: string): Promise<MatchDto> {
  return api<MatchDto>(
    `/api/v1/admin/matches/${encodeURIComponent(matchId)}/lobby/recreate`,
    { method: 'POST' },
  );
}

export function launchLobby(matchId: string): Promise<MatchDto> {
  return api<MatchDto>(
    `/api/v1/admin/matches/${encodeURIComponent(matchId)}/lobby/launch`,
    { method: 'POST' },
  );
}

export function updateAdminMatch(
  id: string,
  patch: UpdateMatchRequest,
): Promise<MatchDto> {
  return api<MatchDto>(
    `/api/v1/admin/matches/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(patch),
    },
  );
}

export function finishMatch(
  id: string,
  body: { winnerTeamId: string; scoreA: number; scoreB: number },
): Promise<MatchDto> {
  return api<MatchDto>(
    `/api/v1/admin/matches/${encodeURIComponent(id)}/finish`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export function repropagateMatch(id: string): Promise<MatchDto> {
  return api<MatchDto>(
    `/api/v1/admin/matches/${encodeURIComponent(id)}/repropagate`,
    { method: 'POST' },
  );
}

export function techResultMatch(
  id: string,
  body: TechResultRequest,
): Promise<MatchDto> {
  return api<MatchDto>(
    `/api/v1/admin/matches/${encodeURIComponent(id)}/tech-result`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export function cancelMatchResult(id: string): Promise<MatchDto> {
  return api<MatchDto>(
    `/api/v1/admin/matches/${encodeURIComponent(id)}/cancel-result`,
    { method: 'POST' },
  );
}

export function moveMatchTeams(
  id: string,
  body: MoveTeamsRequest,
): Promise<MatchDto> {
  return api<MatchDto>(
    `/api/v1/admin/matches/${encodeURIComponent(id)}/move-teams`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export function changeMatchFormat(
  id: string,
  body: ChangeFormatRequest,
): Promise<MatchDto> {
  return api<MatchDto>(
    `/api/v1/admin/matches/${encodeURIComponent(id)}/format`,
    { method: 'POST', body: JSON.stringify(body) },
  );
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

export function setAdminPlayerFemaleVerified(
  id: string,
  verified: boolean,
): Promise<PlayerAdminDto> {
  return api<PlayerAdminDto>(
    `/api/v1/admin/players/${encodeURIComponent(id)}/female-verification`,
    {
      method: 'POST',
      body: JSON.stringify({ verified }),
    },
  );
}

// ──────────────── Admin Teams ────────────────

export interface AdminTeamsPageParams {
  q?: string;
  status?: TeamStatus;
  hidden?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export function getAdminTeamsPage(
  params: AdminTeamsPageParams = {},
): Promise<PagedResponse<TeamPublicDto>> {
  return api<PagedResponse<TeamPublicDto>>(
    `/api/v1/admin/teams${buildQuery(params)}`,
  );
}

export function hideTeam(id: string): Promise<TeamDto> {
  return api<TeamDto>(
    `/api/v1/admin/teams/${encodeURIComponent(id)}/hide`,
    { method: 'POST' },
  );
}

export function unhideTeam(id: string): Promise<TeamDto> {
  return api<TeamDto>(
    `/api/v1/admin/teams/${encodeURIComponent(id)}/unhide`,
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

// ──────────────── Admin: Dota bots ────────────────

export function listAdminBots(): Promise<BotStatusDto[]> {
  return api<BotStatusDto[]>('/api/v1/admin/bots');
}

export function adminBotLeaveLobby(username: string): Promise<void> {
  return api<void>(
    `/api/v1/admin/bots/${encodeURIComponent(username)}/leave-lobby`,
    { method: 'POST' },
  );
}

export function adminBotGcRehello(username: string): Promise<void> {
  return api<void>(
    `/api/v1/admin/bots/${encodeURIComponent(username)}/gc/rehello`,
    { method: 'POST' },
  );
}

export function adminBotSteamReconnect(username: string): Promise<void> {
  return api<void>(
    `/api/v1/admin/bots/${encodeURIComponent(username)}/steam/reconnect`,
    { method: 'POST' },
  );
}

// ──────────────── Archive / History (Stage 9) ────────────────

export function getSeasonChampions(slug: string): Promise<SeasonChampionDto[]> {
  return api<SeasonChampionDto[]>(
    `/api/v1/seasons/${encodeURIComponent(slug)}/champions`,
  );
}

export function getPlayerHistory(id: string): Promise<PlayerHistoryDto> {
  return api<PlayerHistoryDto>(
    `/api/v1/players/${encodeURIComponent(id)}/history`,
  );
}

export function getTeamHistory(id: string): Promise<TeamHistoryDto> {
  return api<TeamHistoryDto>(
    `/api/v1/teams/${encodeURIComponent(id)}/history`,
  );
}

// ──────────────── Open Lobbies ────────────────

export interface OpenLobbiesPageParams {
  region?: string;
  mmrMin?: number;
  mmrMax?: number;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export function listOpenLobbies(
  params: OpenLobbiesPageParams = {},
): Promise<PagedResponse<OpenLobbyDto>> {
  return api<PagedResponse<OpenLobbyDto>>(
    `/api/v1/open-lobbies${buildQuery(params)}`,
  );
}

export function getOpenLobby(id: string): Promise<OpenLobbyDto> {
  return api<OpenLobbyDto>(`/api/v1/open-lobbies/${encodeURIComponent(id)}`);
}

export function createOpenLobby(
  body: CreateOpenLobbyRequest,
): Promise<OpenLobbyDto> {
  return api<OpenLobbyDto>('/api/v1/open-lobbies', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function joinOpenLobbySlot(
  id: string,
  slotIndex: number,
): Promise<OpenLobbyDto> {
  return api<OpenLobbyDto>(
    `/api/v1/open-lobbies/${encodeURIComponent(id)}/slots/${slotIndex}/join`,
    { method: 'POST' },
  );
}

export function leaveOpenLobby(id: string): Promise<OpenLobbyDto> {
  return api<OpenLobbyDto>(
    `/api/v1/open-lobbies/${encodeURIComponent(id)}/leave`,
    { method: 'POST' },
  );
}

export function confirmOpenLobby(id: string): Promise<OpenLobbyDto> {
  return api<OpenLobbyDto>(
    `/api/v1/open-lobbies/${encodeURIComponent(id)}/confirm`,
    { method: 'POST' },
  );
}

export function startOpenLobby(id: string): Promise<OpenLobbyDto> {
  return api<OpenLobbyDto>(
    `/api/v1/open-lobbies/${encodeURIComponent(id)}/start`,
    { method: 'POST' },
  );
}

export function cancelOpenLobby(id: string): Promise<void> {
  return api<void>(`/api/v1/open-lobbies/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
