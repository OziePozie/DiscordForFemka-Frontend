export type MatchFormat = 'BO1' | 'BO3' | 'BO5';
export type MatchStatus = 'pending' | 'live' | 'completed';
export type BracketType = 'upper' | 'lower';

export interface Team {
  id: string;
  name: string;
  shortName: string;
}

export interface Match {
  id: string;
  teamA: Team | null;
  teamB: Team | null;
  scoreA: number;
  scoreB: number;
  format: MatchFormat;
  status: MatchStatus;
  completedAt: string | null;
  winnerId: string | null;
}

export interface Round {
  id: string;
  name: string;
  matches: Match[];
}

export interface BracketData {
  type: BracketType;
  rounds: Round[];
}

export interface TournamentData {
  name: string;
  upperBracket: BracketData;
  lowerBracket: BracketData;
  grandFinal: Match;
}
