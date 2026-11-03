import { describe, expect, it } from "vitest";
import { BalancedCoveringScheduleGenerator, DomainError, League } from "@/domain";

function startedLeague(names: string[]): League {
  const league = League.create();
  names.forEach((name, i) => league.addPlayer({ id: `p${i}`, name }));
  league.start(new BalancedCoveringScheduleGenerator().generate(league.players.map((p) => p.id)));
  return league;
}

describe("League", () => {
  it("rejects duplicated names and starting with too few players", () => {
    const league = League.create();
    league.addPlayer({ id: "a", name: "Ana" });
    expect(() => league.addPlayer({ id: "b", name: " ana " })).toThrow(DomainError);
    expect(() => league.start([])).toThrow(/al menos 5/);
  });

  it("rejects a schedule with repeated lineups", () => {
    const league = League.create();
    ["A", "B", "C", "D", "E"].forEach((n) => league.addPlayer({ id: n, name: n }));
    const lineup = { round: 1, playerIds: ["A", "B", "C", "D"] };
    expect(() => league.start([lineup, { ...lineup, round: 2 }])).toThrow(/repite/);
  });

  it("awards 3/2/1/0 points and creates the final with the top 4 after the last result", () => {
    const league = startedLeague(["Ana", "Bea", "Carlos", "Dani", "Eva", "Fran"]);
    const strength = ["p0", "p1", "p2", "p3", "p4", "p5"];

    for (const match of league.groupMatches) {
      expect(league.status).toBe("group_stage");
      const ranking = [...match.playerIds].sort((a, b) => strength.indexOf(a) - strength.indexOf(b));
      league.recordResult(match.id, ranking);
    }

    expect(league.status).toBe("final");
    const standings = league.standings();
    expect(standings[0].player.id).toBe("p0");
    expect(standings[0].points).toBe(3 * standings[0].played);
    expect(league.finalMatch?.playerIds).toEqual(standings.slice(0, 4).map((s) => s.player.id));

    league.recordResult("final", ["p3", "p0", "p1", "p2"]);
    expect(league.status).toBe("finished");
    expect(league.champion?.name).toBe("Dani");
    expect(() => league.recordResult(league.groupMatches[0].id, [...league.groupMatches[0].playerIds])).toThrow(
      DomainError,
    );
  });

  it("rejects a ranking that does not match the match players", () => {
    const league = startedLeague(["A", "B", "C", "D", "E"]);
    const match = league.groupMatches[0];
    const outsider = league.players.find((p) => !match.playerIds.includes(p.id))!.id;
    expect(() => league.recordResult(match.id, [...match.playerIds.slice(0, 3), outsider])).toThrow(DomainError);
  });
});
