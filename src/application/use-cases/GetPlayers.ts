import { MAX_PLAYERS, MIN_PLAYERS } from "@/domain";
import type { LeagueRepository } from "../ports/LeagueRepository";
import { type LeagueStatus, type PlayerView, toPlayerView } from "../views";

export interface PlayersView {
  status: LeagueStatus;
  players: PlayerView[];
  minPlayers: number;
  maxPlayers: number;
}

export class GetPlayers {
  constructor(private readonly repository: LeagueRepository) {}

  async execute(): Promise<PlayersView> {
    const league = await this.repository.get();
    return {
      status: league.status,
      players: league.players.map(toPlayerView),
      minPlayers: MIN_PLAYERS,
      maxPlayers: MAX_PLAYERS,
    };
  }
}
