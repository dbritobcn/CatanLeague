import type { LeagueRepository } from "../ports/LeagueRepository";
import { type LeagueStatus, type MatchView, type PlayerView, type StandingView, toMatchView, toPlayerView } from "../views";

export interface StandingsView {
  status: LeagueStatus;
  rows: StandingView[];
  final: MatchView | null;
  champion: PlayerView | null;
}

export class GetStandings {
  constructor(private readonly repository: LeagueRepository) {}

  async execute(): Promise<StandingsView> {
    const league = await this.repository.get();
    const final = league.finalMatch;
    const champion = league.champion;
    return {
      status: league.status,
      rows: league.standings().map((s, index) => ({
        position: index + 1,
        player: toPlayerView(s.player),
        points: s.points,
        played: s.played,
        finishes: [...s.finishes],
      })),
      final: final ? toMatchView(league, final) : null,
      champion: champion ? toPlayerView(champion) : null,
    };
  }
}
