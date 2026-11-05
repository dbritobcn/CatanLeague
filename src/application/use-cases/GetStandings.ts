import type { LeagueRepository } from "../ports/LeagueRepository";
import { LeagueNotFoundError } from "../errors";
import { type LeagueStatus, type MatchView, type PlayerView, type StandingView, toMatchView, toPlayerView } from "../views";

export interface StandingsView {
  status: LeagueStatus;
  rows: StandingView[];
  final: MatchView | null;
  champion: PlayerView | null;
}

export class GetStandings {
  constructor(private readonly repository: LeagueRepository) {}

  async execute(code: string): Promise<StandingsView> {
    const league = await this.repository.findByCode(code);
    if (!league) throw new LeagueNotFoundError();
    const final = league.league.finalMatch;
    const champion = league.league.champion;
    return {
      status: league.league.status,
      rows: league.league.standings().map((s, index) => ({
        position: index + 1,
        player: toPlayerView(s.player),
        points: s.points,
        played: s.played,
        finishes: [...s.finishes],
      })),
      final: final ? toMatchView(league.league, final) : null,
      champion: champion ? toPlayerView(champion) : null,
    };
  }
}
