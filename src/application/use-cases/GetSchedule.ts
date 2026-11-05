import type { LeagueRepository } from "../ports/LeagueRepository";
import { LeagueNotFoundError } from "../errors";
import { type LeagueStatus, type MatchView, toMatchView } from "../views";

export interface RoundView {
  round: number;
  matches: MatchView[];
}

/** The round in play: the first round that still has unplayed matches. */
export interface CurrentRoundView {
  round: number;
  /** Only the unplayed matches of that round, in match-number order. */
  matches: MatchView[];
}

export interface ScheduleView {
  status: LeagueStatus;
  rounds: RoundView[];
  currentRound: CurrentRoundView | null;
  final: MatchView | null;
  played: number;
  total: number;
}

export class GetSchedule {
  constructor(private readonly repository: LeagueRepository) {}

  async execute(code: string): Promise<ScheduleView> {
    const league = await this.repository.findByCode(code);
    if (!league) throw new LeagueNotFoundError();
    const matches = league.league.groupMatches.map((m) => toMatchView(league.league, m));
    const rounds = new Map<number, MatchView[]>();
    for (const match of matches) {
      rounds.set(match.round, [...(rounds.get(match.round) ?? []), match]);
    }
    const final = league.league.finalMatch;
    return {
      status: league.league.status,
      rounds: [...rounds].map(([round, list]) => ({ round, matches: list })),
      currentRound: currentRoundOf(league.league.status, rounds),
      final: final ? toMatchView(league.league, final) : null,
      played: matches.filter((m) => m.result).length,
      total: matches.length,
    };
  }
}

/** The round in play: the first round (in order) that still has unplayed matches. */
function currentRoundOf(status: LeagueStatus, rounds: Map<number, MatchView[]>): CurrentRoundView | null {
  if (status !== "group_stage") return null;
  for (const [round, matches] of rounds) {
    const pending = matches.filter((m) => !m.result);
    if (pending.length > 0) return { round, matches: pending };
  }
  return null;
}
