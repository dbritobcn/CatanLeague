import type { LeagueRepository } from "../ports/LeagueRepository";
import { LeagueNotFoundError } from "../errors";

export interface LeagueInfo {
  readonly code: string;
  readonly name: string;
  readonly ownerId: string;
}

/** Read use case for ownership gates and league metadata in the UI. */
export class GetLeagueInfo {
  constructor(private readonly repository: LeagueRepository) {}

  async execute(code: string): Promise<LeagueInfo> {
    const league = await this.repository.findByCode(code);
    if (!league) throw new LeagueNotFoundError();
    return { code: league.code, name: league.name, ownerId: league.ownerId };
  }
}
