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
  hideTournament,
  unhideTournament,
  generateBracket,
  getTournamentEligibility,
  putTournamentEligibility,
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
  getMatchLive,
  getMatchResult,
  markMatchReady,
  markMatchUnready,
  inviteMe,
  recreateLobby,
  launchLobby,
  finishMatch,
  repropagateMatch,
  techResultMatch,
  cancelMatchResult,
  moveMatchTeams,
  changeMatchFormat,
  getAdminPlayersPage,
  getAdminTeamsPage,
  hideTeam,
  unhideTeam,
  createAdminPlayer,
  updateAdminPlayer,
  banAdminPlayer,
  unbanAdminPlayer,
  setAdminPlayerFemaleVerified,
  getAdminAuditPage,
  listAdminBots,
  adminBotLeaveLobby,
  adminBotGcRehello,
  adminBotSteamReconnect,
  updateAdminMatch,
  getSeasonChampions,
  getPlayerHistory,
  getTeamHistory,
  listOpenLobbies,
  getOpenLobby,
  createOpenLobby,
  joinOpenLobbySlot,
  leaveOpenLobby,
  confirmOpenLobby,
  startOpenLobby,
  cancelOpenLobby,
  getLeaderboardPage,
  getPlayerRating,
  getPlayerMatches,
  getPlayerStats,
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type LeaderboardPageParams,
  type PlayerMatchesPageParams,
  type SeasonsPageParams,
  type TournamentMatchesParams,
  type AdminMmrRequestsParams,
  type LobbiesPageParams,
  type MyInvitesPageParams,
  type AdminPlayersPageParams,
  type AdminTeamsPageParams,
  type AdminAuditPageParams,
  type PlayersPageParams,
  type OpenLobbiesPageParams,
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
  TournamentEligibilityDto,
  CreateTeamRequest,
  UpdateTeamRequest,
  TeamInviteDto,
  CreateInviteRequest,
  MatchDto,
  InviteResultDto,
  MatchLiveSnapshotDto,
  MatchResultDto,
  MatchRequestDto,
  CreateMatchRequestDto,
  PlayerAdminDto,
  AdminUpdatePlayerRequest,
  AdminCreatePlayerRequest,
  UpdateMatchRequest,
  TechResultRequest,
  MoveTeamsRequest,
  ChangeFormatRequest,
  SeasonChampionDto,
  PlayerHistoryDto,
  TeamHistoryDto,
  OpenLobbyDto,
  CreateOpenLobbyRequest,
  BotStatusDto,
  LeaderboardEntryDto,
  PlayerRatingDto,
  PlayerStatsDto,
} from './api/types';

export const qk = {
  session: ['session'] as const,
  me: ['me'] as const,
  player: (id: string) => ['player', id] as const,
  seasons: (params: SeasonsPageParams) => ['seasons', params] as const,
  seasonCurrent: ['seasonCurrent'] as const,
  season: (slug: string) => ['season', slug] as const,
  tournament: (slug: string) => ['tournament', slug] as const,
  tournamentTeams: (id: string, verifiedOnly = false) =>
    ['tournament', id, 'teams', { verifiedOnly }] as const,
  tournamentMatches: (id: string, params: TournamentMatchesParams) =>
    ['tournament', id, 'matches', params] as const,
  bracket: (id: string) => ['tournament', id, 'bracket'] as const,
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
  adminTeams: (params: AdminTeamsPageParams) =>
    ['admin-teams', params] as const,
  adminAudit: (params: AdminAuditPageParams) =>
    ['adminAudit', params] as const,
  adminBots: ['adminBots'] as const,
  teamInvites: (teamId: string) => ['team', teamId, 'invites'] as const,
  playersPage: (params: PlayersPageParams) => ['players', params] as const,
  seasonChampions: (slug: string) =>
    ['season', slug, 'champions'] as const,
  playerHistory: (id: string) => ['player', id, 'history'] as const,
  teamHistory: (id: string) => ['team', id, 'history'] as const,
  openLobbies: (params: OpenLobbiesPageParams) =>
    ['open-lobbies', params] as const,
  openLobby: (id: string) => ['open-lobby', id] as const,
  leaderboard: (params: LeaderboardPageParams) =>
    ['leaderboard', params] as const,
  playerRating: (id: string) => ['player', id, 'rating'] as const,
  playerMatches: (id: string, params: PlayerMatchesPageParams) =>
    ['player', id, 'matches', params] as const,
  playerStats: (id: string) => ['player', id, 'stats'] as const,
  notificationsUnread: ['notifications', 'unread'] as const,
  notificationsList: (page: number, size: number) =>
    ['notifications', 'list', page, size] as const,
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
    staleTime: 5 * 60_000,
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

export function useTournamentTeams(
  id: string | undefined,
  verifiedOnly = false,
) {
  return useQuery({
    queryKey: id
      ? qk.tournamentTeams(id, verifiedOnly)
      : ['tournament', 'none', 'teams', { verifiedOnly }],
    queryFn: () => getTournamentTeams(id!, verifiedOnly),
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

export function useTeam(id: string | undefined) {
  return useQuery({
    queryKey: id ? qk.team(id) : ['team', 'none'],
    queryFn: () => getTeamById(id!),
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
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

export function useHideTournament() {
  const qc = useQueryClient();
  return useMutation<TournamentDto, Error, string>({
    mutationFn: hideTournament,
    onSuccess: () => invalidateTournamentCaches(qc),
  });
}

export function useUnhideTournament() {
  const qc = useQueryClient();
  return useMutation<TournamentDto, Error, string>({
    mutationFn: unhideTournament,
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

// Tournament eligibility rules — admin GET/PUT.
export function useTournamentEligibility(
  tournamentId: string | null | undefined,
) {
  return useQuery({
    queryKey: ['tournament-eligibility', tournamentId],
    queryFn: () => getTournamentEligibility(tournamentId as string),
    enabled: !!tournamentId,
  });
}

export function useUpdateTournamentEligibility() {
  const qc = useQueryClient();
  return useMutation<
    TournamentEligibilityDto,
    Error,
    { id: string; body: TournamentEligibilityDto }
  >({
    mutationFn: ({ id, body }) => putTournamentEligibility(id, body),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['tournament-eligibility', id] });
      // Violations on registered teams are recomputed server-side; invalidate
      // anything that may render them.
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

export function useMatchLive(
  id: string | undefined,
  enabled: boolean,
): UseQueryResult<MatchLiveSnapshotDto | null> {
  return useQuery({
    queryKey: ['match-live', id],
    enabled: !!id && enabled,
    queryFn: () => getMatchLive(id!),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
}

export function useMatchResult(
  id: string | undefined,
  enabled: boolean,
  gameNumber?: number,
): UseQueryResult<MatchResultDto> {
  return useQuery({
    queryKey: ['match-result', id, gameNumber ?? 'latest'],
    enabled: !!id && enabled,
    queryFn: () => getMatchResult(id!, gameNumber),
    staleTime: Infinity,
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

export function useInviteMe() {
  // Returns an InviteResultDto (invited + cooldownRemainingMs) rather than the
  // match itself — no query cache to update. Errors surface via ProblemDetailError.
  return useMutation<InviteResultDto, Error, string>({
    mutationFn: (matchId) => inviteMe(matchId),
  });
}

export function useRecreateLobby() {
  const qc = useQueryClient();
  return useMutation<MatchDto, Error, string>({
    mutationFn: (matchId) => recreateLobby(matchId),
    onSuccess: (m) => {
      qc.setQueryData(qk.match(m.id), m);
      qc.invalidateQueries({ queryKey: qk.match(m.id) });
      qc.invalidateQueries({ queryKey: ['tournament'] });
    },
  });
}

export function useLaunchLobby() {
  const qc = useQueryClient();
  return useMutation<MatchDto, Error, string>({
    mutationFn: (matchId) => launchLobby(matchId),
    onSuccess: (m) => {
      qc.setQueryData(qk.match(m.id), m);
      qc.invalidateQueries({ queryKey: qk.match(m.id) });
      qc.invalidateQueries({ queryKey: ['tournament'] });
    },
  });
}

export function useFinishMatch() {
  const qc = useQueryClient();
  return useMutation<
    MatchDto,
    Error,
    { id: string; winnerTeamId: string; scoreA: number; scoreB: number }
  >({
    mutationFn: ({ id, winnerTeamId, scoreA, scoreB }) =>
      finishMatch(id, { winnerTeamId, scoreA, scoreB }),
    onSuccess: (m) => {
      qc.setQueryData(qk.match(m.id), m);
      qc.invalidateQueries({ queryKey: qk.match(m.id) });
      // propagateWinner may have mutated the next-round shell, and both
      // qk.bracket / qk.tournamentMatches start with ['tournament', ...],
      // so a single prefix invalidation catches them.
      qc.invalidateQueries({ queryKey: ['tournament'] });
      // AdminMatchesPage uses this raw key, not via qk.
      qc.invalidateQueries({ queryKey: ['admin-tournament-matches'] });
    },
  });
}

export function useRepropagateMatch() {
  const qc = useQueryClient();
  return useMutation<MatchDto, Error, string>({
    mutationFn: repropagateMatch,
    onSuccess: (m) => {
      qc.setQueryData(qk.match(m.id), m);
      qc.invalidateQueries({ queryKey: qk.match(m.id) });
      qc.invalidateQueries({ queryKey: ['tournament'] });
      qc.invalidateQueries({ queryKey: ['admin-tournament-matches'] });
    },
  });
}

// Shared invalidation for any admin op that may mutate the bracket.
function invalidateMatchAndBracket(
  qc: ReturnType<typeof useQueryClient>,
  m: MatchDto,
) {
  qc.setQueryData(qk.match(m.id), m);
  qc.invalidateQueries({ queryKey: qk.match(m.id) });
  qc.invalidateQueries({ queryKey: ['tournament'] });
  qc.invalidateQueries({ queryKey: ['admin-tournament-matches'] });
}

export function useTechResultMatch() {
  const qc = useQueryClient();
  return useMutation<MatchDto, Error, { id: string; body: TechResultRequest }>({
    mutationFn: ({ id, body }) => techResultMatch(id, body),
    onSuccess: (m) => invalidateMatchAndBracket(qc, m),
  });
}

export function useCancelMatchResult() {
  const qc = useQueryClient();
  return useMutation<MatchDto, Error, string>({
    mutationFn: cancelMatchResult,
    onSuccess: (m) => invalidateMatchAndBracket(qc, m),
  });
}

export function useMoveMatchTeams() {
  const qc = useQueryClient();
  return useMutation<MatchDto, Error, { id: string; body: MoveTeamsRequest }>({
    mutationFn: ({ id, body }) => moveMatchTeams(id, body),
    onSuccess: (m) => invalidateMatchAndBracket(qc, m),
  });
}

export function useChangeMatchFormat() {
  const qc = useQueryClient();
  return useMutation<MatchDto, Error, { id: string; body: ChangeFormatRequest }>(
    {
      mutationFn: ({ id, body }) => changeMatchFormat(id, body),
      onSuccess: (m) => invalidateMatchAndBracket(qc, m),
    },
  );
}

// ──────────────── Admin players ────────────────

export function useAdminPlayers(params: AdminPlayersPageParams = {}) {
  return useQuery({
    queryKey: qk.adminPlayersPage(params),
    queryFn: () => getAdminPlayersPage(params),
  });
}

export function useCreateAdminPlayer() {
  const qc = useQueryClient();
  return useMutation<PlayerAdminDto, Error, AdminCreatePlayerRequest>({
    mutationFn: (body) => createAdminPlayer(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.adminPlayers });
    },
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

export function useSetAdminPlayerFemaleVerified() {
  const qc = useQueryClient();
  return useMutation<
    PlayerAdminDto,
    Error,
    { id: string; verified: boolean }
  >({
    mutationFn: ({ id, verified }) =>
      setAdminPlayerFemaleVerified(id, verified),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: qk.adminPlayers });
      qc.invalidateQueries({ queryKey: qk.player(vars.id) });
    },
  });
}

// ──────────────── Admin teams ────────────────

function invalidateAdminTeamCaches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['teams'] });
  qc.invalidateQueries({ queryKey: ['team'] });
  qc.invalidateQueries({ queryKey: ['admin-teams'] });
}

export function useAdminTeams(params: AdminTeamsPageParams = {}) {
  return useQuery({
    queryKey: qk.adminTeams(params),
    queryFn: () => getAdminTeamsPage(params),
  });
}

export function useHideTeam() {
  const qc = useQueryClient();
  return useMutation<TeamDto, Error, string>({
    mutationFn: hideTeam,
    onSuccess: () => invalidateAdminTeamCaches(qc),
  });
}

export function useUnhideTeam() {
  const qc = useQueryClient();
  return useMutation<TeamDto, Error, string>({
    mutationFn: unhideTeam,
    onSuccess: () => invalidateAdminTeamCaches(qc),
  });
}

// ──────────────── Admin audit ────────────────

export function useAdminAudit(params: AdminAuditPageParams = {}) {
  return useQuery({
    queryKey: qk.adminAudit(params),
    queryFn: () => getAdminAuditPage(params),
  });
}

// ──────────────── Admin: Dota bots ────────────────

export function useAdminBots() {
  return useQuery<BotStatusDto[]>({
    queryKey: qk.adminBots,
    queryFn: listAdminBots,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
}

export function useAdminBotLeaveLobby() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: adminBotLeaveLobby,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminBots }),
  });
}

export function useAdminBotGcRehello() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: adminBotGcRehello,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminBots }),
  });
}

export function useAdminBotSteamReconnect() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: adminBotSteamReconnect,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminBots }),
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

// ──────────────── Open Lobbies ────────────────

function invalidateOpenLobbies(
  qc: ReturnType<typeof useQueryClient>,
  id?: string,
) {
  qc.invalidateQueries({ queryKey: ['open-lobbies'] });
  if (id) {
    qc.invalidateQueries({ queryKey: qk.openLobby(id) });
  }
}

export function useOpenLobbies(params: OpenLobbiesPageParams = {}) {
  return useQuery({
    queryKey: qk.openLobbies(params),
    queryFn: () => listOpenLobbies(params),
    refetchInterval: 4000,
    refetchIntervalInBackground: false,
  });
}

export function useOpenLobby(id: string | undefined) {
  return useQuery({
    queryKey: qk.openLobby(id ?? ''),
    queryFn: () => getOpenLobby(id!),
    enabled: !!id,
    refetchInterval: 2000,
    refetchIntervalInBackground: false,
  });
}

export function useCreateOpenLobby() {
  const qc = useQueryClient();
  return useMutation<OpenLobbyDto, Error, CreateOpenLobbyRequest>({
    mutationFn: createOpenLobby,
    onSuccess: (lobby) => {
      qc.setQueryData(qk.openLobby(lobby.id), lobby);
      invalidateOpenLobbies(qc);
    },
  });
}

export function useJoinOpenLobbySlot() {
  const qc = useQueryClient();
  return useMutation<
    OpenLobbyDto,
    Error,
    { id: string; slotIndex: number }
  >({
    mutationFn: ({ id, slotIndex }) => joinOpenLobbySlot(id, slotIndex),
    onSuccess: (lobby) => {
      qc.setQueryData(qk.openLobby(lobby.id), lobby);
      invalidateOpenLobbies(qc, lobby.id);
    },
  });
}

export function useLeaveOpenLobby() {
  const qc = useQueryClient();
  return useMutation<OpenLobbyDto, Error, string>({
    mutationFn: leaveOpenLobby,
    onSuccess: (lobby) => {
      qc.setQueryData(qk.openLobby(lobby.id), lobby);
      invalidateOpenLobbies(qc, lobby.id);
    },
  });
}

export function useConfirmOpenLobby() {
  const qc = useQueryClient();
  return useMutation<OpenLobbyDto, Error, string>({
    mutationFn: confirmOpenLobby,
    onSuccess: (lobby) => {
      qc.setQueryData(qk.openLobby(lobby.id), lobby);
      invalidateOpenLobbies(qc, lobby.id);
    },
  });
}

export function useStartOpenLobby() {
  const qc = useQueryClient();
  return useMutation<OpenLobbyDto, Error, string>({
    mutationFn: startOpenLobby,
    onSuccess: (lobby) => {
      qc.setQueryData(qk.openLobby(lobby.id), lobby);
      invalidateOpenLobbies(qc, lobby.id);
    },
  });
}

export function useCancelOpenLobby() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: cancelOpenLobby,
    onSuccess: (_v, id) => {
      invalidateOpenLobbies(qc, id);
    },
  });
}

// ──────────────── Internal player rating ────────────────

export function useLeaderboard(params: LeaderboardPageParams = {}) {
  return useQuery({
    queryKey: qk.leaderboard(params),
    queryFn: () => getLeaderboardPage(params),
    staleTime: 60_000,
  });
}

export function usePlayerRating(id: string | undefined) {
  return useQuery({
    queryKey: id ? qk.playerRating(id) : ['player', 'none', 'rating'],
    queryFn: () => getPlayerRating(id!),
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
  });
}

// ──────────────── Player match history & stats ────────────────

export function usePlayerMatches(
  id: string | undefined,
  params: PlayerMatchesPageParams = {},
) {
  return useQuery({
    queryKey: id
      ? qk.playerMatches(id, params)
      : ['player', 'none', 'matches', params],
    queryFn: () => getPlayerMatches(id!, params),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function usePlayerStats(
  id: string | undefined,
): UseQueryResult<PlayerStatsDto> {
  return useQuery({
    queryKey: id ? qk.playerStats(id) : ['player', 'none', 'stats'],
    queryFn: () => getPlayerStats(id!),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

// ──────────────── Notifications ────────────────

export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: qk.notificationsUnread,
    queryFn: getUnreadCount,
    enabled,
    staleTime: 30_000,
  });
}

export function useNotifications(page = 0, size = 20, enabled = true) {
  return useQuery({
    queryKey: qk.notificationsList(page, size),
    queryFn: () => getNotifications(page, size),
    enabled,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notificationsUnread });
      qc.invalidateQueries({ queryKey: ['notifications', 'list'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notificationsUnread });
      qc.invalidateQueries({ queryKey: ['notifications', 'list'] });
    },
  });
}

export type { PlayerPublicDto, TeamInviteDto, LeaderboardEntryDto, PlayerRatingDto };
