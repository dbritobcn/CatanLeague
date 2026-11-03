import { describe, expect, it } from "vitest";
import { BalancedCoveringScheduleGenerator, lineupKey } from "@/domain";

const generator = new BalancedCoveringScheduleGenerator();
const playersOf = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);

describe("BalancedCoveringScheduleGenerator", () => {
  for (let n = 5; n <= 24; n++) {
    it(`builds a valid schedule for ${n} players`, () => {
      const players = playersOf(n);
      const fixtures = generator.generate(players);

      for (const f of fixtures) expect(new Set(f.playerIds).size).toBe(4);

      const keys = fixtures.map((f) => lineupKey(f.playerIds));
      expect(new Set(keys).size).toBe(keys.length);

      const pairs = new Set<string>();
      for (const f of fixtures) {
        const ids = [...f.playerIds].sort();
        for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) pairs.add(`${ids[i]}|${ids[j]}`);
      }
      expect(pairs.size).toBe((n * (n - 1)) / 2);

      const games = players.map((p) => fixtures.filter((f) => f.playerIds.includes(p)).length);
      expect(Math.max(...games)).toBe(Math.min(...games));

      for (const round of new Set(fixtures.map((f) => f.round))) {
        const inRound = fixtures.filter((f) => f.round === round).flatMap((f) => f.playerIds);
        expect(new Set(inRound).size).toBe(inRound.length);
      }
    });
  }
});
