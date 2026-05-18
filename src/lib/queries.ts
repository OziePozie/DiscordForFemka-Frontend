import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  getSession,
  getMe,
  updateMe,
  uploadAvatar,
  getPlayer,
  logout,
  unlinkProvider,
  getSeasonsPage,
  getCurrentSeason,
  getSeasonBySlug,
  getTournamentBySlug,
  getTournamentTeams,
  getTournamentMatchesPage,
  getTournamentBracket,
  getTeamsPage,
  getTeamById,
  getAdminMmrRequestsPage,
  approveMmrRequest,
  rejectMmrRequest,
  refreshMyMmr,
  createMyMmrChangeRequest,
  disbandTeam,
  transferCaptaincy,
  listTeamInvites,
  createTeamInvite,
  cancelTeamInvite,
  leaveTeamMember,
  getPlayersPage,
  registerTeamForTournament,
  createSeason,
  updateSeason,
  startSeason,
  finishSeason,
  createTournament,
  updateTournament,
  openTournamentRegistration,
  closeTournamentRegistration,
  startTournament,
  finishTournament,
  generateBracket,
  createTeam,
  updateTeam,
  uploadAttachment,
  listLobbies,
  createLobby,
  acceptLobby,
  cancelLobby,
  listMyInvites,
  acceptInvite,
  declineInvite,
  getMatch,
  markMatchReady,
  markMatchUnready,
  recreateLobby,
  getAdminPlayersPage,
  updateAdminPlayer,
  banAdminPlayer,
  unbanAdminPlayer,
  getAdminAuditPage,
  updateAdminMatch,
  getSeasonChampions,
  getPlayerHistory,
  getTeamHistory,
  type SeasonsPageParams,
  type TournamentMatchesParams,
  type TeamsPageParams,
  type AdminMmrRequestsParams,
  type LobbiesPageParams,
  type MyInvitesPageParams,
  type AdminPlayersPageParams,
  type AdminAuditPageParams,
  type PlayersPageParams,
} from './api/endpoints';
import type {
  SessionDto,
  MeDto,
  UpdateMeRequest,
  PlayerPublicDto,
  AttachmentDto,
  AttachmentKind,
  AccountProvider,
  MmrChangeRequestAdminDto,
  MmrChangeRequestDto,
  CreateMmrChangeRequest,
  PlayerMmrDto,
  TeamDto,
  TournamentTeamDto,
  SeasonDto,
  TournamentDto,
  BracketDto,
  CreateSeasonRequest,
  UpdateSeasonRequest,
  CreateTournamentRequest,
  UpdateTournamentRequest,
  CreateTeamRequest,
  UpdateTeamRequest,
  TeamInviteDto,
  CreateInviteRequest,
  MatchDto,
  MatchRequestDto,
  CreateMatchRequestDto,
  PlayerAdminDto,
  AdminUpdatePlayerRequest,
  UpdateMatchRequest,
  SeasonChampionDto,
  PlayerHistoryDto,
  TeamHistoryDto,
} from './api/types';

export const qk = {
  session: ['session'] as const,
  me: ['me'] as const,
  player: (id: string) => ['player', id] as const,
  seasons: (params: SeasonsPageParams) => ['seasons', params] as const,
  seasonCurrent: ['seasonCurrent'] as const,
  season: (slug: string) => ['season', slug] as const,
  tournament: (slug: string) => ['tournament', slug] as const,
  tournamentTeams: (id: string) => ['tournament', id, 'teams'] as const,
  tournamentMatches: (id: string, params: TournamentMatchesParams) =>
    ['tournament', id, 'matches', params] as const,
  bracket: (id: string) => ['tournament', id, 'bracket'] as const,
  teams: (params: TeamsPageParams) => ['teams', params] as const,
  team: (id: string) => ['team', id] as const,
  adminMmr: ['adminMmr'] as const,
  adminMmrPage: (params: AdminMmrRequestsParams) =>
    ['adminMmr', params] as const,
  lobbies: (params: LobbiesPageParams) => ['lobbies', params] as const,
  myInvites: (params: MyInvitesPageParams) =>
    ['myInvites', params] as const,
  match: (id: string) => ['match', id] as const,
  adminPlayers: ['adminPlayers'] as const,
  adminPlayersPage: (params: AdminPlayersPageParams) =>
    ['adminPlayers', params] as const,
  adminAudit: (params: AdminAuditPageParams) =>
    ['adminAudit', params] as const,
  teamInvites: (teamId: string) => ['team', teamId, 'invites'] as const,
  playersPage: (params: PlayersPageParams) => ['players', params] as const,
  seasonChampions: (slug: string) =>
    ['season', slug, 'champions'] as const,
  playerHistory: (id: string) => ['player', id, 'history'] as const,
  teamHistory: (id: string) => ['team', id, 'history'] as const,
};

export function useSession(): UseQueryResult<SessionDto | null> {
  return useQuery({
    queryKey: qk.session,
    queryFn: getSession,
    staleTime: 60_000,
    retry: 0,
  });
}

export function useMe(): UseQueryResult<MeDto> {
  return useQuery({
    queryKey: qk.me,
    queryFn: getMe,
  });
}

export function usePlayer(id: string | undefined) {
  return useQuery({
    queryKey: id ? qk.player(id) : ['player', 'none'],
    queryFn: () => getPlayer(id!),
    enabled: Boolean(id),
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation<MeDto, Error, Partial<UpdateMeRequest>>({
    mutationFn: updateMe,
    onSuccess: (me) => {
      qc.setQueryData(qk.me, me);
      qc.invalidateQueries({ queryKey: qk.session });
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation<AttachmentDto, Error, File>({
    mutationFn: uploadAvatar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.me });
      qc.invalidateQueries({ queryKey: qk.session });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: logout,
    onSuccess: () => {
      qc.setQueryData(qk.session, null);
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export function useUnlinkProvider() {
  const qc = useQueryClient();
  return useMutation<void, Error, Lowercase<AccountProvider>>({
    mutationFn: unlinkProvider,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

// ──────────────── Seasons ────────────────

export function useSeasonsList(params: SeasonsPageParams = {}) {
  return useQuery({
    queryKey: qk.seasons(params),
    queryFn: () => getSeasonsPage(params),
  });
}

export function useCurrentSeason() {
  return useQuery({
    queryKey: qk.seasonCurrent,
    queryFn: getCurrentSeason,
    staleTime: 60_000,
    retry: 0,
  });
}

export function useSeason(slug: string | undefined) {
  return useQuery({
    queryKey: slug ? qk.season(slug) : ['season', 'none'],
    queryFn: () => getSeasonBySlug(slug!),
    enabled: Boolean(slug),
  });
}

// ──────────────── Tournaments ────────────────

export function useTournament(slug: string | undefined) {
  return useQuery({
    queryKey: slug ? qk.tournament(slug) : ['tournament', 'none'],
    queryFn: () => getTournamentBySlug(slug!),
    enabled: Boolean(slug),
  });
}

export function useTournamentTeams(id: string | undefined) {
  return useQuery({
    queryKey: id ? qk.tournamentTeams(id) : ['tournament', 'none', 'teams'],
    queryFn: () => getTournamentTeams(id!),
    enabled: Boolean(id),
  });
}

export function useTournamentMatches(
  id: string | undefined,
  params: TournamentMatchesParams = {},
) {
  return useQuery({
    queryKey: id
      ? qk.tournamentMatches(id, params)
      : ['tournament', 'none', 'matches', params],
    queryFn: () => getTournamentMatchesPage(id!, params),
    enabled: Boolean(id),
  });
}

export function useBracket(id: string | undefined) {
  return useQuery({
    queryKey: id ? qk.bracket(id) : ['tournament', 'none', 'bracket'],
    queryFn: () => getTournamentBracket(id!),
    enabled: Boolean(id),
  });
}

export function useRegisterTournament() {
  const qc = useQueryClient();
  return useMutation<
    TournamentTeamDto,
    Error,
    { tournamentId: string; teamId: string }
  >({
    mutationFn: ({ tournamentId, teamId }) =>
      registerTeamForTournament(tournamentId, teamId),
    onSuccess: (_data, { tournamentId }) => {
      qc.invalidateQueries({ queryKey: ['tournament'] });
      qc.invalidateQueries({ queryKey: ['tournament', tournamentId, 'teams'] });
    },
  });
}

// ──────────────── Teams ────────────────

export function useTeamsList(params: TeamsPageParams = {}) {
  return useQuery({
    queryKey: qk.teams(params),
    queryFn: () => getTeamsPage(params),
  });
}

export function useTeam(id: string | undefined) {
  return useQuery({
    queryKey: id ? qk.team(id) : ['team', 'none'],
    queryFn: () => getTeamById(id!),
    enabled: Boolean(id),
  });
}

export function useDisbandTeam() {
  const qc = useQueryClient();
  return useMutation<TeamDto, Error, string>({
    mutationFn: disbandTeam,
    onSuccess: (team) => {
      qc.invalidateQueries({ queryKey: qk.team(team.id) });
      qc.invalidateQueries({ queryKey: ['teams'] });
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export function useTransferCaptaincy() {
  const qc = useQueryClient();
  return useMutation<
    TeamDto,
    Error,
    { teamId: string; newCaptainPlayerId: string }
  >({
    mutationFn: ({ teamId, newCaptainPlayerId }) =>
      transferCaptaincy(teamId, newCaptainPlayerId),
    onSuccess: (team) => {
      qc.invalidateQueries({ queryKey: qk.team(team.id) });
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

// ──────────────── Team invites (captain side) ────────────────

export function useTeamInvites(teamId: string | undefined) {
  return useQuery({
    queryKey: teamId ? qk.teamInvites(teamId) : ['team', 'none', 'invites'],
    queryFn: () => listTeamInvites(teamId!),
    enabled: Boolean(teamId),
  });
}

export function useCreateTeamInvite() {
  const qc = useQueryClient();
  return useMutation<
    TeamInviteDto,
    Error,
    { teamId: string; body: CreateInviteRequest }
  >({
    mutationFn: ({ teamId, body }) => createTeamInvite(teamId, body),
    onSuccess: (_inv, { teamId }) => {
      qc.invalidateQueries({ queryKey: qk.teamInvites(teamId) });
    },
  });
}

export function useCancelTeamInvite() {
  const qc = useQueryClient();
  return useMutation<void, Error, { teamId: string; inviteId: string }>({
    mutationFn: ({ teamId, inviteId }) => cancelTeamInvite(teamId, inviteId),
    onSuccess: (_v, { teamId }) => {
      qc.invalidateQueries({ queryKey: qk.teamInvites(teamId) });
    },
  });
}

export function useLeaveTeamMember() {
  const qc = useQueryClient();
  return useMutation<TeamDto, Error, { teamId: string; playerId: string }>({
    mutationFn: ({ teamId, playerId }) => leaveTeamMember(teamId, playerId),
    onSuccess: (team) => {
      qc.invalidateQueries({ queryKey: qk.team(team.id) });
      qc.invalidateQueries({ queryKey: ['teams'] });
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

// ──────────────── Players (search) ────────────────

export function usePlayersSearch(params: PlayersPageParams) {
  return useQuery({
    queryKey: qk.playersPage(params),
    queryFn: () => getPlayersPage(params),
    enabled: Boolean(params.q && params.q.length >= 2),
  });
}

// ──────────────── MMR Admin ────────────────

export function useAdminMmrRequests(params: AdminMmrRequestsParams = {}) {
  return useQuery({
    queryKey: qk.adminMmrPage(params),
    queryFn: () => getAdminMmrRequestsPage(params),
  });
}

export function useApproveMmrRequest() {
  const qc = useQueryClient();
  return useMutation<
    MmrChangeRequestAdminDto,
    Error,
    { id: string; comment?: string }
  >({
    mutationFn: ({ id, comment }) => approveMmrRequest(id, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.adminMmr });
    },
  });
}

export function useRejectMmrRequest() {
  const qc = useQueryClient();
  return useMutation<
    MmrChangeRequestAdminDto,
    Error,
    { id: string; comment: string }
  >({
    mutationFn: ({ id, comment }) => rejectMmrRequest(id, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.adminMmr });
    },
  });
}

// ──────────────── MMR (self) ────────────────

export function useRefreshMyMmr() {
  const qc = useQueryClient();
  return useMutation<PlayerMmrDto, Error, void>({
    mutationFn: () => refreshMyMmr(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export function useCreateMyMmrChangeRequest() {
  const qc = useQueryClient();
  return useMutation<MmrChangeRequestDto, Error, CreateMmrChangeRequest>({
    mutationFn: (body) => createMyMmrChangeRequest(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

// ──────────────── Admin Seasons (mutations) ────────────────

function invalidateSeasonCaches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['seasons'] });
  qc.invalidateQueries({ queryKey: ['season'] });
  qc.invalidateQueries({ queryKey: qk.seasonCurrent });
}

export function useCreateSeason() {
  const qc = useQueryClient();
  return useMutation<SeasonDto, Error, CreateSeasonRequest>({
    mutationFn: createSeason,
    onSuccess: () => invalidateSeasonCaches(qc),
  });
}

export function useUpdateSeason() {
  const qc = useQueryClient();
  return useMutation<
    SeasonDto,
    Error,
    { id: string; patch: UpdateSeasonRequest }
  >({
    mutationFn: ({ id, patch }) => updateSeason(id, patch),
    onSuccess: () => invalidateSeasonCaches(qc),
  });
}

export function useStartSeason() {
  const qc = useQueryClient();
  return useMutation<SeasonDto, Error, string>({
    mutationFn: startSeason,
    onSuccess: () => invalidateSeasonCaches(qc),
  });
}

export function useFinishSeason() {
  const qc = useQueryClient();
  return useMutation<SeasonDto, Error, string>({
    mutationFn: finishSeason,
    onSuccess: () => invalidateSeasonCaches(qc),
  });
}

// ──────────────── Admin Tournaments (mutations) ────────────────

function invalidateTournamentCaches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['tournament'] });
  qc.invalidateQueries({ queryKey: ['season'] });
  qc.invalidateQueries({ queryKey: ['seasons'] });
}

export function useCreateTournament() {
  const qc = useQueryClient();
  return useMutation<TournamentDto, Error, CreateTournamentRequest>({
    mutationFn: createTournament,
    onSuccess: () => invalidateTournamentCaches(qc),
  });
}

export function useUpdateTournament() {
  const qc = useQueryClient();
  return useMutation<
    TournamentDto,
    Error,
    { id: string; patch: UpdateTournamentRequest }
  >({
    mutationFn: ({ id, patch }) => updateTournament(id, patch),
    onSuccess: () => invalidateTournamentCaches(qc),
  });
}

export function useOpenTournamentRegistration() {
  const qc = useQueryClient();
  return useMutation<TournamentDto, Error, string>({
    mutationFn: openTournamentRegistration,
    onSuccess: () => invalidateTournamentCaches(qc),
  });
}

export function useCloseTournamentRegistration() {
  const qc = useQueryClient();
  return useMutation<TournamentDto, Error, string>({
    mutationFn: closeTournamentRegistration,
    onSuccess: () => invalidateTournamentCaches(qc),
  });
}

export function useStartTournament() {
  const qc = useQueryClient();
  return useMutation<TournamentDto, Error, string>({
    mutationFn: startTournament,
    onSuccess: () => invalidateTournamentCaches(qc),
  });
}

export function useFinishTournament() {
  const qc = useQueryClient();
  return useMutation<
    TournamentDto,
    Error,
    { id: string; winnerTeamId?: string }
  >({
    mutationFn: ({ id, winnerTeamId }) => finishTournament(id, winnerTeamId),
    onSuccess: () => invalidateTournamentCaches(qc),
  });
}

export function useGenerateBracket() {
  const qc = useQueryClient();
  return useMutation<BracketDto, Error, string>({
    mutationFn: generateBracket,
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: qk.bracket(id) });
      qc.invalidateQueries({ queryKey: ['tournament'] });
    },
  });
}

// ──────────────── Team authoring ────────────────

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation<TeamDto, Error, CreateTeamRequest>({
    mutationFn: createTeam,
    onSuccess: (team) => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      qc.invalidateQueries({ queryKey: qk.team(team.id) });
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation<
    TeamDto,
    Error,
    { id: string; body: UpdateTeamRequest }
  >({
    mutationFn: ({ id, body }) => updateTeam(id, body),
    onSuccess: (team) => {
      qc.invalidateQueries({ queryKey: qk.team(team.id) });
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

// ──────────────── Attachments ────────────────

export function useUploadAttachment() {
  return useMutation<
    AttachmentDto,
    Error,
    { file: File; kind: AttachmentKind }
  >({
    mutationFn: ({ file, kind }) => uploadAttachment(file, kind),
  });
}

// ──────────────── Lobbies (match-requests) ────────────────

export function useLobbies(params: LobbiesPageParams = {}) {
  return useQuery({
    queryKey: qk.lobbies(params),
    queryFn: () => listLobbies(params),
  });
}

export function useCreateLobby() {
  const qc = useQueryClient();
  return useMutation<MatchRequestDto, Error, CreateMatchRequestDto>({
    mutationFn: createLobby,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lobbies'] });
    },
  });
}

export function useAcceptLobby() {
  const qc = useQueryClient();
  return useMutation<MatchDto, Error, string>({
    mutationFn: acceptLobby,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lobbies'] });
    },
  });
}

export function useCancelLobby() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: cancelLobby,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lobbies'] });
    },
  });
}

// ──────────────── My invites ────────────────

export function useMyInvites(
  params: MyInvitesPageParams = {},
  options: { enabled?: boolean } = {},
) {
  const { enabled = true } = options;
  return useQuery({
    queryKey: qk.myInvites(params),
    queryFn: () => listMyInvites(params),
    enabled,
    retry: 0,
  });
}

export function useAcceptInvite() {
  const qc = useQueryClient();
  return useMutation<TeamDto, Error, string>({
    mutationFn: acceptInvite,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myInvites'] });
      qc.invalidateQueries({ queryKey: qk.me });
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useDeclineInvite() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: declineInvite,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myInvites'] });
    },
  });
}

// ──────────────── Match (public) ────────────────

export function useMatch(id: string | undefined, pollMs?: number) {
  return useQuery({
    queryKey: id ? qk.match(id) : ['match', 'none'],
    queryFn: () => getMatch(id!),
    enabled: Boolean(id),
    refetchInterval: pollMs ?? false,
  });
}

export function useMarkMatchReady() {
  const qc = useQueryClient();
  return useMutation<MatchDto, Error, string>({
    mutationFn: (matchId) => markMatchReady(matchId),
    onSuccess: (m) => {
      qc.setQueryData(qk.match(m.id), m);
      qc.invalidateQueries({ queryKey: qk.match(m.id) });
    },
  });
}

export function useMarkMatchUnready() {
  const qc = useQueryClient();
  return useMutation<MatchDto, Error, string>({
    mutationFn: (matchId) => markMatchUnready(matchId),
    onSuccess: (m) => {
      qc.setQueryData(qk.match(m.id), m);
      qc.invalidateQueries({ queryKey: qk.match(m.id) });
    },
  });
}

export function useRecreateLobby() {
  const qc = useQueryClient();
  return useMutation<MatchDto, Error, string>({
    mutationFn: (matchId) => recreateLobby(matchId),
    onSuccess: (m) => {
      qc.setQueryData(qk.match(m.id), m);
      qc.invalidateQueries({ queryKey: qk.match(m.id) });
    },
  });
}

// ──────────────── Admin players ────────────────

export function useAdminPlayers(params: AdminPlayersPageParams = {}) {
  return useQuery({
    queryKey: qk.adminPlayersPage(params),
    queryFn: () => getAdminPlayersPage(params),
  });
}

export function useUpdateAdminPlayer() {
  const qc = useQueryClient();
  return useMutation<
    PlayerAdminDto,
    Error,
    { id: string; patch: AdminUpdatePlayerRequest }
  >({
    mutationFn: ({ id, patch }) => updateAdminPlayer(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.adminPlayers });
    },
  });
}

export function useBanAdminPlayer() {
  const qc = useQueryClient();
  return useMutation<PlayerAdminDto, Error, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) => banAdminPlayer(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.adminPlayers });
    },
  });
}

export function useUnbanAdminPlayer() {
  const qc = useQueryClient();
  return useMutation<PlayerAdminDto, Error, string>({
    mutationFn: unbanAdminPlayer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.adminPlayers });
    },
  });
}

// ──────────────── Admin audit ────────────────

export function useAdminAudit(params: AdminAuditPageParams = {}) {
  return useQuery({
    queryKey: qk.adminAudit(params),
    queryFn: () => getAdminAuditPage(params),
  });
}

// ──────────────── Admin match update ────────────────

export function useUpdateAdminMatch() {
  const qc = useQueryClient();
  return useMutation<
    MatchDto,
    Error,
    { id: string; patch: UpdateMatchRequest }
  >({
    mutationFn: ({ id, patch }) => updateAdminMatch(id, patch),
    onSuccess: (m) => {
      qc.setQueryData(qk.match(m.id), m);
      qc.invalidateQueries({ queryKey: qk.match(m.id) });
      qc.invalidateQueries({ queryKey: ['tournament'] });
    },
  });
}

// ──────────────── Archive / History (Stage 9) ────────────────

export function useSeasonChampions(slug: string | undefined) {
  return useQuery<SeasonChampionDto[]>({
    queryKey: slug ? qk.seasonChampions(slug) : ['season', 'none', 'champions'],
    queryFn: () => getSeasonChampions(slug!),
    enabled: Boolean(slug),
  });
}

export function usePlayerHistory(id: string | undefined) {
  return useQuery<PlayerHistoryDto>({
    queryKey: id ? qk.playerHistory(id) : ['player', 'none', 'history'],
    queryFn: () => getPlayerHistory(id!),
    enabled: Boolean(id),
  });
}

export function useTeamHistory(id: string | undefined) {
  return useQuery<TeamHistoryDto>({
    queryKey: id ? qk.teamHistory(id) : ['team', 'none', 'history'],
    queryFn: () => getTeamHistory(id!),
    enabled: Boolean(id),
  });
}

export type { PlayerPublicDto, TeamInviteDto };
