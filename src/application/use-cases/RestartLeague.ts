import type { LeagueRepository } from "../ports/LeagueRepository";

export class RestartLeague {
  constructor(private readonly repository: LeagueRepository) {}

  async execute(): Promise<void> {
    const league = await this.repository.get();
    league.restart();
    await this.repository.save(league);
  }
}
