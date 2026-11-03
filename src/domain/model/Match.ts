import type { PlayerId } from "./Player";

export type MatchPhase = "group" | "final";

export interface Match {
  readonly id: string;
  readonly number: number;
  readonly round: number;
  readonly phase: MatchPhase;
  readonly playerIds: readonly PlayerId[];
  /** Player ids ordered by finishing position (index 0 = winner), or null if not played yet. */
  readonly ranking: readonly PlayerId[] | null;
}

/** A match as planned by the schedule generator, before it becomes part of a league. */
export interface Fixture {
  readonly round: number;
  readonly playerIds: readonly PlayerId[];
}

export function isPlayed(match: Match): boolean {
  return match.ranking !== null;
}

/** Order-independent key identifying the set of participants of a match. */
export function lineupKey(playerIds: readonly PlayerId[]): string {
  return [...playerIds].sort().join("|");
}
