import type { IdGenerator } from "../ports/IdGenerator";
import type { LeagueRepository } from "../ports/LeagueRepository";

export class AddPlayer {
  constructor(
    private readonly repository: LeagueRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(name: string): Promise<void> {
    const league = await this.repository.get();
    league.addPlayer({ id: this.ids.next(), name });
    await this.repository.save(league);
  }
}
