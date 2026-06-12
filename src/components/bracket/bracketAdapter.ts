import type { BracketDto, BracketRoundDto, TeamPublicDto } from '@/lib/api/types';
import type { TournamentData, Match, Team } from './bracketTypes';

type BracketCellDto = BracketRoundDto['matches'][number];

function mapTeam(team: TeamPublicDto | null | undefined): Team | null {
  if (!team) return null;
  return { id: team.id, name: team.name, shortName: team.tag };
}

function mapStatus(status: string): 'pending' | 'live' | 'completed' {
  if (status === 'LIVE') return 'live';
  if (status === 'FINISHED') return 'completed';
  return 'pending';
}

function mapCell(cell: BracketCellDto): Match {
  const m = cell.match;
  if (!m) {
    return {
      id: `placeholder-${cell.section}-${cell.roundIndex}-${cell.matchIndex}`,
      teamA: mapTeam(cell.slotA.team),
      teamB: mapTeam(cell.slotB.team),
      scoreA: 0,
      scoreB: 0,
      format: 'BO3',
      status: 'pending',
      completedAt: null,
      winnerId: null,
    };
  }
  return {
    id: m.id,
    teamA: mapTeam(m.teamA ?? null),
    teamB: mapTeam(m.teamB ?? null),
    scoreA: m.scoreA,
    scoreB: m.scoreB,
    format: m.format,
    status: mapStatus(m.status),
    completedAt: m.finishedAt ?? null,
    winnerId: m.winnerTeamId ?? null,
  };
}

export function adaptBracketDto(dto: BracketDto, tournamentName: string): TournamentData {
  const sorted = [...dto.rounds].sort((a, b) => a.roundIndex - b.roundIndex);

  const wbRounds = sorted
    .filter((r) => r.section === 'WB')
    .map((r) => ({
      id: `wb-${r.roundIndex}`,
      name: r.title,
      matches: r.matches.map(mapCell),
    }));

  const lbRounds = sorted
    .filter((r) => r.section === 'LB')
    .map((r) => ({
      id: `lb-${r.roundIndex}`,
      name: r.title,
      matches: r.matches.map(mapCell),
    }));

  const gfCell = sorted.find((r) => r.section === 'GF')?.matches[0] ?? null;
  const grandFinal: Match = gfCell
    ? mapCell(gfCell)
    : {
        id: 'gf-placeholder',
        teamA: null,
        teamB: null,
        scoreA: 0,
        scoreB: 0,
        format: 'BO3',
        status: 'pending',
        completedAt: null,
        winnerId: null,
      };

  return {
    name: tournamentName,
    upperBracket: { type: 'upper', rounds: wbRounds },
    lowerBracket: { type: 'lower', rounds: lbRounds },
    grandFinal,
  };
}
