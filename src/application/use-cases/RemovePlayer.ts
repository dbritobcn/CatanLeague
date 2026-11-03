import type { LeagueRepository } from "../ports/LeagueRepository";

export class RemovePlayer {
  constructor(private readonly repository: LeagueRepository) {}

  async execute(playerId: string): Promise<void> {
    const league = await this.repository.get();
    league.removePlayer(playerId);
    await this.repository.save(league);
  }
}
