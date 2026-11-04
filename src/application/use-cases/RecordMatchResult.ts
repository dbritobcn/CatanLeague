import type { LeagueRepository } from "../ports/LeagueRepository";
import { LeagueNotFoundError } from "../errors";

export class RecordMatchResult {
  constructor(private readonly repository: LeagueRepository) {}

  /** `ranking` lists player ids from 1st to 4th position. */
  async execute(code: string, matchId: string, ranking: string[]): Promise<void> {
    const league = await this.repository.findByCode(code);
    if (!league) throw new LeagueNotFoundError();
    league.league.recordResult(matchId, ranking);
    await this.repository.save(code, league.league);
  }
}
