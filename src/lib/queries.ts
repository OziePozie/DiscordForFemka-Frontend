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
  getAdminTournamentTeams,
  adminRegisterTeam,
  approveTournamentTeam,
  rejectTournamentTeam,
  getTournamentMatchesPage,
  getTournamentBracket,
  assignBracketCell,
  getTournamentStages,
  getTournamentStandings,
  generateStages,
  moveTeamGroup,
  generatePlayoff,
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
  changeTeamMemberRole,
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
  registerForMix,
  withdrawFromMix,
  checkInForMix,
  listMixPlayers,
  getMyMixEntry,
  adminListMixPlayers,
  adminApproveMixPlayer,
  adminRejectMixPlayer,
  type MixPlayersPageParams,
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
  refetchMatchResult,
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
  listAdminLobbies,
  adminKickLobbyPlayer,
  adminBotGcRehello,
  adminBotSteamReconnect,
  updateAdminMatch,
  getSeasonChampions,
  getPlayerHistory,
  getPlayerAchievements,
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
  getHeroGroupsPage,
  createHeroGroup,
  updateHeroGroup,
  deleteHeroGroup,
  getDotaHeroesCatalog,
  getAchievementsPage,
  createAchievement,
  updateAchievement,
  replaceAchievementConditions,
  publishAchievement,
  archiveAchievement,
  getTournamentQuestsPage,
  createQuest,
  updateQuest,
  replaceQuestConditions,
  publishQuest,
  archiveQuest,
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
  getAccessCodesPage,
  issueAccessCode,
  revokeAccessCode,
  type AccessCodesPageParams,
  type HeroGroupsPageParams,
  type AchievementsPageParams,
  type QuestsPageParams,
} from './api/endpoints';
import type {
  AccessCodeDto,
  IssuedCodeDto,
  IssueCodeRequest,
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
  TeamMemberRole,
  TournamentTeamDto,
  SeasonDto,
  TournamentDto,
  BracketDto,
  TournamentStageDto,
  GroupStandingsDto,
  GenerateStagesRequest,
  CreateSeasonRequest,
  UpdateSeasonRequest,
  CreateTournamentRequest,
  UpdateTournamentRequest,
  TournamentEligibilityDto,
  MixPlayerDto,
  MixPlayerAdminDto,
  MixRegisterRequest,
  CreateTeamRequest,
  UpdateTeamRequest,
  TeamInviteDto,
  CreateInviteRequest,
  MatchDto,
  InviteResultDto,
  MatchLiveSnapshotDto,
  MatchResultDto,
  RefetchResultDto,
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
  PlayerAchievementDto,
  TeamHistoryDto,
  OpenLobbyDto,
  CreateOpenLobbyRequest,
  BotStatusDto,
  AdminLobbyDto,
  LeaderboardEntryDto,
  PlayerRatingDto,
  PlayerStatsDto,
  HeroGroupDto,
  CreateHeroGroupRequest,
  UpdateHeroGroupRequest,
  DotaHeroDto,
  ConditionRowDto,
  AchievementDto,
  CreateAchievementRequest,
  UpdateAchievementRequest,
  QuestDto,
  CreateQuestRequest,
  UpdateQuestRequest,
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
  adminTournamentTeams: (id: string) =>
    ['admin', 'tournament', id, 'teams'] as const,
  tournamentMatches: (id: string, params: TournamentMatchesParams) =>
    ['tournament', id, 'matches', params] as const,
  bracket: (id: string) => ['tournament', id, 'bracket'] as const,
  stages: (id: string) => ['tournament', id, 'stages'] as const,
  standings: (id: string) => ['tournament', id, 'standings'] as const,
  mixPlayers: (tournamentId: string, params: MixPlayersPageParams) =>
    ['tournament', tournamentId, 'mix', 'players', params] as const,
  myMixEntry: (tournamentId: string) =>
    ['tournament', tournamentId, 'mix', 'me'] as const,
  adminMixPlayers: (tournamentId: string) =>
    ['admin', 'tournament', tournamentId, 'mix', 'players'] as const,
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
  adminLobbies: ['adminLobbies'] as const,
  adminCodes: ['adminCodes'] as const,
  adminCodesPage: (params: AccessCodesPageParams) =>
    ['adminCodes', params] as const,
  teamInvites: (teamId: string) => ['team', teamId, 'invites'] as const,
  playersPage: (params: PlayersPageParams) => ['players', params] as const,
  seasonChampions: (slug: string) =>
    ['season', slug, 'champions'] as const,
  playerHistory: (id: string) => ['player', id, 'history'] as const,
  playerAchievements: (id: string) => ['player-achievements', id] as const,
  teamHistory: (id: string) => ['team', id, 'history'] as const,
  openLobbies: (params: OpenLobbiesPageParams) =>
    ['open-lobbies', params] as const,
  openLobby: (id: string) => ['open-lobby', id] as const,
  leaderboard: (params: LeaderboardPageParams) =>
    ['leaderboard', params] as const,
  playerRating: (id: string, season: string) =>
    ['player', id, 'rating', season] as const,
  playerMatches: (id: string, params: PlayerMatchesPageParams) =>
    ['player', id, 'matches', params] as const,
  playerStats: (id: string) => ['player', id, 'stats'] as const,
  notificationsUnread: ['notifications', 'unread'] as const,
  notificationsList: (page: number, size: number, unreadOnly: boolean) =>
    ['notifications', 'list', page, size, unreadOnly] as const,
  heroGroups: (params: HeroGroupsPageParams) => ['hero-groups', params] as const,
  dotaHeroes: ['dota-heroes'] as const,
  achievements: (params: AchievementsPageParams) => ['achievements', params] as const,
  tournamentQuests: (tournamentId: string, params: QuestsPageParams) =>
    ['tournament-quests', tournamentId, params] as const,
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

// ──────────────── Hero groups & heroes catalog ────────────────

export function useHeroGroupsList(params: HeroGroupsPageParams = {}) {
  return useQuery({
    queryKey: qk.heroGroups(params),
    queryFn: () => getHeroGroupsPage(params),
  });
}

export function useDotaHeroesCatalog() {
  return useQuery({
    queryKey: qk.dotaHeroes,
    queryFn: getDotaHeroesCatalog,
    staleTime: Infinity, // static reference data, never changes at runtime
  });
}

function invalidateHeroGroupCaches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['hero-groups'] });
}

export function useCreateHeroGroup() {
  const qc = useQueryClient();
  return useMutation<HeroGroupDto, Error, CreateHeroGroupRequest>({
    mutationFn: createHeroGroup,
    onSuccess: () => invalidateHeroGroupCaches(qc),
  });
}

export function useUpdateHeroGroup() {
  const qc = useQueryClient();
  return useMutation<
    HeroGroupDto,
    Error,
    { id: string; patch: UpdateHeroGroupRequest }
  >({
    mutationFn: ({ id, patch }) => updateHeroGroup(id, patch),
    onSuccess: () => invalidateHeroGroupCaches(qc),
  });
}

export function useDeleteHeroGroup() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteHeroGroup,
    onSuccess: () => invalidateHeroGroupCaches(qc),
  });
}

// ──────────────── Achievements ────────────────

export function useAchievementsList(params: AchievementsPageParams = {}) {
  return useQuery({
    queryKey: qk.achievements(params),
    queryFn: () => getAchievementsPage(params),
  });
}

function invalidateAchievementCaches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['achievements'] });
}

export function useCreateAchievement() {
  const qc = useQueryClient();
  return useMutation<AchievementDto, Error, CreateAchievementRequest>({
    mutationFn: createAchievement,
    onSuccess: () => invalidateAchievementCaches(qc),
  });
}

export function useUpdateAchievement() {
  const qc = useQueryClient();
  return useMutation<
    AchievementDto,
    Error,
    { id: string; patch: UpdateAchievementRequest }
  >({
    mutationFn: ({ id, patch }) => updateAchievement(id, patch),
    onSuccess: () => invalidateAchievementCaches(qc),
  });
}

export function useReplaceAchievementConditions() {
  const qc = useQueryClient();
  return useMutation<
    AchievementDto,
    Error,
    { id: string; conditions: ConditionRowDto[] }
  >({
    mutationFn: ({ id, conditions }) => replaceAchievementConditions(id, conditions),
    onSuccess: () => invalidateAchievementCaches(qc),
  });
}

export function usePublishAchievement() {
  const qc = useQueryClient();
  return useMutation<AchievementDto, Error, string>({
    mutationFn: publishAchievement,
    onSuccess: () => invalidateAchievementCaches(qc),
  });
}

export function useArchiveAchievement() {
  const qc = useQueryClient();
  return useMutation<AchievementDto, Error, string>({
    mutationFn: archiveAchievement,
    onSuccess: () => invalidateAchievementCaches(qc),
  });
}

// ──────────────── Tournament quests ────────────────

export function useTournamentQuestsList(
  tournamentId: string | undefined,
  params: QuestsPageParams = {},
) {
  return useQuery({
    queryKey: tournamentId
      ? qk.tournamentQuests(tournamentId, params)
      : ['tournament-quests', 'none', params],
    queryFn: () => getTournamentQuestsPage(tournamentId!, params),
    enabled: Boolean(tournamentId),
  });
}

function invalidateQuestCaches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['tournament-quests'] });
}

export function useCreateQuest() {
  const qc = useQueryClient();
  return useMutation<
    QuestDto,
    Error,
    { tournamentId: string; body: CreateQuestRequest }
  >({
    mutationFn: ({ tournamentId, body }) => createQuest(tournamentId, body),
    onSuccess: () => invalidateQuestCaches(qc),
  });
}

export function useUpdateQuest() {
  const qc = useQueryClient();
  return useMutation<QuestDto, Error, { id: string; patch: UpdateQuestRequest }>({
    mutationFn: ({ id, patch }) => updateQuest(id, patch),
    onSuccess: () => invalidateQuestCaches(qc),
  });
}

export function useReplaceQuestConditions() {
  const qc = useQueryClient();
  return useMutation<
    QuestDto,
    Error,
    { id: string; conditions: ConditionRowDto[] }
  >({
    mutationFn: ({ id, conditions }) => replaceQuestConditions(id, conditions),
    onSuccess: () => invalidateQuestCaches(qc),
  });
}

export function usePublishQuest() {
  const qc = useQueryClient();
  return useMutation<QuestDto, Error, string>({
    mutationFn: publishQuest,
    onSuccess: () => invalidateQuestCaches(qc),
  });
}

export function useArchiveQuest() {
  const qc = useQueryClient();
  return useMutation<QuestDto, Error, string>({
    mutationFn: archiveQuest,
    onSuccess: () => invalidateQuestCaches(qc),
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

export function useAdminTournamentTeams(id: string | undefined) {
  return useQuery({
    queryKey: id
      ? qk.adminTournamentTeams(id)
      : ['admin', 'tournament', 'none', 'teams'],
    queryFn: () => getAdminTournamentTeams(id!),
    enabled: Boolean(id),
  });
}

export function useAdminRegisterTeam() {
  const qc = useQueryClient();
  return useMutation<
    TournamentTeamDto,
    Error,
    { tournamentId: string; teamId: string }
  >({
    mutationFn: ({ tournamentId, teamId }) =>
      adminRegisterTeam(tournamentId, teamId),
    onSuccess: (_d, { tournamentId }) => {
      qc.invalidateQueries({ queryKey: qk.adminTournamentTeams(tournamentId) });
      qc.invalidateQueries({ queryKey: ['tournament'] });
    },
  });
}

export function useApproveTournamentTeam() {
  const qc = useQueryClient();
  return useMutation<void, Error, { tournamentId: string; teamId: string }>({
    mutationFn: ({ tournamentId, teamId }) =>
      approveTournamentTeam(tournamentId, teamId),
    onSuccess: (_d, { tournamentId }) => {
      qc.invalidateQueries({ queryKey: qk.adminTournamentTeams(tournamentId) });
      qc.invalidateQueries({ queryKey: ['tournament'] });
    },
  });
}

export function useRejectTournamentTeam() {
  const qc = useQueryClient();
  return useMutation<
    void,
    Error,
    { tournamentId: string; teamId: string; reason?: string }
  >({
    mutationFn: ({ tournamentId, teamId, reason }) =>
      rejectTournamentTeam(tournamentId, teamId, { reason: reason ?? null }),
    onSuccess: (_d, { tournamentId }) => {
      qc.invalidateQueries({ queryKey: qk.adminTournamentTeams(tournamentId) });
      qc.invalidateQueries({ queryKey: ['tournament'] });
    },
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

export function useAssignBracketCell() {
  const qc = useQueryClient();
  return useMutation<
    MatchDto,
    Error,
    { tournamentId: string; body: Parameters<typeof assignBracketCell>[1] }
  >({
    mutationFn: ({ tournamentId, body }) => assignBracketCell(tournamentId, body),
    onSuccess: (_d, { tournamentId }) => {
      qc.invalidateQueries({ queryKey: qk.bracket(tournamentId) });
      qc.invalidateQueries({ queryKey: ['tournament', tournamentId] });
    },
  });
}

export function useStages(id: string | undefined) {
  return useQuery({
    queryKey: id ? qk.stages(id) : ['tournament', 'none', 'stages'],
    queryFn: () => getTournamentStages(id!),
    enabled: Boolean(id),
  });
}

export function useStandings(id: string | undefined) {
  return useQuery({
    queryKey: id ? qk.standings(id) : ['tournament', 'none', 'standings'],
    queryFn: () => getTournamentStandings(id!),
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

// ──────────────── MIX registration ────────────────

export function useMixPlayers(
  tournamentId: string | undefined,
  params: MixPlayersPageParams = {},
) {
  return useQuery({
    queryKey: tournamentId
      ? qk.mixPlayers(tournamentId, params)
      : ['tournament', 'none', 'mix', 'players', params],
    queryFn: () => listMixPlayers(tournamentId!, params),
    enabled: Boolean(tournamentId),
  });
}

// Своя заявка на MIX-турнир. 404 тут — ожидаемое состояние «не
// зарегистрирован», а не ошибка. В файле нет прецедента хука, который сам
// превращает ожидаемый 404 в null/undefined (useSession/useCurrentSeason
// решают другую задачу: там бэкенд отвечает 200 с пустым телом, а не кодом
// ошибки, поэтому там достаточно `data ?? null` в самой api-функции). Здесь
// endpoints.getMyMixEntry() специально не глотает 404 — оставляем retry
// выключенным и даём вызывающей стороне самой отличить "ещё не пришёл ответ"
// от "точно не зарегистрирован" через isError/error (ProblemDetailError с
// status === 404).
export function useMyMixEntry(tournamentId: string | undefined) {
  return useQuery({
    queryKey: tournamentId
      ? qk.myMixEntry(tournamentId)
      : ['tournament', 'none', 'mix', 'me'],
    queryFn: () => getMyMixEntry(tournamentId!),
    enabled: Boolean(tournamentId),
    retry: false,
  });
}

export function useAdminMixPlayers(tournamentId: string | undefined) {
  return useQuery({
    queryKey: tournamentId
      ? qk.adminMixPlayers(tournamentId)
      : ['admin', 'tournament', 'none', 'mix', 'players'],
    queryFn: () => adminListMixPlayers(tournamentId!),
    enabled: Boolean(tournamentId),
  });
}

export function useRegisterForMix() {
  const qc = useQueryClient();
  return useMutation<
    MixPlayerDto,
    Error,
    { tournamentId: string; body?: MixRegisterRequest }
  >({
    mutationFn: ({ tournamentId, body }) => registerForMix(tournamentId, body),
    onSuccess: (data, { tournamentId }) => {
      // Пишем ответ в кэш сразу, а не только invalidate: инвалидация лишь
      // помечает запрос устаревшим и планирует рефетч, а не обновляет
      // данные синхронно, так что без setQueryData между success-тостом и
      // приездом рефетча UI ещё кадр-другой показывал бы дозаписной
      // экран/старую запись.
      qc.setQueryData(qk.myMixEntry(tournamentId), data);
      qc.invalidateQueries({ queryKey: qk.myMixEntry(tournamentId) });
      qc.invalidateQueries({
        queryKey: ['tournament', tournamentId, 'mix', 'players'],
      });
      qc.invalidateQueries({ queryKey: qk.adminMixPlayers(tournamentId) });
    },
  });
}

export function useWithdrawFromMix() {
  const qc = useQueryClient();
  return useMutation<void, Error, { tournamentId: string }>({
    mutationFn: ({ tournamentId }) => withdrawFromMix(tournamentId),
    onSuccess: (_data, { tournamentId }) => {
      qc.invalidateQueries({ queryKey: qk.myMixEntry(tournamentId) });
      qc.invalidateQueries({
        queryKey: ['tournament', tournamentId, 'mix', 'players'],
      });
      qc.invalidateQueries({ queryKey: qk.adminMixPlayers(tournamentId) });
    },
  });
}

export function useCheckInForMix() {
  const qc = useQueryClient();
  return useMutation<MixPlayerDto, Error, { tournamentId: string }>({
    mutationFn: ({ tournamentId }) => checkInForMix(tournamentId),
    onSuccess: (data, { tournamentId }) => {
      // См. комментарий в useRegisterForMix — тот же разрыв между success и
      // рефетчем: без этого "Вы отметились" всплывал бы тостом, пока сам
      // блок ещё держал жёлтый CTA со счётчиком.
      qc.setQueryData(qk.myMixEntry(tournamentId), data);
      qc.invalidateQueries({ queryKey: qk.myMixEntry(tournamentId) });
      qc.invalidateQueries({
        queryKey: ['tournament', tournamentId, 'mix', 'players'],
      });
      qc.invalidateQueries({ queryKey: qk.adminMixPlayers(tournamentId) });
    },
  });
}

export function useAdminApproveMixPlayer() {
  const qc = useQueryClient();
  return useMutation<void, Error, { tournamentId: string; playerId: string }>({
    mutationFn: ({ tournamentId, playerId }) =>
      adminApproveMixPlayer(tournamentId, playerId),
    onSuccess: (_data, { tournamentId }) => {
      qc.invalidateQueries({ queryKey: qk.adminMixPlayers(tournamentId) });
      qc.invalidateQueries({
        queryKey: ['tournament', tournamentId, 'mix', 'players'],
      });
    },
  });
}

export function useAdminRejectMixPlayer() {
  const qc = useQueryClient();
  return useMutation<
    void,
    Error,
    { tournamentId: string; playerId: string; reason?: string }
  >({
    mutationFn: ({ tournamentId, playerId, reason }) =>
      adminRejectMixPlayer(tournamentId, playerId, reason),
    onSuccess: (_data, { tournamentId }) => {
      qc.invalidateQueries({ queryKey: qk.adminMixPlayers(tournamentId) });
      qc.invalidateQueries({
        queryKey: ['tournament', tournamentId, 'mix', 'players'],
      });
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

export function useChangeTeamMemberRole() {
  const qc = useQueryClient();
  return useMutation<
    TeamDto,
    Error,
    { teamId: string; playerId: string; role: TeamMemberRole }
  >({
    mutationFn: ({ teamId, playerId, role }) =>
      changeTeamMemberRole(teamId, playerId, role),
    onSuccess: (team) => {
      qc.invalidateQueries({ queryKey: qk.team(team.id) });
      qc.invalidateQueries({ queryKey: ['teams'] });
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

export function useGenerateStages() {
  const qc = useQueryClient();
  return useMutation<
    TournamentStageDto[],
    Error,
    { id: string; body: GenerateStagesRequest }
  >({
    mutationFn: ({ id, body }) => generateStages(id, body),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: qk.stages(id) });
      qc.invalidateQueries({ queryKey: qk.standings(id) });
      qc.invalidateQueries({ queryKey: ['tournament'] });
    },
  });
}

export function useMoveTeamGroup() {
  const qc = useQueryClient();
  return useMutation<
    void,
    Error,
    { tournamentId: string; teamId: string; groupNo: number }
  >({
    mutationFn: ({ tournamentId, teamId, groupNo }) =>
      moveTeamGroup(tournamentId, teamId, groupNo),
    onSuccess: (_d, { tournamentId }) => {
      qc.invalidateQueries({ queryKey: qk.stages(tournamentId) });
      qc.invalidateQueries({ queryKey: qk.standings(tournamentId) });
      qc.invalidateQueries({ queryKey: ['tournament'] });
    },
  });
}

export function useGeneratePlayoff() {
  const qc = useQueryClient();
  return useMutation<BracketDto, Error, string>({
    mutationFn: generatePlayoff,
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: qk.bracket(id) });
      qc.invalidateQueries({ queryKey: qk.stages(id) });
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

/**
 * Подтянуть результат заново. Матч в ответе не приходит — сервер отдаёт отчёт о том,
 * что нашлось, — поэтому карточку и статистику инвалидируем по id из аргумента.
 */
export function useRefetchMatchResult() {
  const qc = useQueryClient();
  return useMutation<RefetchResultDto, Error, string>({
    mutationFn: refetchMatchResult,
    onSuccess: (_r, id) => {
      qc.invalidateQueries({ queryKey: qk.match(id) });
      qc.invalidateQueries({ queryKey: ['match-result', id] });
      qc.invalidateQueries({ queryKey: ['match-live', id] });
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

// ──────────────── Admin: Dota lobbies ────────────────

export function useAdminLobbies() {
  return useQuery<AdminLobbyDto[]>({
    queryKey: qk.adminLobbies,
    queryFn: listAdminLobbies,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
}

export function useAdminKickLobbyPlayer() {
  const qc = useQueryClient();
  return useMutation<void, Error, { lobbyId: string; accountId: number }>({
    mutationFn: ({ lobbyId, accountId }) => adminKickLobbyPlayer(lobbyId, accountId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminLobbies }),
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

export function usePlayerAchievements(id: string | undefined) {
  return useQuery<PlayerAchievementDto[]>({
    queryKey: id ? qk.playerAchievements(id) : ['player-achievements', 'none'],
    queryFn: () => getPlayerAchievements(id!),
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

export function useLeaderboard(params: {
  season: string | undefined;
  page?: number;
  size?: number;
}) {
  const { season, page = 0, size } = params;
  return useQuery({
    queryKey: qk.leaderboard({ season: season ?? '', page, size }),
    queryFn: () => getLeaderboardPage({ season: season!, page, size }),
    enabled: Boolean(season),
    staleTime: 60_000,
  });
}

export function usePlayerRating(
  id: string | undefined,
  season: string | undefined,
) {
  return useQuery({
    queryKey:
      id && season ? qk.playerRating(id, season) : ['player', 'none', 'rating'],
    queryFn: () => getPlayerRating(id!, season!),
    enabled: Boolean(id && season),
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
  const unreadOnly = true;
  return useQuery({
    queryKey: qk.notificationsList(page, size, unreadOnly),
    queryFn: () => getNotifications(page, size, unreadOnly),
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

// ──────────────── Admin: access codes ────────────────

export function useAdminCodes(params: AccessCodesPageParams = {}) {
  return useQuery({
    queryKey: qk.adminCodesPage(params),
    queryFn: () => getAccessCodesPage(params),
  });
}

export function useIssueAccessCode() {
  const qc = useQueryClient();
  return useMutation<
    IssuedCodeDto,
    Error,
    { playerId: string; body?: IssueCodeRequest }
  >({
    mutationFn: ({ playerId, body }) => issueAccessCode(playerId, body ?? {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.adminCodes });
    },
  });
}

export function useRevokeAccessCode() {
  const qc = useQueryClient();
  return useMutation<AccessCodeDto, Error, string>({
    mutationFn: (id) => revokeAccessCode(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.adminCodes });
    },
  });
}

export type { PlayerPublicDto, TeamInviteDto, LeaderboardEntryDto, PlayerRatingDto };
