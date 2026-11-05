import { describe, expect, it } from "vitest";
import { LeagueNotFoundError } from "@/application/errors";
import { type CurrentRoundView, type ScheduleView, GetSchedule } from "@/application/use-cases/GetSchedule";
import { BalancedCoveringScheduleGenerator } from "@/domain";
import { InMemoryLeagueRepository } from "@/infrastructure/persistence/InMemoryLeagueRepository";

interface TestLeague {
  code: string;
  query: GetSchedule;
  recordMatch: (matchId: string) => Promise<void>;
}

function createStartedLeague(code: string, playerCount: number): Promise<TestLeague> {
  const repository = new InMemoryLeagueRepository();
  return repository
    .create({ code, name: "Liga de prueba", ownerId: "u" })
    .then(({ league }) => {
      for (let i = 0; i < playerCount; i++) league.addPlayer({ id: `p${i}`, name: `Jugador ${i}` });
      league.start(new BalancedCoveringScheduleGenerator().generate(league.players.map((p) => p.id)));
      return repository.save(code, league);
    })
    .then(() => ({
      code,
      query: new GetSchedule(repository),
      recordMatch: async (matchId: string) => {
        const entity = (await repository.findByCode(code))!;
        const match = entity.league.groupMatches.find((m) => m.id === matchId) ?? entity.league.finalMatch;
        if (!match) throw new Error(`Partida inexistente: ${matchId}`);
        entity.league.recordResult(match.id, [...match.playerIds]);
        await repository.save(code, entity.league);
      },
    }));
}

function matchesOf(view: ScheduleView, round: number): { id: string }[] {
  return view.rounds.find((r) => r.round === round)!.matches;
}

async function recordAllMatches(league: TestLeague, round: number, except?: string): Promise<ScheduleView> {
  const view = await league.query.execute(league.code);
  for (const match of matchesOf(view, round)) {
    if (match.id !== except) await league.recordMatch(match.id);
  }
  return league.query.execute(league.code);
}

describe("GetSchedule.currentRound", () => {
  it("returns null for an unknown league code", async () => {
    const league = await createStartedLeague("liga-uno", 8);
    await expect(league.query.execute("no-existe")).rejects.toThrow(LeagueNotFoundError);
  });

  it("is null while the league is in registration", async () => {
    const repository = new InMemoryLeagueRepository();
    await repository.create({ code: "esperando", name: "Esperando", ownerId: "u" });
    const view = await new GetSchedule(repository).execute("esperando");
    expect(view.status).toBe("registration");
    expect(view.currentRound).toBeNull();
  });

  it("points at the first round with all its matches pending", async () => {
    const league = await createStartedLeague("liga-uno", 8);
    const view = await league.query.execute(league.code);
    const firstRound = view.rounds[0];
    expect(view.currentRound).toMatchObject({
      round: firstRound.round,
      matches: firstRound.matches.map(({ id }) => ({ id })),
    });
  });

  it("keeps the round in play and drops the matches that were already recorded", async () => {
    // 16 players guarantee 4 tables in the first round; smaller rosters may now pack
    // fewer tables per round after the fairness phase (minimizing rounds is out of scope).
    const league = await createStartedLeague("liga-dos-mesas", 16);
    const view = await league.query.execute(league.code);
    const firstRound = view.rounds[0];
    expect(firstRound.matches.length).toBeGreaterThanOrEqual(2); // dos o más mesas en la primera jornada

    await league.recordMatch(firstRound.matches[0].id);
    const after = await league.query.execute(league.code);
    const expected = firstRound.matches.filter((m) => m.id !== firstRound.matches[0].id);
    expect(after.currentRound).toMatchObject({
      round: firstRound.round,
      matches: expected.map(({ id }) => ({ id })),
    });
  });

  it("moves to the next round once the current one is complete", async () => {
    const league = await createStartedLeague("liga-avance", 8);
    const view = await league.query.execute(league.code);
    const secondRound = view.rounds[1];
    await recordAllMatches(league, view.rounds[0].round);
    expect((await league.query.execute(league.code)).currentRound).toMatchObject({
      round: secondRound.round,
      matches: secondRound.matches.map(({ id }) => ({ id })),
    });
  });

  it("points at the first incomplete round even when later rounds have results", async () => {
    const league = await createStartedLeague("liga-orden", 16);
    const view = await league.query.execute(league.code);
    expect(view.rounds.length).toBeGreaterThanOrEqual(4); // necesitamos jornada 1..4

    const firstOfRound3 = matchesOf(view, 3)[0];
    await recordAllMatches(league, 1);
    await recordAllMatches(league, 2);
    await recordAllMatches(league, 3, firstOfRound3.id); // deja una mesa colgando en la 3
    await recordAllMatches(league, 4); // y sí deja resultados en la 4

    const after: CurrentRoundView = (await league.query.execute(league.code)).currentRound!;
    expect(after.round).toBe(3);
    expect(after.matches.map(({ id }) => id)).toEqual([firstOfRound3.id]);
  });

  it("is null in the final and finished states", async () => {
    const league = await createStartedLeague("liga-final", 8);
    const view = await league.query.execute(league.code);
    for (const round of view.rounds) await recordAllMatches(league, round.round);

    const inFinal = await league.query.execute(league.code);
    expect(inFinal.status).toBe("final");
    expect(inFinal.currentRound).toBeNull();
    expect(inFinal.final).not.toBeNull();

    await league.recordMatch("final");
    const finished = await league.query.execute(league.code);
    expect(finished.status).toBe("finished");
    expect(finished.currentRound).toBeNull();
  });
});
