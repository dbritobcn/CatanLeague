import type { League } from "@/domain";

export interface LeagueRepository {
  /** Returns the current league, or a fresh one in registration if none was saved yet. */
  get(): Promise<League>;
  save(league: League): Promise<void>;
}
