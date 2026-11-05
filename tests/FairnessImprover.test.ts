import { describe, expect, it } from "vitest";
import { improveFairness, pairingQuality } from "@/domain/services/FairnessImprover";

/**
 * Handcrafted schedules whose quality tuples were verified independently (Python) before
 * being pinned here, so these expectations are not circular with the implementation.
 */
const COUPLED_PAIR_CASE: readonly (readonly number[])[] = [[0, 1, 2, 3], [0, 1, 4, 5]];

/** Six players, three matches, two participations each: the mathematically forced coupling. */
const FORCED_COUPLED_TRIPLE: readonly (readonly number[])[] = [
  [0, 1, 2, 3],
  [0, 1, 4, 5],
  [2, 3, 4, 5],
];

/** Verified 10-player construction: tuple (0, 2, 90), the optimum for this size. */
const WITNESS_TEN: readonly (readonly number[])[] = [
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

/** WITNESS_TEN after a single player swap between two lineups: still 10 matches and four
 * participations per player, but one pair meets three times → the guarantee is broken. */
const DEFECTIVE_TEN: readonly (readonly number[])[] = [
  [1, 5, 6, 7],
  [3, 4, 7, 8],
  [0, 2, 4, 7],
  [2, 3, 6, 8],
  [0, 1, 2, 3],
  [1, 6, 7, 9],
  [0, 5, 8, 9],
  [0, 4, 5, 6],
  [1, 2, 5, 9],
  [3, 4, 8, 9],
];

const ZERO_BUDGET = { maxCandidates: 0, maxSweeps: 0 };

const gamesPerPlayer = (lineups: readonly (readonly number[])[]): number[] => {
  const games = new Array<number>(10).fill(0);
  for (const lineup of lineups) for (const player of lineup) games[player]++;
  return games;
};

describe("pairingQuality", () => {
  it("counts coupled pairs, worst pair count and concentration", () => {
    expect(pairingQuality(COUPLED_PAIR_CASE, 6)).toEqual({ coupled: 3, maxMeetings: 2, sumSquares: 14 });
  });

  it("counts the three forced coupled pairs of the six-player minimum schedule", () => {
    expect(pairingQuality(FORCED_COUPLED_TRIPLE, 6)).toEqual({
      coupled: 3,
      maxMeetings: 2,
      sumSquares: 24,
    });
  });

  it("computes the optimum of the verified 10-player construction", () => {
    expect(pairingQuality(WITNESS_TEN, 10)).toEqual({ coupled: 0, maxMeetings: 2, sumSquares: 90 });
  });
});

describe("improveFairness", () => {
  it("accepts the unavoidable coupling of six players without adding matches", () => {
    // No valid swap strictly improves this schedule (verified exhaustively), so the search
    // must return it unchanged instead of rejecting it or inventing extra lineups.
    expect(improveFairness(FORCED_COUPLED_TRIPLE, 6)).toEqual(FORCED_COUPLED_TRIPLE);
  });

  it("returns the input untouched when the search budget is zero", () => {
    expect(improveFairness(FORCED_COUPLED_TRIPLE, 6, ZERO_BUDGET)).toEqual(FORCED_COUPLED_TRIPLE);
  });

  it("does not mutate its input", () => {
    const input = [
      [0, 1, 2, 3],
      [0, 1, 4, 5],
      [2, 3, 4, 5],
    ];
    const snapshot = JSON.parse(JSON.stringify(input)) as typeof input;

    improveFairness(input, 6);

    expect(input).toEqual(snapshot);
  });

  it("is deterministic for the same input", () => {
    expect(improveFairness(DEFECTIVE_TEN, 10)).toEqual(improveFairness(DEFECTIVE_TEN, 10));
  });

  it("repairs a defective 10-player schedule within the default budget", () => {
    const repaired = improveFairness(DEFECTIVE_TEN, 10);

    expect(repaired).toHaveLength(10);
    expect(gamesPerPlayer(repaired)).toEqual([4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
    expect(pairingQuality(repaired, 10)).toEqual({ coupled: 0, maxMeetings: 2, sumSquares: 90 });
  });

  it("falls back to the verified 10-player construction when the budget is exhausted", () => {
    // Zero budget: the search cannot repair anything, so the guarantee must come from the
    // verified construction rather than from luck.
    const guaranteed = improveFairness(DEFECTIVE_TEN, 10, ZERO_BUDGET);

    expect(guaranteed).toEqual(WITNESS_TEN);
    expect(pairingQuality(guaranteed, 10)).toEqual({ coupled: 0, maxMeetings: 2, sumSquares: 90 });
  });

  it("never worsens quality when the budget runs out after a few candidates", () => {
    const tinyBudget = { maxCandidates: 1, maxSweeps: 1 };
    const result = improveFairness(DEFECTIVE_TEN, 10, tinyBudget);
    const quality = pairingQuality(result, 10);
    const initial = pairingQuality(DEFECTIVE_TEN, 10);

    const notWorse =
      quality.coupled < initial.coupled ||
      (quality.coupled === initial.coupled &&
        (quality.maxMeetings < initial.maxMeetings ||
          (quality.maxMeetings === initial.maxMeetings && quality.sumSquares <= initial.sumSquares)));
    expect(notWorse).toBe(true);
    expect(result).toHaveLength(10);
  });
});
