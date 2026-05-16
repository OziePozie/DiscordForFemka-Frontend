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
  disbandTeam,
  transferCaptaincy,
  registerTeamForTournament,
  type SeasonsPageParams,
  type TournamentMatchesParams,
  type TeamsPageParams,
  type AdminMmrRequestsParams,
} from './api/endpoints';
import type {
  SessionDto,
  MeDto,
  UpdateMeRequest,
  PlayerPublicDto,
  AttachmentDto,
  AccountProvider,
  MmrChangeRequestAdminDto,
  TeamDto,
  TournamentTeamDto,
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
  return useMutation<TournamentTeamDto, Error, string>({
    mutationFn: registerTeamForTournament,
    onSuccess: (_data, tournamentId) => {
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

export type { PlayerPublicDto };
