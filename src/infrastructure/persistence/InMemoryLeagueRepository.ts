import type { LeagueRepository } from "@/application/ports/LeagueRepository";
import { League, type LeagueSnapshot } from "@/domain";

export class InMemoryLeagueRepository implements LeagueRepository {
  private snapshot: LeagueSnapshot | null = null;

  async get(): Promise<League> {
    return this.snapshot ? League.fromSnapshot(structuredClone(this.snapshot)) : League.create();
  }

  async save(league: League): Promise<void> {
    this.snapshot = structuredClone(league.toSnapshot());
  }
}
