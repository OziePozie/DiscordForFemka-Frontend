/**
 * This file was generated to mirror `openapi-typescript ../docs/contracts/openapi.yaml`.
 * Re-generate with: `npm run gen:types`
 *
 * Do not edit by hand — adjust the OpenAPI source instead.
 */

/* eslint-disable @typescript-eslint/no-empty-interface, @typescript-eslint/no-unused-vars */

export type OneOf<T extends unknown[]> = T extends [infer U, ...infer Rest]
  ? U | OneOf<Rest>
  : never;

export interface paths {
  '/api/v1/auth/session': {
    get: operations['getSession'];
  };
  '/api/v1/auth/logout': {
    post: operations['logout'];
  };
  '/api/v1/me/links/{provider}': {
    delete: operations['unlinkProvider'];
  };
  '/api/v1/me': {
    get: operations['getMe'];
    patch: operations['updateMe'];
  };
  '/api/v1/me/avatar': {
    post: operations['uploadAvatar'];
  };
  '/api/v1/players': {
    get: operations['listPlayers'];
  };
  '/api/v1/players/{id}': {
    get: operations['getPlayer'];
  };
  '/api/v1/me/mmr': {
    get: operations['getMyMmr'];
  };
  '/api/v1/me/mmr/refresh': {
    post: operations['refreshMmr'];
  };
  '/api/v1/me/mmr/requests': {
    get: operations['listMyMmrRequests'];
    post: operations['createMmrRequest'];
  };
}

export interface components {
  schemas: {
    ErrorDto: {
      type?: string;
      title?: string;
      status?: number;
      detail?: string;
      code?: string;
      instance?: string;
      errors?: components['schemas']['FieldError'][];
    };
    FieldError: {
      field?: string;
      message?: string;
      code?: string;
    };
    Page: {
      items?: unknown[];
      page?: number;
      size?: number;
      totalItems?: number;
      totalPages?: number;
    };

    // ---- Enums ----
    PlayerRole: 'PLAYER' | 'CAPTAIN' | 'MODERATOR' | 'ADMIN';
    PlayerPosition: 'POS_1' | 'POS_2' | 'POS_3' | 'POS_4' | 'POS_5';
    MmrSource: 'AUTO_ESTIMATE' | 'MANUAL_CONFIRMED' | 'LEADERBOARD';
    MmrChangeReason: 'CALIBRATION' | 'ROLE_CHANGE' | 'INACTIVE_RETURN' | 'OTHER';
    RequestStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    ActivityStatus: 'ACTIVE' | 'INACTIVE';
    InactiveReason:
      | 'MMR_STALE'
      | 'MISSING_FIELDS'
      | 'UNCONFIRMED_5600_PLUS'
      | 'BANNED'
      | 'NEVER_FETCHED'
      | 'INCOMPLETE_ROSTER'
      | 'INACTIVE_PLAYERS'
      | 'UNCONFIRMED_CAPTAIN'
      | 'DISBANDED';
    AttachmentKind:
      | 'MMR_SCREENSHOT'
      | 'TEAM_LOGO'
      | 'PLAYER_AVATAR'
      | 'TOURNAMENT_BANNER';
    TeamMemberRole: 'CAPTAIN' | 'MAIN' | 'SUB';
    TeamStatus: 'ACTIVE' | 'INACTIVE' | 'DISBANDED';
    InviteStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED';
    SeasonStatus: 'PLANNED' | 'ACTIVE' | 'FINISHED';
    TournamentFormat:
      | 'SINGLE_ELIM'
      | 'DOUBLE_ELIM'
      | 'ROUND_ROBIN'
      | 'SWISS'
      | 'SHOWMATCH';
    TournamentStatus:
      | 'ANNOUNCED'
      | 'REGISTRATION_OPEN'
      | 'REGISTRATION_CLOSED'
      | 'LIVE'
      | 'FINISHED'
      | 'CANCELLED';
    MatchKind: 'TOURNAMENT' | 'CLAN_WAR' | 'SHOWMATCH';
    MatchFormat: 'BO1' | 'BO3' | 'BO5';
    MatchStatus: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED';
    MatchRequestStatus: 'OPEN' | 'MATCHED' | 'CANCELLED' | 'EXPIRED';
    AccountProvider: 'DISCORD' | 'TWITCH';

    // ---- Auth ----
    SessionDto: {
      playerId: string;
      steamId: number;
      nickname?: string | null;
      avatarUrl?: string | null;
      roles: components['schemas']['PlayerRole'][];
      activity: components['schemas']['ActivityStatus'];
      profileIncomplete: boolean;
    };

    // ---- Attachment ----
    AttachmentDto: {
      id: string;
      kind: components['schemas']['AttachmentKind'];
      filename: string;
      contentType: string;
      sizeBytes: number;
      url: string;
      createdAt: string;
    };

    // ---- Player ----
    PlayerMmrPublicDto: {
      mmr: number;
      source: components['schemas']['MmrSource'];
      rankTier?: number | null;
      leaderboardRank?: number | null;
    };
    PlayerPublicDto: {
      id: string;
      nickname?: string | null;
      avatarUrl?: string | null;
      country?: string | null;
      primaryRole?: components['schemas']['PlayerPosition'] | null;
      secondaryRoles?: components['schemas']['PlayerPosition'][];
      mmr?: components['schemas']['PlayerMmrPublicDto'] | null;
      activity: components['schemas']['ActivityStatus'];
      discordId?: number | null;
      twitchLogin?: string | null;
      dotabuffUrl?: string | null;
      stratzUrl?: string | null;
      createdAt?: string;
    };
    PlayerMmrDto: {
      mmr: number;
      source: components['schemas']['MmrSource'];
      rankTier?: number | null;
      leaderboardRank?: number | null;
      fetchedAt: string;
      confirmedAt?: string | null;
    };
    PlayerActivityDto: {
      status: components['schemas']['ActivityStatus'];
      reasons: components['schemas']['InactiveReason'][];
      lastCheckAt: string;
    };
    AccountLinkDto: {
      provider: components['schemas']['AccountProvider'];
      externalId: string;
      externalLogin?: string | null;
      linkedAt: string;
    };
    TeamMembershipDto: {
      teamId: string;
      name: string;
      tag: string;
      role: components['schemas']['TeamMemberRole'];
      teamStatus: components['schemas']['TeamStatus'];
    };
    MeDto: {
      profile: components['schemas']['PlayerPublicDto'];
      steamId: number;
      mmr: components['schemas']['PlayerMmrDto'];
      activity: components['schemas']['PlayerActivityDto'];
      links: components['schemas']['AccountLinkDto'][];
      teams: components['schemas']['TeamMembershipDto'][];
      roles: components['schemas']['PlayerRole'][];
    };
    UpdateMeRequest: {
      nickname?: string;
      country?: string;
      primaryRole?: components['schemas']['PlayerPosition'];
      secondaryRoles?: components['schemas']['PlayerPosition'][];
      dotabuffUrl?: string;
      stratzUrl?: string;
    };

    // ---- MMR ----
    MyMmrDto: {
      current: components['schemas']['PlayerMmrDto'];
      recentRequests: components['schemas']['MmrChangeRequestDto'][];
    };
    CreateMmrChangeRequest: {
      requestedMmr: number;
      reason: components['schemas']['MmrChangeReason'];
      screenshotId: string;
      comment?: string;
    };
    MmrChangeRequestDto: {
      id: string;
      requestedMmr: number;
      reason: components['schemas']['MmrChangeReason'];
      screenshotId: string;
      screenshotUrl: string;
      comment?: string | null;
      status: components['schemas']['RequestStatus'];
      reviewComment?: string | null;
      decidedAt?: string | null;
      createdAt: string;
    };

    // ---- Team ----
    TeamPublicDto: {
      id: string;
      name: string;
      tag: string;
      logoUrl?: string | null;
      captain: components['schemas']['PlayerPublicDto'];
      avgMmr?: number | null;
      status: components['schemas']['TeamStatus'];
      memberCount: number;
      createdAt: string;
    };
  };
}

export interface operations {
  getSession: {
    responses: {
      200: {
        content: {
          'application/json':
            | components['schemas']['SessionDto']
            | null;
        };
      };
    };
  };
  logout: {
    responses: { 204: { content: never } };
  };
  unlinkProvider: {
    parameters: { path: { provider: 'discord' | 'twitch' } };
    responses: { 204: { content: never } };
  };
  getMe: {
    responses: {
      200: { content: { 'application/json': components['schemas']['MeDto'] } };
    };
  };
  updateMe: {
    requestBody: {
      content: { 'application/json': components['schemas']['UpdateMeRequest'] };
    };
    responses: {
      200: { content: { 'application/json': components['schemas']['MeDto'] } };
    };
  };
  uploadAvatar: {
    responses: {
      200: {
        content: { 'application/json': components['schemas']['AttachmentDto'] };
      };
    };
  };
  listPlayers: {
    responses: {
      200: {
        content: {
          'application/json': components['schemas']['Page'] & {
            items: components['schemas']['PlayerPublicDto'][];
          };
        };
      };
    };
  };
  getPlayer: {
    parameters: { path: { id: string } };
    responses: {
      200: {
        content: {
          'application/json': components['schemas']['PlayerPublicDto'];
        };
      };
    };
  };
  getMyMmr: {
    responses: {
      200: { content: { 'application/json': components['schemas']['MyMmrDto'] } };
    };
  };
  refreshMmr: {
    responses: {
      200: {
        content: { 'application/json': components['schemas']['PlayerMmrDto'] };
      };
    };
  };
  listMyMmrRequests: {
    responses: {
      200: {
        content: {
          'application/json': components['schemas']['Page'] & {
            items: components['schemas']['MmrChangeRequestDto'][];
          };
        };
      };
    };
  };
  createMmrRequest: {
    requestBody: {
      content: {
        'application/json': components['schemas']['CreateMmrChangeRequest'];
      };
    };
    responses: {
      201: {
        content: {
          'application/json': components['schemas']['MmrChangeRequestDto'];
        };
      };
    };
  };
}
