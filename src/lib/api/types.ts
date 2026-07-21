import type { components } from './types.gen';

type S = components['schemas'];

// DTOs
export type SessionDto = S['SessionDto'];
export type PlayerPublicDto = S['PlayerPublicDto'];
export type NicknameHistoryEntryDto = S['NicknameHistoryEntryDto'];
export type UpdateMeRequest = S['UpdateMeRequest'];
export type MeDto = Omit<S['MeDto'], 'profile'> & { profile: PlayerPublicDto };
export type PlayerMmrPublicDto = S['PlayerMmrPublicDto'];
export type PlayerMmrDto = S['PlayerMmrDto'];
export type PlayerActivityDto = S['PlayerActivityDto'];
export type AccountLinkDto = S['AccountLinkDto'];
export type AttachmentDto = S['AttachmentDto'];
export type TeamMembershipDto = S['TeamMembershipDto'];
export type TeamPublicDto = S['TeamPublicDto'];
export type ErrorDto = S['ErrorDto'];
export type FieldErrorDto = S['FieldError'];
export type MyMmrDto = S['MyMmrDto'];
export type CreateMmrChangeRequest = S['CreateMmrChangeRequest'];
export type MmrChangeRequestDto = S['MmrChangeRequestDto'];
export type MmrChangeRequestAdminDto = S['MmrChangeRequestAdminDto'];

// Notifications
export type NotificationDto = S['NotificationDto'];
export type NotificationType = S['NotificationType'];

// Internal platform rating
export type RankTier = S['RankTier'];
export type PlayerRatingDto = S['PlayerRatingDto'];
export type LeaderboardEntryDto = S['LeaderboardEntryDto'];

// Teams
export type TeamDto = S['TeamDto'];
export type TeamMemberDto = S['TeamMemberDto'];
export type CreateTeamRequest = S['CreateTeamRequest'];
export type UpdateTeamRequest = S['UpdateTeamRequest'];
export type CreateInviteRequest = S['CreateInviteRequest'];
export type ChangeMemberRoleRequest = S['ChangeMemberRoleRequest'];
export type TeamInviteDto = S['TeamInviteDto'];

// Match requests (KV lobbies)
export type MatchRequestDto = S['MatchRequestDto'];
export type CreateMatchRequestDto = S['CreateMatchRequestDto'];

// Admin: players
export type PlayerAdminDto = S['PlayerAdminDto'];
export type AdminUpdatePlayerRequest = S['AdminUpdatePlayerRequest'];
export type AdminCreatePlayerRequest = S['AdminCreatePlayerRequest'];

// Admin: audit log
// TODO: replace with types.gen.ts once openapi.yaml is regenerated to expose AuditLogDto.
// Shape mirrors docs/contracts/04-dto.md: actor is a PlayerPublicDto, payload is a free-form
// JSON map. We allow `actorId` as a fallback for backends that send only the id.
export interface AuditLogDto {
  id: string;
  actor?: PlayerPublicDto | null;
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  payload?: Record<string, unknown> | null;
  at: string;
}

// Admin: Dota bots (proxy to Dota2API). Not in openapi.yaml — typed manually.
// steamState: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'LOGGING_IN' | 'LOGGED_ON'
// gcState:    'NOT_CONNECTED' | 'HELLO_SENT' | 'READY'
// healthy is pre-computed by Dota2API as steamState===LOGGED_ON && gcState===READY.
export interface BotStatusDto {
  username: string;
  accountId: number;
  steamState: string;
  gcState: string;
  inLobby: boolean;
  currentLobbyId: number | null;
  healthy: boolean;
}

// Seasons / Tournaments / Matches
export type SeasonDto = S['SeasonDto'];
export type SeasonDetailsDto = S['SeasonDetailsDto'];
export type HighlightDto = S['HighlightDto'];
export type TournamentDto = S['TournamentDto'];
export type TournamentDetailsDto = S['TournamentDetailsDto'];
export type TournamentTeamDto = S['TournamentTeamDto'];
export type TournamentTeamAdminDto = S['TournamentTeamAdminDto'];
export type RosterMemberAdminDto = S['RosterMemberAdminDto'];
export type EligibilityViolationDto = S['EligibilityViolationDto'];
export type RejectTeamRequest = S['RejectTeamRequest'];
export type BracketDto = S['BracketDto'];
export type BracketRoundDto = S['BracketRoundDto'];
export type TournamentStageDto = S['TournamentStageDto'];
export type StageConfigDto = S['StageConfigDto'];
export type StageType = S['StageType'];
export type StageStatus = S['StageStatus'];
export type GroupStandingsDto = S['GroupStandingsDto'];
export type StandingRowDto = S['StandingRowDto'];
export type GenerateStagesRequest = S['GenerateStagesRequest'];
export type MoveTeamGroupRequest = S['MoveTeamGroupRequest'];

// TODO: replace once openapi regenerates — captain-readiness / lobby fields are
// not yet in types.gen.ts. We augment the generated MatchDto with the new
// fields (all nullable / optional) so pages can read them safely.
export type GameMode =
  | 'ALL_PICK'
  | 'CAPTAINS_MODE'
  | 'CAPTAINS_DRAFT'
  | 'RANKED_AP'
  | 'SINGLE_DRAFT'
  | 'RANDOM_DRAFT'
  | 'ALL_RANDOM'
  | 'TURBO'
  | 'ALL_PICK_RANKED';

export type Region =
  | 'AUTO'
  | 'EUROPE'
  | 'US_EAST'
  | 'US_WEST'
  | 'SE_ASIA'
  | 'RUSSIA'
  | 'AUSTRALIA'
  | 'SOUTH_AMERICA'
  | 'STOCKHOLM'
  | 'DUBAI'
  | 'AUSTRIA'
  | 'PERU'
  | 'SOUTH_AFRICA'
  | 'CHILE'
  | 'INDIA';

// How a match result was produced. Mirrors backend MatchResultType.
export type MatchResultType = 'NORMAL' | 'TECH_WIN' | 'TECH_LOSS' | 'CANCELLED';

// Backend MatchGameDto — one game (map) within a match series (last = current).
export interface MatchGameDto {
  gameNumber: number;
  status: MatchStatus;
  winnerTeamId?: string | null;
  teamAKills: number;
  teamBKills: number;
  // Human-readable Dota lobby name players search for (was lobbyId; the raw id
  // is no longer exposed by the backend).
  lobbyName?: string | null;
  dotaMatchId?: number | null;
  createdAt?: string | null;
  finishedAt?: string | null;
}

export type MatchDto = Omit<S['MatchDto'], 'teamA' | 'teamB'> & {
  // Bracket shells: downstream tournament matches exist before their teams are
  // known (and revert to null when an upstream result is cancelled). The
  // generated type marks these non-null, but the backend sends null — render
  // sites MUST treat them as nullable.
  teamA: TeamPublicDto | null;
  teamB: TeamPublicDto | null;
  // TODO: regenerate openapi — resultType (NORMAL/TECH_WIN/TECH_LOSS/CANCELLED).
  resultType?: MatchResultType | null;
  teamAReadyAt?: string | null;
  teamBReadyAt?: string | null;
  lobbyId?: string | null;
  lobbyCreatedAt?: string | null;
  gameMode?: GameMode | null;
  region?: Region | null;
  coinToss?: boolean | null;
  autoLaunch?: boolean | null;
  // TODO: regenerate openapi — async lobby create retry fields.
  lobbyCreateStartedAt?: string | null;
  lobbyCreateFailedAt?: string | null;
  lobbyCreateFailedReason?: string | null;
  lobbyCreateAttempts?: number | null;
  // TODO: regenerate openapi — backend exposes tournament slug on MatchDto for
  // building clickable tournament badges.
  tournamentSlug?: string | null;
  // Match series: one entry per game, ordered by ascending gameNumber.
  // The "current" game is the last element. lobbyId/lobbyCreatedAt are no
  // longer sent on MatchDto itself — read them from games (see currentGame
  // helper below).
  games?: MatchGameDto[] | null;
};

/** Current (last) game of the series, or undefined if no games exist yet. */
export function currentGame(m: Pick<MatchDto, 'games'>): MatchGameDto | undefined {
  return m.games && m.games.length > 0 ? m.games[m.games.length - 1] : undefined;
}

// Match live snapshot + final result
export type MatchLiveSnapshotDto = S['MatchLiveSnapshotDto'];
export type TeamLiveDto = S['TeamLiveDto'];
export type PlayerLiveDto = S['PlayerLiveDto'];
export type MatchResultDto = S['MatchResultDto'];
export type MatchBanDto = S['MatchBanDto'];
export type MatchPlayerStatDto = S['MatchPlayerStatDto'];
export type PlayerMatchSummaryDto = S['PlayerMatchSummaryDto'];
export type PlayerStatsDto = S['PlayerStatsDto'];
export type FavoriteHeroDto = S['FavoriteHeroDto'];

// Result of POST /matches/{id}/invite-me.
export type InviteResultDto = S['InviteResultDto'];

// TODO: regenerate openapi — admin match update payload (Stage 9).
export interface UpdateMatchRequest {
  // Планируемое время начала (ISO-UTC). Бэкенд применяет только не-null:
  // очистить время этим PATCH нельзя.
  scheduledAt?: string | null;
  gameMode?: GameMode | null;
  region?: Region | null;
  coinToss?: boolean | null;
  autoLaunch?: boolean | null;
  // Null clears the corresponding ready timestamp.
  teamAReadyAt?: string | null;
  teamBReadyAt?: string | null;
}

// Manual bracket-management admin payloads.
export interface TechResultRequest {
  winnerTeamId: string;
  resultType: 'TECH_WIN' | 'TECH_LOSS';
}

export interface MoveTeamsRequest {
  teamAId?: string | null;
  teamBId?: string | null;
}

export interface ChangeFormatRequest {
  format: MatchFormat;
}

// TODO: regenerate openapi — archive DTOs (Stage 9).
export interface SeasonChampionDto {
  tournamentId: string;
  tournamentName: string;
  tournamentSlug: string;
  format: TournamentFormat;
  endsAt: string | null;
  winnerTeam: TeamPublicDto;
}

export interface PlayerTournamentEntry {
  tournamentId: string;
  tournamentSlug: string;
  tournamentName: string;
  status: TournamentStatus;
  startsAt: string | null;
  endsAt: string | null;
  teamId: string;
  teamName: string;
  teamTag: string;
  wasWinner: boolean;
}

export interface PlayerTeamEntry {
  teamId: string;
  teamName: string;
  teamTag: string;
  role: TeamMemberRole;
  joinedAt: string;
  leftAt: string | null;
}

export interface MmrHistoryEntry {
  mmr: number | null;
  source: MmrSource;
  fetchedAt: string;
  confirmedAt: string | null;
}

export interface PlayerHistoryDto {
  tournaments: PlayerTournamentEntry[];
  teams: PlayerTeamEntry[];
  mmrTimeline: MmrHistoryEntry[];
}

export interface TeamTournamentEntry {
  tournamentId: string;
  tournamentSlug: string;
  tournamentName: string;
  status: TournamentStatus;
  endsAt: string | null;
  seed: number | null;
  wasWinner: boolean;
}

export interface TeamHistoryDto {
  tournaments: TeamTournamentEntry[];
}

// Allowed countries — должны совпадать с platform.countries.allowed на бэке.
// При расширении списка обнови оба места.
export type CountryCode = 'RU' | 'BY' | 'UA' | 'KZ';

export const COUNTRIES: CountryCode[] = ['RU', 'BY', 'UA', 'KZ'];

export const COUNTRY_LABEL: Record<CountryCode, string> = {
  RU: 'Россия',
  BY: 'Беларусь',
  UA: 'Украина',
  KZ: 'Казахстан',
};

export type GenderType = 'MALE' | 'FEMALE';

export const GENDERS: GenderType[] = ['MALE', 'FEMALE'];

export const GENDER_LABEL: Record<GenderType, string> = {
  MALE: 'Мужской',
  FEMALE: 'Женский',
};

// TODO: regenerate openapi — tournament eligibility rules (per-tournament 1:1).
// Mirror of platform.tournament.dto.TournamentEligibilityDto on backend.
// All rule fields nullable: null = "do not check this rule".
export interface TournamentEligibilityDto {
  expectedTeamSize?: number | null;
  minMaleCount?: number | null;
  minFemaleCount?: number | null;
  maxPlayerMmr?: number | null;
  maxTeamAvgMmr?: number | null;
  updatedAt?: string | null; // response-only
}

// Generic paged response
export interface PagedResponse<T> {
  items?: T[];
  page?: number;
  size?: number;
  totalItems?: number;
  totalPages?: number;
}

// ──────────────── Admin request types ────────────────
// Defined here because they are not yet present in types.gen.ts.
// TODO: remove after openapi.yaml exposes Create/Update Season/Tournament request schemas.

export interface CreateSeasonRequest {
  name: string;
  slug: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  bannerAttachmentId?: string | null;
}

export interface UpdateSeasonRequest {
  name?: string | null;
  description?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  bannerAttachmentId?: string | null;
}

export interface CreateTournamentRequest {
  name: string;
  slug: string;
  seasonId?: string | null;
  format: TournamentFormat;
  description?: string | null;
  rules?: string | null;
  prizePoolText?: string | null;
  bannerAttachmentId?: string | null;
  maxTeams?: number | null;
  registrationOpensAt?: string | null;
  registrationClosesAt?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  // TODO: replace once openapi regenerates — defaultGameMode / defaultRegion /
  // defaultCoinToss / defaultAutoLaunch / dotaLeagueId are added by the
  // captain-readiness feature.
  defaultGameMode?: GameMode | null;
  defaultRegion?: Region | null;
  defaultCoinToss?: boolean | null;
  defaultAutoLaunch?: boolean | null;
  dotaLeagueId?: number | null;
  broadcasterAccountIds?: number[] | null;
  matchFormatDefault?: MatchFormat | null;
  grandFinalFormat?: MatchFormat | null;
  // Регламент: создаётся вместе с турниром. Пустая строка → поле пустое.
  regulationsUrl?: string | null;
  regulationsContent?: string | null;
  regulationsVersion?: string | null;
}

export interface UpdateTournamentRequest {
  name?: string | null;
  description?: string | null;
  rules?: string | null;
  prizePoolText?: string | null;
  bannerAttachmentId?: string | null;
  maxTeams?: number | null;
  registrationOpensAt?: string | null;
  registrationClosesAt?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  // TODO: replace once openapi regenerates.
  defaultGameMode?: GameMode | null;
  defaultRegion?: Region | null;
  defaultCoinToss?: boolean | null;
  defaultAutoLaunch?: boolean | null;
  dotaLeagueId?: number | null;
  broadcasterAccountIds?: number[] | null;
  matchFormatDefault?: MatchFormat | null;
  grandFinalFormat?: MatchFormat | null;
  // Регламент: null/отсутствие = не менять; пустая строка = очистить.
  regulationsUrl?: string | null;
  regulationsContent?: string | null;
  regulationsVersion?: string | null;
}

// Enums (as union types)
export type PlayerRole = S['PlayerRole'];
export type PlayerPosition = S['PlayerPosition'];
export type MmrSource = S['MmrSource'];
export type MmrChangeReason = S['MmrChangeReason'];
export type RequestStatus = S['RequestStatus'];
export type ActivityStatus = S['ActivityStatus'];
export type InactiveReason = S['InactiveReason'];
export type AttachmentKind = S['AttachmentKind'];
export type TeamMemberRole = S['TeamMemberRole'];
export type TeamStatus = S['TeamStatus'];
export type InviteStatus = S['InviteStatus'];
export type SeasonStatus = S['SeasonStatus'];
export type TournamentFormat = S['TournamentFormat'];
export type TournamentStatus = S['TournamentStatus'];
export type MatchKind = S['MatchKind'];
export type MatchFormat = S['MatchFormat'];
export type MatchStatus = S['MatchStatus'];
export type MatchRequestStatus = S['MatchRequestStatus'];
export type AccountProvider = S['AccountProvider'];

// Const arrays for select options
export const PLAYER_POSITIONS: PlayerPosition[] = [
  'POS_1',
  'POS_2',
  'POS_3',
  'POS_4',
  'POS_5',
];

export const POSITION_LABEL: Record<PlayerPosition, string> = {
  POS_1: 'Pos 1 (Carry)',
  POS_2: 'Pos 2 (Mid)',
  POS_3: 'Pos 3 (Offlane)',
  POS_4: 'Pos 4 (Soft Support)',
  POS_5: 'Pos 5 (Hard Support)',
};

export const MMR_SOURCE_LABEL: Record<MmrSource, string> = {
  AUTO_ESTIMATE: 'OpenDota',
  MANUAL_CONFIRMED: 'Подтверждено модератором',
  LEADERBOARD: 'Leaderboard',
};

export const SEASON_STATUS_LABEL: Record<SeasonStatus, string> = {
  PLANNED: 'Запланирована',
  ACTIVE: 'Активна',
  FINISHED: 'Завершена',
};

export const TOURNAMENT_STATUS_LABEL: Record<TournamentStatus, string> = {
  ANNOUNCED: 'Анонс',
  REGISTRATION_OPEN: 'Регистрация открыта',
  REGISTRATION_CLOSED: 'Регистрация закрыта',
  LIVE: 'Идёт',
  FINISHED: 'Завершён',
  CANCELLED: 'Отменён',
};

export const TOURNAMENT_FORMAT_LABEL: Record<TournamentFormat, string> = {
  SINGLE_ELIM: 'Single Elim',
  DOUBLE_ELIM: 'Double Elim',
  ROUND_ROBIN: 'Round Robin',
  SWISS: 'Swiss',
  SHOWMATCH: 'Showmatch',
};

export const TEAM_STATUS_LABEL: Record<TeamStatus, string> = {
  ACTIVE: 'Активна',
  INACTIVE: 'Неактивна',
  DISBANDED: 'Расформирована',
};

export const MATCH_STATUS_LABEL: Record<MatchStatus, string> = {
  SCHEDULED: 'Запланирован',
  LIVE: 'Идёт',
  FINISHED: 'Завершён',
  CANCELLED: 'Отменён',
};

export const MATCH_FORMAT_LABEL: Record<MatchFormat, string> = {
  BO1: 'BO1',
  BO3: 'BO3',
  BO5: 'BO5',
};

export const MATCH_FORMATS: MatchFormat[] = ['BO1', 'BO3', 'BO5'];

export const MATCH_RESULT_TYPE_LABEL: Record<MatchResultType, string> = {
  NORMAL: 'Обычный',
  TECH_WIN: 'Техвин',
  TECH_LOSS: 'Техлуз',
  CANCELLED: 'Отменён',
};

export const MATCH_KIND_LABEL: Record<MatchKind, string> = {
  TOURNAMENT: 'Турнир',
  CLAN_WAR: 'Клан-вар',
  SHOWMATCH: 'Шоу-матч',
};

export const MATCH_REQUEST_STATUS_LABEL: Record<MatchRequestStatus, string> = {
  OPEN: 'Открыто',
  MATCHED: 'Принято',
  CANCELLED: 'Отменено',
  EXPIRED: 'Истекло',
};

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: 'На модерации',
  APPROVED: 'Одобрена',
  REJECTED: 'Отклонена',
};

export const INVITE_STATUS_LABEL: Record<InviteStatus, string> = {
  PENDING: 'Ожидает',
  ACCEPTED: 'Принят',
  DECLINED: 'Отклонён',
  CANCELLED: 'Отменён',
  EXPIRED: 'Истёк',
};

export const TEAM_MEMBER_ROLE_LABEL: Record<TeamMemberRole, string> = {
  CAPTAIN: 'Капитан',
  MAIN: 'Основа',
  SUB: 'Запасной',
};

export const MMR_CHANGE_REASON_LABEL: Record<MmrChangeReason, string> = {
  CALIBRATION: 'Калибровка',
  ROLE_CHANGE: 'Смена роли',
  INACTIVE_RETURN: 'Возврат после паузы',
  OTHER: 'Другое',
};

export const PLAYER_ROLE_LABEL: Record<PlayerRole, string> = {
  PLAYER: 'Игрок',
  CAPTAIN: 'Капитан',
  MODERATOR: 'Модератор',
  ADMIN: 'Админ',
};

export const PLAYER_ROLES: PlayerRole[] = [
  'PLAYER',
  'CAPTAIN',
  'MODERATOR',
  'ADMIN',
];

export const GAME_MODE_LABEL: Record<GameMode, string> = {
  ALL_PICK: 'All Pick',
  CAPTAINS_MODE: 'Captains Mode',
  CAPTAINS_DRAFT: 'Captains Draft',
  RANKED_AP: 'Ranked All Pick',
  SINGLE_DRAFT: 'Single Draft',
  RANDOM_DRAFT: 'Random Draft',
  ALL_RANDOM: 'All Random',
  TURBO: 'Turbo',
  ALL_PICK_RANKED: 'Ranked AP',
};

export const GAME_MODES: GameMode[] = [
  'ALL_PICK',
  'CAPTAINS_MODE',
  'CAPTAINS_DRAFT',
  'RANKED_AP',
  'SINGLE_DRAFT',
  'RANDOM_DRAFT',
  'ALL_RANDOM',
  'TURBO',
  'ALL_PICK_RANKED',
];

export const REGION_LABEL: Record<Region, string> = {
  AUTO: 'Авто',
  EUROPE: 'Europe',
  US_EAST: 'US East',
  US_WEST: 'US West',
  SE_ASIA: 'SEA',
  RUSSIA: 'Russia',
  AUSTRALIA: 'Australia',
  SOUTH_AMERICA: 'S.America',
  STOCKHOLM: 'Stockholm',
  DUBAI: 'Dubai',
  AUSTRIA: 'Austria',
  PERU: 'Peru',
  SOUTH_AFRICA: 'S.Africa',
  CHILE: 'Chile',
  INDIA: 'India',
};

export const REGIONS: Region[] = [
  'AUTO',
  'EUROPE',
  'US_EAST',
  'US_WEST',
  'SE_ASIA',
  'RUSSIA',
  'AUSTRALIA',
  'SOUTH_AMERICA',
  'STOCKHOLM',
  'DUBAI',
  'AUSTRIA',
  'PERU',
  'SOUTH_AFRICA',
  'CHILE',
  'INDIA',
];

export const INACTIVE_REASON_LABEL: Record<InactiveReason, string> = {
  MMR_STALE: 'Устаревший MMR',
  MISSING_FIELDS: 'Не заполнен профиль',
  UNCONFIRMED_5600_PLUS: '5600+ не подтверждён',
  BANNED: 'Бан',
  NEVER_FETCHED: 'MMR не загружен',
  INCOMPLETE_ROSTER: 'Неполный состав',
  INACTIVE_PLAYERS: 'Неактивные игроки',
  UNCONFIRMED_CAPTAIN: 'Капитан не подтверждён',
  DISBANDED: 'Расформирована',
};

// --- Open Lobbies ---
export type OpenLobbyDto = S['OpenLobbyDto'];
export type OpenLobbySlotDto = S['OpenLobbySlotDto'];
export type CreateOpenLobbyRequest = S['CreateOpenLobbyRequest'];
export type OpenLobbyMode = S['OpenLobbyMode'];
export type OpenLobbyStatus = S['OpenLobbyStatus'];

export const OPEN_LOBBY_MODE_LABEL: Record<OpenLobbyMode, string> = {
  SIMPLIFIED: 'Без ролей (10)',
  WITH_ROLES: 'С ролями (5v5)',
};

export const OPEN_LOBBY_STATUS_LABEL: Record<OpenLobbyStatus, string> = {
  OPEN: 'Открыто',
  READY: 'Готово к запуску',
  LAUNCHED: 'Лобби создано',
  IN_PROGRESS: 'Игра идёт',
  CANCELLED: 'Отменено',
  EXPIRED: 'Истекло',
};
