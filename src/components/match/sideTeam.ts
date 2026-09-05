import type { MatchDto } from '@/lib/api/types';

/**
 * Какая команда платформы играла на заданной стороне Dota.
 *
 * Бэкенд отдаёт привязку явно — `radiantTeamId`/`direTeamId` в live-снапшоте и в
 * результате игры, — и она остаётся верной, когда coin toss меняет стороны местами.
 * Считать «Radiant = teamA» нельзя: в серии стороны могут отличаться от игры к игре,
 * и подписи составов уезжают на чужую команду.
 *
 * Fallback на статическое соглашение (Radiant = teamA, Dire = teamB) — только когда id
 * отсутствует или не совпал ни с одной командой матча: у старых игр, записанных до
 * появления этих полей, привязки в ответе нет.
 */
export function sideTeam(
  match: MatchDto,
  teamId: string | null | undefined,
  side: 'radiant' | 'dire',
): MatchDto['teamA'] {
  if (teamId) {
    if (match.teamA?.id === teamId) return match.teamA;
    if (match.teamB?.id === teamId) return match.teamB;
  }
  return side === 'radiant' ? match.teamA : match.teamB;
}
