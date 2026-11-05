import type { IdGenerator } from "../ports/IdGenerator";
import type { LeagueRepository } from "../ports/LeagueRepository";
import { LeagueNotFoundError } from "../errors";

export class AddPlayer {
  constructor(
    private readonly repository: LeagueRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(code: string, name: string): Promise<void> {
    const league = await this.repository.findByCode(code);
    if (!league) throw new LeagueNotFoundError();
    league.league.addPlayer({ id: this.ids.next(), name });
    await this.repository.save(code, league.league);
  }
}
