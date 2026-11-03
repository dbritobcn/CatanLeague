import type { LeagueRepository } from "../ports/LeagueRepository";
import { type LeagueStatus, type MatchView, toMatchView } from "../views";

export interface RoundView {
  round: number;
  matches: MatchView[];
}

export interface ScheduleView {
  status: LeagueStatus;
  rounds: RoundView[];
  final: MatchView | null;
  played: number;
  total: number;
}

export class GetSchedule {
  constructor(private readonly repository: LeagueRepository) {}

  async execute(): Promise<ScheduleView> {
    const league = await this.repository.get();
    const matches = league.groupMatches.map((m) => toMatchView(league, m));
    const rounds = new Map<number, MatchView[]>();
    for (const match of matches) {
      rounds.set(match.round, [...(rounds.get(match.round) ?? []), match]);
    }
    const final = league.finalMatch;
    return {
      status: league.status,
      rounds: [...rounds].map(([round, list]) => ({ round, matches: list })),
      final: final ? toMatchView(league, final) : null,
      played: matches.filter((m) => m.result).length,
      total: matches.length,
    };
  }
}
