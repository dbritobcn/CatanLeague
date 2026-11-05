import type { Fixture } from "@/domain";

/**
 * Independent schedule statistics for fairness tests: every metric is recomputed from the
 * final fixtures alone (never from generator internals), so regressions cannot hide behind
 * bookkeeping bugs. Player ids are opaque strings; pairs are keyed "a|b" with a < b.
 */
export interface QualityTuple {
  coupled: number;
  maxMeetings: number;
  sumSquares: number;
}

export interface ScheduleStats {
  matches: number;
  uniqueLineups: number;
  /** Participations per player, aligned with the `playerIds` argument order. */
  games: number[];
  equalGames: boolean;
  coveredPairs: number;
  allPairsCovered: boolean;
  pairMeetings: Map<string, number>;
  /** Meetings count -> number of pairs with that count (covered pairs only). */
  distribution: Map<number, number>;
  coupledKeys: string[];
  maxMeetings: number;
  sumSquares: number;
  tuple: QualityTuple;
}

export function computeScheduleStats(
  fixtures: readonly Fixture[],
  playerIds: readonly string[],
): ScheduleStats {
  const games = new Map(playerIds.map((id) => [id, 0]));
  const pairMeetings = new Map<string, number>();
  const lineupKeys = new Set<string>();

  for (const fixture of fixtures) {
    const ids = [...fixture.playerIds];
    for (const id of ids) games.set(id, (games.get(id) ?? 0) + 1);
    lineupKeys.add([...ids].sort().join("|"));
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = [ids[i], ids[j]].sort().join("|");
        pairMeetings.set(key, (pairMeetings.get(key) ?? 0) + 1);
      }
    }
  }

  const gamesOf = playerIds.map((id) => games.get(id) ?? 0);
  const distribution = new Map<number, number>();
  const coupledKeys: string[] = [];
  let maxMeetings = 0;
  let sumSquares = 0;

  for (const [key, meetings] of pairMeetings) {
    maxMeetings = Math.max(maxMeetings, meetings);
    sumSquares += meetings * meetings;
    distribution.set(meetings, (distribution.get(meetings) ?? 0) + 1);
    const [a, b] = key.split("|");
    if (meetings === (games.get(a) ?? 0) && meetings === (games.get(b) ?? 0)) coupledKeys.push(key);
  }

  const expectedPairs = (playerIds.length * (playerIds.length - 1)) / 2;
  return {
    matches: fixtures.length,
    uniqueLineups: lineupKeys.size,
    games: gamesOf,
    equalGames: Math.max(...gamesOf) === Math.min(...gamesOf),
    coveredPairs: pairMeetings.size,
    allPairsCovered: pairMeetings.size === expectedPairs,
    pairMeetings,
    distribution,
    coupledKeys,
    maxMeetings,
    sumSquares,
    tuple: { coupled: coupledKeys.length, maxMeetings, sumSquares },
  };
}

/** Lexicographic comparison of quality tuples: fewer coupled pairs, then lower max, then lower concentration. */
export function lexCompare(a: QualityTuple, b: QualityTuple): number {
  if (a.coupled !== b.coupled) return a.coupled - b.coupled;
  if (a.maxMeetings !== b.maxMeetings) return a.maxMeetings - b.maxMeetings;
  return a.sumSquares - b.sumSquares;
}

/** Deterministic PRNG so tests and captured baselines share the exact same input orders. */
export function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle of a copy, seeded and reproducible. */
export function permuted<T>(items: readonly T[], seed: number): T[] {
  const random = mulberry32(seed);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const playersOf = (n: number): string[] => Array.from({ length: n }, (_, i) => `p${i}`);
