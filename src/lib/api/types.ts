import type { components } from './types.gen';

type S = components['schemas'];

// DTOs
export type SessionDto = S['SessionDto'];
export type MeDto = S['MeDto'];
export type UpdateMeRequest = S['UpdateMeRequest'];
export type PlayerPublicDto = S['PlayerPublicDto'];
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

// Teams
export type TeamDto = S['TeamDto'];
export type TeamMemberDto = S['TeamMemberDto'];
export type CreateTeamRequest = S['CreateTeamRequest'];
export type UpdateTeamRequest = S['UpdateTeamRequest'];
export type CreateInviteRequest = S['CreateInviteRequest'];
export type TeamInviteDto = S['TeamInviteDto'];

// Match requests (KV lobbies)
export type MatchRequestDto = S['MatchRequestDto'];
export type CreateMatchRequestDto = S['CreateMatchRequestDto'];

// Admin: players
export type PlayerAdminDto = S['PlayerAdminDto'];
export type AdminUpdatePlayerRequest = S['AdminUpdatePlayerRequest'];

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

// Seasons / Tournaments / Matches
export type SeasonDto = S['SeasonDto'];
export type SeasonDetailsDto = S['SeasonDetailsDto'];
export type HighlightDto = S['HighlightDto'];
export type TournamentDto = S['TournamentDto'];
export type TournamentDetailsDto = S['TournamentDetailsDto'];
export type TournamentTeamDto = S['TournamentTeamDto'];
export type BracketDto = S['BracketDto'];
export type BracketRoundDto = S['BracketRoundDto'];

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

export type MatchDto = S['MatchDto'] & {
  tournamentSlug?: string | null;
  teamAReadyAt?: string | null;
  teamBReadyAt?: string | null;
  lobbyId?: string | null;
  lobbyCreatedAt?: string | null;
  lobbyCreateStartedAt?: string | null;
  lobbyCreateFailedAt?: string | null;
  lobbyCreateFailedReason?: string | null;
  lobbyCreateAttempts?: number;
  gameMode?: GameMode | null;
  region?: Region | null;
  coinToss?: boolean | null;
  autoLaunch?: boolean | null;
};

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
}

export interface UpdateSeasonRequest {
  name?: string | null;
  description?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
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
  PLANNED: 'Запланирован',
  ACTIVE: 'Идёт',
  FINISHED: 'Завершён',
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
