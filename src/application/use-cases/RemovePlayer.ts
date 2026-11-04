import type { LeagueRepository } from "../ports/LeagueRepository";
import { LeagueNotFoundError } from "../errors";

export class RemovePlayer {
  constructor(private readonly repository: LeagueRepository) {}

  async execute(code: string, playerId: string): Promise<void> {
    const league = await this.repository.findByCode(code);
    if (!league) throw new LeagueNotFoundError();
    league.league.removePlayer(playerId);
    await this.repository.save(code, league.league);
  }
}
