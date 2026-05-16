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
