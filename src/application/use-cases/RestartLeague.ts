import type { LeagueRepository } from "../ports/LeagueRepository";
import { LeagueNotFoundError } from "../errors";

export class RestartLeague {
  constructor(private readonly repository: LeagueRepository) {}

  async execute(code: string): Promise<void> {
    const league = await this.repository.findByCode(code);
    if (!league) throw new LeagueNotFoundError();
    league.league.restart();
    await this.repository.save(code, league.league);
  }
}
