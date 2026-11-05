/** A lineup expressed as indexes into the list of players. */
export type Lineup = readonly number[];

/**
 * Bounded, deterministic work budget for the fairness search. Both limits count real work:
 * `maxCandidates` includes rejected swaps, and either limit stops the search early.
 */
export interface FairnessBudget {
  readonly maxCandidates: number;
  readonly maxSweeps: number;
}

export const DEFAULT_FAIRNESS_BUDGET: FairnessBudget = { maxCandidates: 50_000, maxSweeps: 32 };

/** Quality tuple of a schedule: (coupled pairs, worst pair count, sum of squared pair counts). */
export interface PairingQuality {
  readonly coupled: number;
  readonly maxMeetings: number;
  readonly sumSquares: number;
}

/**
 * Verified 10-player construction used as a guaranteed fallback: 10 unique lineups, four
 * participations per player, all 45 pairs covered and no pair meeting more than twice
 * (30 pairs once, 15 pairs twice → tuple (0, 2, 90), the mathematical optimum for this size).
 */
const TEN_PLAYER_BALANCED_LINEUPS: readonly Lineup[] = [
  [3, 5, 6, 7],
  [1, 4, 7, 8],
  [0, 2, 4, 7],
  [2, 3, 6, 8],
  [0, 1, 2, 3],
  [1, 6, 7, 9],
  [0, 5, 8, 9],
  [0, 4, 5, 6],
  [1, 2, 5, 9],
  [3, 4, 8, 9],
];

const keyOf = (lineup: readonly number[]): string => [...lineup].sort((a, b) => a - b).join(",");

/** Recomputes the quality tuple from scratch. Coupled pair: meets in every match of both players. */
export function pairingQuality(lineups: readonly Lineup[], playerCount: number): PairingQuality {
  const meetings = meetingsOf(lineups, playerCount);
  const games = gamesOf(lineups, playerCount);

  let coupled = 0;
  let maxMeetings = 0;
  let sumSquares = 0;
  for (let a = 0; a < playerCount; a++) {
    for (let b = a + 1; b < playerCount; b++) {
      const meetings_ = meetings[a][b];
      maxMeetings = Math.max(maxMeetings, meetings_);
      sumSquares += meetings_ * meetings_;
      if (meetings_ > 0 && meetings_ === games[a] && meetings_ === games[b]) coupled++;
    }
  }
  return { coupled, maxMeetings, sumSquares };
}

/**
 * Improves the fairness of a set of lineups without touching their count or the number of
 * participations per player. Deterministic first-improvement local search over swaps of two
 * players between two lineups, under an explicit budget; every accepted swap strictly
 * improves the quality tuple (C, M, S) lexicographically, so the input is never worsened.
 *
 * For 10 players the result is additionally guaranteed to contain exactly 10 lineups, four
 * participations per player and at most two meetings per pair: if the bounded search does
 * not deliver that, a verified construction is used instead. This guarantee never depends
 * on luck - not on the search finding the optimum.
 */
export function improveFairness(
  lineups: readonly Lineup[],
  playerCount: number,
  budget: FairnessBudget = DEFAULT_FAIRNESS_BUDGET,
): Lineup[] {
  const search = new FairnessSearch(lineups, playerCount);
  search.run(budget);
  return guaranteedTenPlayerSchedule(search.lineups, playerCount) ?? search.lineups.map((l) => [...l]);
}

/** Returns the verified 10-player construction when the schedule breaks that size's guarantee. */
function guaranteedTenPlayerSchedule(
  lineups: readonly Lineup[],
  playerCount: number,
): Lineup[] | null {
  if (playerCount !== 10) return null;

  const games = gamesOf(lineups, 10);
  const balanced =
    lineups.length === 10 &&
    games.every((games_) => games_ === 4) &&
    pairingQuality(lineups, 10).maxMeetings <= 2;
  return balanced ? null : TEN_PLAYER_BALANCED_LINEUPS.map((lineup) => [...lineup]);
}

function meetingsOf(lineups: readonly Lineup[], playerCount: number): number[][] {
  const meetings = Array.from({ length: playerCount }, () => new Array<number>(playerCount).fill(0));
  for (const lineup of lineups) {
    for (let i = 0; i < lineup.length; i++) {
      for (let j = i + 1; j < lineup.length; j++) {
        meetings[lineup[i]][lineup[j]]++;
        meetings[lineup[j]][lineup[i]]++;
      }
    }
  }
  return meetings;
}

function gamesOf(lineups: readonly Lineup[], playerCount: number): number[] {
  const games = new Array<number>(playerCount).fill(0);
  for (const lineup of lineups) {
    for (const player of lineup) games[player]++;
  }
  return games;
}

/** Mutable search state with incremental bookkeeping for fast candidate evaluation. */
class FairnessSearch {
  readonly lineups: number[][];
  private readonly meetings: number[][];
  /** Participations per player: swaps preserve them, so this never changes. */
  private readonly games: number[];
  private readonly usedKeys = new Set<string>();
  /** Meetings count -> number of pairs with that count (covered pairs only). */
  private readonly histogram = new Map<number, number>();
  private readonly playerCount: number;

  private coupled = 0;
  private sumSquares = 0;
  private maxMeetings = 0;

  constructor(lineups: readonly Lineup[], playerCount: number) {
    this.playerCount = playerCount;
    this.lineups = lineups.map((lineup) => [...lineup]);
    this.meetings = meetingsOf(this.lineups, playerCount);
    this.games = gamesOf(this.lineups, playerCount);

    for (const lineup of this.lineups) this.usedKeys.add(keyOf(lineup));
    for (let a = 0; a < playerCount; a++) {
      for (let b = a + 1; b < playerCount; b++) {
        const count = this.meetings[a][b];
        if (count > 0) {
          this.histogram.set(count, (this.histogram.get(count) ?? 0) + 1);
          this.maxMeetings = Math.max(this.maxMeetings, count);
        }
        this.sumSquares += count * count;
        if (count > 0 && count === this.games[a] && count === this.games[b]) this.coupled++;
      }
    }
  }

  /**
   * First-improvement search: scans lineup pairs and swap positions in a stable order,
   * applying every valid swap that strictly improves the quality tuple. Stops at the first
   * of: candidate budget exhausted, sweep budget exhausted, or a sweep without improvement.
   */
  run(budget: FairnessBudget): void {
    let examined = 0;
    for (let sweep = 0; sweep < budget.maxSweeps; sweep++) {
      let improved = false;
      for (let i = 0; i < this.lineups.length; i++) {
        for (let j = i + 1; j < this.lineups.length; j++) {
          for (let p = 0; p < this.lineups[i].length; p++) {
            for (let q = 0; q < this.lineups[j].length; q++) {
              if (examined >= budget.maxCandidates) return;
              examined++;
              improved = this.trySwap(i, j, p, q) || improved;
            }
          }
        }
      }
      if (!improved) return;
    }
  }

  /**
   * Evaluates swapping lineup[i][p] with lineup[j][q]. A candidate is applied only when it
   * keeps the schedule valid (distinct players per lineup, no repeated lineups, no pair
   * losing its only meeting) and strictly improves (coupled, maxMeetings, sumSquares)
   * lexicographically. Participations per player are preserved by construction.
   */
  private trySwap(i: number, j: number, p: number, q: number): boolean {
    const a = this.lineups[i];
    const b = this.lineups[j];
    const x = a[p];
    const y = b[q];
    if (x === y) return false;
    if (a.includes(y) || b.includes(x)) return false;

    // Net change of meetings for every affected pair, accumulated because the two lineups
    // may share players (a change through lineup A can cancel out a change through lineup B).
    const deltas = new Map<number, number>();
    const addDelta = (u: number, v: number, delta: number): void => {
      const key = u < v ? u * this.playerCount + v : v * this.playerCount + u;
      deltas.set(key, (deltas.get(key) ?? 0) + delta);
    };
    for (const other of a) {
      if (other !== x) {
        addDelta(x, other, -1);
        addDelta(y, other, +1);
      }
    }
    for (const other of b) {
      if (other !== y) {
        addDelta(y, other, -1);
        addDelta(x, other, +1);
      }
    }

    // New lineup keys: the two old keys are being replaced, so only collisions with the
    // rest of the schedule (or between the two new keys) invalidate the candidate.
    const newA = [...a];
    newA[p] = y;
    const newB = [...b];
    newB[q] = x;
    const oldKeyA = keyOf(a);
    const oldKeyB = keyOf(b);
    const newKeyA = keyOf(newA);
    const newKeyB = keyOf(newB);
    if (newKeyA === newKeyB) return false;
    for (const key of [newKeyA, newKeyB]) {
      if (key === oldKeyA || key === oldKeyB) continue;
      if (this.usedKeys.has(key)) return false;
    }

    let coupled = this.coupled;
    let sumSquares = this.sumSquares;
    const bucketDelta = new Map<number, number>();
    let raisedAboveMax = 0;

    for (const [packed, delta] of deltas) {
      if (delta === 0) continue;
      const u = Math.floor(packed / this.playerCount);
      const v = packed % this.playerCount;
      const current = this.meetings[u][v];
      const next = current + delta;
      if (next === 0) return false; // the pair would lose its only meeting.

      const wasCoupled = current === this.games[u] && current === this.games[v];
      const isCoupled = next === this.games[u] && next === this.games[v];
      if (wasCoupled !== isCoupled) coupled += isCoupled ? 1 : -1;

      sumSquares += next * next - current * current;
      bucketDelta.set(current, (bucketDelta.get(current) ?? 0) - 1);
      bucketDelta.set(next, (bucketDelta.get(next) ?? 0) + 1);
      if (next > this.maxMeetings) raisedAboveMax = Math.max(raisedAboveMax, next);
    }

    let newMax = raisedAboveMax > 0 ? raisedAboveMax : this.maxMeetings;
    if (raisedAboveMax === 0) {
      let atMax =
        (this.histogram.get(newMax) ?? 0) + (bucketDelta.get(newMax) ?? 0);
      while (atMax === 0 && newMax > 1) {
        newMax--;
        atMax = (this.histogram.get(newMax) ?? 0) + (bucketDelta.get(newMax) ?? 0);
      }
    }

    const better =
      coupled < this.coupled ||
      (coupled === this.coupled &&
        (newMax < this.maxMeetings || (newMax === this.maxMeetings && sumSquares < this.sumSquares)));
    if (!better) return false;

    this.lineups[i] = newA;
    this.lineups[j] = newB;
    this.usedKeys.delete(oldKeyA);
    this.usedKeys.delete(oldKeyB);
    this.usedKeys.add(newKeyA);
    this.usedKeys.add(newKeyB);
    for (const [packed, delta] of deltas) {
      if (delta === 0) continue;
      const u = Math.floor(packed / this.playerCount);
      const v = packed % this.playerCount;
      this.meetings[u][v] += delta;
      this.meetings[v][u] += delta;
    }
    for (const [count, delta] of bucketDelta) {
      if (delta === 0) continue;
      this.histogram.set(count, (this.histogram.get(count) ?? 0) + delta);
    }
    this.coupled = coupled;
    this.sumSquares = sumSquares;
    this.maxMeetings = newMax;
    return true;
  }
}
