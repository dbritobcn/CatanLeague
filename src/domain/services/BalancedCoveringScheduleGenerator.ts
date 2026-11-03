import type { Fixture } from "../model/Match";
import type { PlayerId } from "../model/Player";
import { PLAYERS_PER_MATCH } from "../model/Scoring";
import type { ScheduleGenerator } from "./ScheduleGenerator";

/** A lineup expressed as indexes into the list of players. */
type Lineup = readonly number[];

/** How many times the target number of games per player may be raised while balancing. */
const MAX_BALANCING_RAISES = 3;

/**
 * Deterministic greedy generator:
 *  1. Cover: keeps adding the unused lineup that introduces the most pairs of players who
 *     have not met yet, until every pair has met at least once.
 *  2. Balance: adds unused lineups so that every player ends up playing the same number of
 *     games (best effort), so the classification is fair.
 *  3. Rounds: packs the matches into rounds where nobody plays twice.
 *
 * Same input order produces the same schedule; shuffle the players beforehand for variety.
 */
export class BalancedCoveringScheduleGenerator implements ScheduleGenerator {
  generate(playerIds: readonly PlayerId[]): Fixture[] {
    const n = playerIds.length;
    if (n < PLAYERS_PER_MATCH) return [];

    const candidates = combinations(n, PLAYERS_PER_MATCH);
    const plan = new Plan(n);
    this.coverAllPairs(candidates, plan);
    this.balanceGamesPerPlayer(candidates, plan);

    return assignRounds(plan.lineups).map(({ round, lineup }) => ({
      round,
      playerIds: lineup.map((index) => playerIds[index]),
    }));
  }

  private coverAllPairs(candidates: readonly Lineup[], plan: Plan): void {
    while (plan.unmetPairs > 0) {
      let best: Lineup | null = null;
      let bestNewPairs = 0;
      let bestLoad = Infinity;

      for (const lineup of candidates) {
        if (plan.isUsed(lineup)) continue;
        const newPairs = plan.newPairs(lineup);
        if (newPairs === 0) continue;
        const load = plan.load(lineup);
        if (newPairs > bestNewPairs || (newPairs === bestNewPairs && load < bestLoad)) {
          best = lineup;
          bestNewPairs = newPairs;
          bestLoad = load;
        }
      }

      if (!best) throw new Error("No lineup left to cover the remaining pairs");
      plan.add(best);
    }
  }

  private balanceGamesPerPlayer(candidates: readonly Lineup[], plan: Plan): void {
    const n = plan.games.length;
    const step = PLAYERS_PER_MATCH / gcd(n, PLAYERS_PER_MATCH);
    let target = Math.max(...plan.games);
    while ((n * target - plan.totalSlots()) % PLAYERS_PER_MATCH !== 0) target++;

    let raises = 0;
    while (true) {
      const deficits = plan.games.map((games) => target - games);
      const remaining = sum(deficits);
      if (remaining === 0) return;

      const next = this.pickBalancingLineup(candidates, plan, deficits, remaining);
      if (next) {
        plan.add(next);
        continue;
      }
      if (raises++ >= MAX_BALANCING_RAISES) return;
      target += step;
    }
  }

  private pickBalancingLineup(
    candidates: readonly Lineup[],
    plan: Plan,
    deficits: readonly number[],
    remaining: number,
  ): Lineup | null {
    let best: Lineup | null = null;
    let bestDeficit = -1;
    let bestRepeats = Infinity;

    for (const lineup of candidates) {
      if (plan.isUsed(lineup) || lineup.some((p) => deficits[p] <= 0)) continue;
      if (!keepsBalancingFeasible(lineup, deficits, remaining)) continue;

      const deficit = lineup.reduce((acc, p) => acc + deficits[p], 0);
      const repeats = plan.repeatedMeetings(lineup);
      if (deficit > bestDeficit || (deficit === bestDeficit && repeats < bestRepeats)) {
        best = lineup;
        bestDeficit = deficit;
        bestRepeats = repeats;
      }
    }
    return best;
  }
}

/** Mutable bookkeeping of the lineups chosen so far. */
class Plan {
  readonly lineups: Lineup[] = [];
  readonly games: number[];
  unmetPairs: number;
  private readonly meetings: number[][];
  private readonly used = new Set<string>();

  constructor(size: number) {
    this.games = new Array(size).fill(0);
    this.meetings = Array.from({ length: size }, () => new Array(size).fill(0));
    this.unmetPairs = (size * (size - 1)) / 2;
  }

  add(lineup: Lineup): void {
    this.lineups.push(lineup);
    this.used.add(lineup.join(","));
    for (const p of lineup) this.games[p]++;
    forEachPair(lineup, (a, b) => {
      if (this.meetings[a][b] === 0) this.unmetPairs--;
      this.meetings[a][b]++;
      this.meetings[b][a]++;
    });
  }

  isUsed(lineup: Lineup): boolean {
    return this.used.has(lineup.join(","));
  }

  newPairs(lineup: Lineup): number {
    let count = 0;
    forEachPair(lineup, (a, b) => {
      if (this.meetings[a][b] === 0) count++;
    });
    return count;
  }

  repeatedMeetings(lineup: Lineup): number {
    let count = 0;
    forEachPair(lineup, (a, b) => {
      count += this.meetings[a][b];
    });
    return count;
  }

  load(lineup: Lineup): number {
    return lineup.reduce((acc, p) => acc + this.games[p], 0);
  }

  totalSlots(): number {
    return sum(this.games);
  }
}

/**
 * Remaining deficits can still be split into lineups of 4 distinct players only if nobody
 * needs more games than there will be matches left.
 */
function keepsBalancingFeasible(lineup: Lineup, deficits: readonly number[], remaining: number): boolean {
  const matchesLeft = (remaining - PLAYERS_PER_MATCH) / PLAYERS_PER_MATCH;
  return deficits.every((d, p) => (lineup.includes(p) ? d - 1 : d) <= matchesLeft);
}

function assignRounds(lineups: readonly Lineup[]): { round: number; lineup: Lineup }[] {
  const rounds: Set<number>[] = [];
  const assigned = lineups.map((lineup) => {
    let index = rounds.findIndex((busy) => lineup.every((p) => !busy.has(p)));
    if (index === -1) index = rounds.push(new Set()) - 1;
    lineup.forEach((p) => rounds[index].add(p));
    return { round: index + 1, lineup };
  });
  return assigned.sort((a, b) => a.round - b.round);
}

function combinations(n: number, k: number): Lineup[] {
  const result: Lineup[] = [];
  const current: number[] = [];
  const walk = (start: number) => {
    if (current.length === k) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < n; i++) {
      current.push(i);
      walk(i + 1);
      current.pop();
    }
  };
  walk(0);
  return result;
}

function forEachPair(lineup: Lineup, fn: (a: number, b: number) => void): void {
  for (let i = 0; i < lineup.length; i++) {
    for (let j = i + 1; j < lineup.length; j++) fn(lineup[i], lineup[j]);
  }
}

function sum(values: readonly number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
