import type { LeagueRepository, LeagueSummary } from "../ports/LeagueRepository";

export class ListLeagues {
  constructor(private readonly repository: LeagueRepository) {}

  async execute(): Promise<LeagueSummary[]> {
    return this.repository.list();
  }
}
