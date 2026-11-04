import { MAX_PLAYERS, MIN_PLAYERS } from "@/domain";
import type { LeagueRepository } from "../ports/LeagueRepository";
import { LeagueNotFoundError } from "../errors";
import { type LeagueStatus, type PlayerView, toPlayerView } from "../views";

export interface PlayersView {
  status: LeagueStatus;
  players: PlayerView[];
  minPlayers: number;
  maxPlayers: number;
}

export class GetPlayers {
  constructor(private readonly repository: LeagueRepository) {}

  async execute(code: string): Promise<PlayersView> {
    const league = await this.repository.findByCode(code);
    if (!league) throw new LeagueNotFoundError();
    return {
      status: league.league.status,
      players: league.league.players.map(toPlayerView),
      minPlayers: MIN_PLAYERS,
      maxPlayers: MAX_PLAYERS,
    };
  }
}
