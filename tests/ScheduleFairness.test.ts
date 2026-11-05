import { describe, expect, it } from "vitest";
import { BalancedCoveringScheduleGenerator } from "@/domain";
import type { Shuffler } from "@/application/ports/Shuffler";
import { AddPlayer } from "@/application/use-cases/AddPlayer";
import { CreateLeague } from "@/application/use-cases/CreateLeague";
import { RecordMatchResult } from "@/application/use-cases/RecordMatchResult";
import { RestartLeague } from "@/application/use-cases/RestartLeague";
import { StartLeague } from "@/application/use-cases/StartLeague";
import { InMemoryLeagueRepository } from "@/infrastructure/persistence/InMemoryLeagueRepository";
import { computeScheduleStats, lexCompare, permuted, playersOf } from "./support/scheduleMetrics";

const generator = new BalancedCoveringScheduleGenerator();

/** Roster of the reference 10-player league where Theresa and David were coupled. */
export const REFERENCE_ROSTER = [
  "Iria",
  "Adri",
  "Carmen",
  "Lucas",
  "Xavi",
  "Ingrid",
  "Isis",
  "Alberto",
  "David",
  "Theresa",
];

/**
 * Baseline captured from the generator BEFORE this change (see change improve-schedule-fairness,
 * task 1.1): matches, games per player and quality tuple (C, M, S) per league size and input
 * permutation seed (0 = identity order, 1..3 = seeded shuffles shared with the tests).
 * Captured cost with the base generator at n=24: ~74 ms/generate over 66 matches.
 */
const BASELINE: Record<string, { matches: number; games: number; tuple: [number, number, number] }> = {
  n5s0: { matches: 5, games: 4, tuple: [0, 3, 90] },
  n5s1: { matches: 5, games: 4, tuple: [0, 3, 90] },
  n5s2: { matches: 5, games: 4, tuple: [0, 3, 90] },
  n5s3: { matches: 5, games: 4, tuple: [0, 3, 90] },
  n6s0: { matches: 3, games: 2, tuple: [3, 2, 24] },
  n6s1: { matches: 3, games: 2, tuple: [3, 2, 24] },
  n6s2: { matches: 3, games: 2, tuple: [3, 2, 24] },
  n6s3: { matches: 3, games: 2, tuple: [3, 2, 24] },
  n7s0: { matches: 7, games: 4, tuple: [0, 3, 92] },
  n7s1: { matches: 7, games: 4, tuple: [0, 3, 92] },
  n7s2: { matches: 7, games: 4, tuple: [0, 3, 92] },
  n7s3: { matches: 7, games: 4, tuple: [0, 3, 92] },
  n8s0: { matches: 6, games: 3, tuple: [4, 3, 60] },
  n8s1: { matches: 6, games: 3, tuple: [4, 3, 60] },
  n8s2: { matches: 6, games: 3, tuple: [4, 3, 60] },
  n8s3: { matches: 6, games: 3, tuple: [4, 3, 60] },
  n9s0: { matches: 9, games: 4, tuple: [2, 4, 104] },
  n9s1: { matches: 9, games: 4, tuple: [2, 4, 104] },
  n9s2: { matches: 9, games: 4, tuple: [2, 4, 104] },
  n9s3: { matches: 9, games: 4, tuple: [2, 4, 104] },
  n10s0: { matches: 10, games: 4, tuple: [1, 4, 98] },
  n10s1: { matches: 10, games: 4, tuple: [1, 4, 98] },
  n10s2: { matches: 10, games: 4, tuple: [1, 4, 98] },
  n10s3: { matches: 10, games: 4, tuple: [1, 4, 98] },
  n11s0: { matches: 22, games: 8, tuple: [0, 5, 344] },
  n11s1: { matches: 22, games: 8, tuple: [0, 5, 344] },
  n11s2: { matches: 22, games: 8, tuple: [0, 5, 344] },
  n11s3: { matches: 22, games: 8, tuple: [0, 5, 344] },
  n12s0: { matches: 18, games: 6, tuple: [0, 4, 218] },
  n12s1: { matches: 18, games: 6, tuple: [0, 4, 218] },
  n12s2: { matches: 18, games: 6, tuple: [0, 4, 218] },
  n12s3: { matches: 18, games: 6, tuple: [0, 4, 218] },
  n13s0: { matches: 26, games: 8, tuple: [0, 4, 336] },
  n13s1: { matches: 26, games: 8, tuple: [0, 4, 336] },
  n13s2: { matches: 26, games: 8, tuple: [0, 4, 336] },
  n13s3: { matches: 26, games: 8, tuple: [0, 4, 336] },
  n14s0: { matches: 21, games: 6, tuple: [0, 3, 204] },
  n14s1: { matches: 21, games: 6, tuple: [0, 3, 204] },
  n14s2: { matches: 21, games: 6, tuple: [0, 3, 204] },
  n14s3: { matches: 21, games: 6, tuple: [0, 3, 204] },
  n15s0: { matches: 30, games: 8, tuple: [0, 3, 336] },
  n15s1: { matches: 30, games: 8, tuple: [0, 3, 336] },
  n15s2: { matches: 30, games: 8, tuple: [0, 3, 336] },
  n15s3: { matches: 30, games: 8, tuple: [0, 3, 336] },
  n16s0: { matches: 20, games: 5, tuple: [0, 1, 120] },
  n16s1: { matches: 20, games: 5, tuple: [0, 1, 120] },
  n16s2: { matches: 20, games: 5, tuple: [0, 1, 120] },
  n16s3: { matches: 20, games: 5, tuple: [0, 1, 120] },
  n17s0: { matches: 34, games: 8, tuple: [0, 3, 342] },
  n17s1: { matches: 34, games: 8, tuple: [0, 3, 342] },
  n17s2: { matches: 34, games: 8, tuple: [0, 3, 342] },
  n17s3: { matches: 34, games: 8, tuple: [0, 3, 342] },
  n18s0: { matches: 36, games: 8, tuple: [0, 3, 352] },
  n18s1: { matches: 36, games: 8, tuple: [0, 3, 352] },
  n18s2: { matches: 36, games: 8, tuple: [0, 3, 352] },
  n18s3: { matches: 36, games: 8, tuple: [0, 3, 352] },
  n19s0: { matches: 38, games: 8, tuple: [0, 3, 348] },
  n19s1: { matches: 38, games: 8, tuple: [0, 3, 348] },
  n19s2: { matches: 38, games: 8, tuple: [0, 3, 348] },
  n19s3: { matches: 38, games: 8, tuple: [0, 3, 348] },
  n20s0: { matches: 35, games: 7, tuple: [0, 2, 250] },
  n20s1: { matches: 35, games: 7, tuple: [0, 2, 250] },
  n20s2: { matches: 35, games: 7, tuple: [0, 2, 250] },
  n20s3: { matches: 35, games: 7, tuple: [0, 2, 250] },
  n21s0: { matches: 63, games: 12, tuple: [0, 4, 738] },
  n21s1: { matches: 63, games: 12, tuple: [0, 4, 738] },
  n21s2: { matches: 63, games: 12, tuple: [0, 4, 738] },
  n21s3: { matches: 63, games: 12, tuple: [0, 4, 738] },
  n22s0: { matches: 55, games: 10, tuple: [0, 3, 544] },
  n22s1: { matches: 55, games: 10, tuple: [0, 3, 544] },
  n22s2: { matches: 55, games: 10, tuple: [0, 3, 544] },
  n22s3: { matches: 55, games: 10, tuple: [0, 3, 544] },
  n23s0: { matches: 69, games: 12, tuple: [0, 4, 766] },
  n23s1: { matches: 69, games: 12, tuple: [0, 4, 766] },
  n23s2: { matches: 69, games: 12, tuple: [0, 4, 766] },
  n23s3: { matches: 69, games: 12, tuple: [0, 4, 766] },
  n24s0: { matches: 66, games: 11, tuple: [0, 3, 654] },
  n24s1: { matches: 66, games: 11, tuple: [0, 3, 654] },
  n24s2: { matches: 66, games: 11, tuple: [0, 3, 654] },
  n24s3: { matches: 66, games: 11, tuple: [0, 3, 654] },
};

const playersFor = (n: number, seed: number): string[] =>
  seed === 0 ? playersOf(n) : permuted(playersOf(n), seed);

/** No player appears twice in the same round (jornada). */
function expectDisjointRounds(fixtures: ReturnType<typeof generator.generate>): void {
  const perRound = new Map<number, string[]>();
  for (const fixture of fixtures) {
    perRound.set(fixture.round, [...(perRound.get(fixture.round) ?? []), ...fixture.playerIds]);
  }
  for (const [round, players] of perRound) {
    expect(new Set(players).size).toBe(players.length); // every round is disjoint
    expect(round).toBeGreaterThan(0);
  }
}

describe("schedule fairness regression", () => {
  it("gives the reference 10-player league exactly two shared matches per pair at most", () => {
    const fixtures = generator.generate(REFERENCE_ROSTER);
    const stats = computeScheduleStats(fixtures, REFERENCE_ROSTER);

    expect(stats.matches).toBe(10);
    expect(stats.games).toEqual([4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
    expect(stats.allPairsCovered).toBe(true);
    expect(Object.fromEntries(stats.distribution)).toEqual({ 1: 30, 2: 15 });
    expectDisjointRounds(fixtures);

    const davidTheresa = stats.pairMeetings.get(["David", "Theresa"].sort().join("|"));
    expect(davidTheresa).toBeGreaterThanOrEqual(1);
    expect(davidTheresa).toBeLessThanOrEqual(2);
  });

  it("keeps the 10-player guarantee for other input orders and relabeled ids", () => {
    for (const seed of [1, 2, 3]) {
      const players = permuted(REFERENCE_ROSTER, seed);
      const fixtures = generator.generate(players);
      const stats = computeScheduleStats(fixtures, players);

      expect(stats.matches).toBe(10);
      expect(stats.games.every((games) => games === 4)).toBe(true);
      expect(stats.allPairsCovered).toBe(true);
      expect(Object.fromEntries(stats.distribution)).toEqual({ 1: 30, 2: 15 });
      expectDisjointRounds(fixtures);
    }

    // Same structure with completely different identifiers.
    const relabeled = REFERENCE_ROSTER.map((_, i) => `player-${i}`);
    const relabeledStats = computeScheduleStats(generator.generate(relabeled), relabeled);
    expect(relabeledStats.matches).toBe(10);
    expect(relabeledStats.games.every((games) => games === 4)).toBe(true);
    expect(Object.fromEntries(relabeledStats.distribution)).toEqual({ 1: 30, 2: 15 });
  });

  it("does not worsen quality for any supported league size or seeded input order", () => {
    for (let n = 5; n <= 24; n++) {
      for (const seed of [0, 1, 2, 3]) {
        const players = playersFor(n, seed);
        const baseline = BASELINE[`n${n}s${seed}`];

        const fixtures = generator.generate(players);
        const stats = computeScheduleStats(fixtures, players);

        // Conservation: the fairness phase never adds matches nor changes participations.
        expect(stats.matches).toBe(baseline.matches);
        expect(stats.games.every((games) => games === baseline.games)).toBe(true);

        // Validity, recomputed independently for the final fixtures.
        expect(stats.uniqueLineups).toBe(stats.matches);
        expect(stats.allPairsCovered).toBe(true);
        expect(stats.equalGames).toBe(true);
        for (const fixture of fixtures) expect(new Set(fixture.playerIds).size).toBe(4);
        expectDisjointRounds(fixtures);

        // Quality: never worse than the pre-change generator.
        expect(
          lexCompare(stats.tuple, {
            coupled: baseline.tuple[0],
            maxMeetings: baseline.tuple[1],
            sumSquares: baseline.tuple[2],
          }),
        ).toBeLessThanOrEqual(0);
      }
    }
  });

  it("keeps three matches and two participations for six players, accepting forced coupling", () => {
    const players = playersOf(6);
    const stats = computeScheduleStats(generator.generate(players), players);

    // With 3 matches and 2 participations per player, each player rests exactly one match;
    // the three resting pairs are unavoidably coupled. The generator must accept that.
    expect(stats.matches).toBe(3);
    expect(stats.games.every((games) => games === 2)).toBe(true);
    expect(stats.allPairsCovered).toBe(true);
    expect(stats.coupledKeys).toHaveLength(3);
  });

  it("is deterministic for the same ordered input, including rounds", () => {
    expect(generator.generate(REFERENCE_ROSTER)).toEqual(generator.generate(REFERENCE_ROSTER));
  });

  it("does not regress the perfect 16-player schedule", () => {
    const players = playersOf(16);
    const stats = computeScheduleStats(generator.generate(players), players);

    // 20 matches × 6 pairs = 120 = every pair exactly once: a perfect covering design
    // that was already optimal before this change.
    expect(stats.matches).toBe(20);
    expect(stats.maxMeetings).toBe(1);
    expect(Object.fromEntries(stats.distribution)).toEqual({ 1: 120 });
  });
});

describe("league lifecycle keeps the fairness guarantees", () => {
  const ROSTER = REFERENCE_ROSTER;

  async function leagueWithPlayers(repository: InMemoryLeagueRepository) {
    await new CreateLeague(repository).execute({ title: "Liga Justa", ownerId: "user-1" });
    let nextId = 0;
    const addPlayer = new AddPlayer(repository, { next: () => `p${nextId++}` });
    for (const name of ROSTER) await addPlayer.execute("liga-justa", name);
    return repository;
  }

  it("start and restart produce schedules that satisfy the 10-player guarantee", async () => {
    const repository = new InMemoryLeagueRepository();
    await leagueWithPlayers(repository);
    const identityShuffler: Shuffler = { shuffle: (items) => [...items] };

    await new StartLeague(repository, generator, identityShuffler).execute("liga-justa");
    const started = (await repository.findByCode("liga-justa"))!;
    expect(started.league.status).toBe("group_stage");

    const playerIds = started.league.players.map((p) => p.id);
    const stats = computeScheduleStats(started.league.groupMatches.map(asFixture), playerIds);
    expect(Object.fromEntries(stats.distribution)).toEqual({ 1: 30, 2: 15 });

    // Restart discards the schedule; starting again regenerates a fair calendar.
    await new RestartLeague(repository).execute("liga-justa");
    await new StartLeague(repository, generator, identityShuffler).execute("liga-justa");
    const restarted = (await repository.findByCode("liga-justa"))!;
    const restartedStats = computeScheduleStats(
      restarted.league.groupMatches.map(asFixture),
      playerIds,
    );
    expect(restartedStats.matches).toBe(10);
    expect(Object.fromEntries(restartedStats.distribution)).toEqual({ 1: 30, 2: 15 });
  });

  it("loading and saving a league with results does not regenerate its schedule", async () => {
    const repository = new InMemoryLeagueRepository();
    await leagueWithPlayers(repository);
    const identityShuffler: Shuffler = { shuffle: (items) => [...items] };
    await new StartLeague(repository, generator, identityShuffler).execute("liga-justa");

    const { league } = (await repository.findByCode("liga-justa"))!;
    const first = league.groupMatches[0];
    await new RecordMatchResult(repository).execute("liga-justa", first.id, [...first.playerIds]);

    const afterResult = (await repository.findByCode("liga-justa"))!;
    await repository.save("liga-justa", afterResult.league); // round-trip through the repository
    const reloaded = (await repository.findByCode("liga-justa"))!;

    expect(reloaded.league.toSnapshot()).toEqual(afterResult.league.toSnapshot());
    expect(reloaded.league.groupMatches.map((m) => ({ id: m.id, round: m.round }))).toEqual(
      league.groupMatches.map((m) => ({ id: m.id, round: m.round })),
    );
    expect(reloaded.league.groupMatches[0].ranking).not.toBeNull();
  });
});

/** Matches are Fixture-compatible for the stats helpers. */
function asFixture(match: { round: number; playerIds: readonly string[] }) {
  return { round: match.round, playerIds: [...match.playerIds] };
}
