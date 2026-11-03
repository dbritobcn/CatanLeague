import type { LeagueRepository } from "../ports/LeagueRepository";

export class RecordMatchResult {
  constructor(private readonly repository: LeagueRepository) {}

  /** `ranking` lists player ids from 1st to 4th position. */
  async execute(matchId: string, ranking: string[]): Promise<void> {
    const league = await this.repository.get();
    league.recordResult(matchId, ranking);
    await this.repository.save(league);
  }
}
