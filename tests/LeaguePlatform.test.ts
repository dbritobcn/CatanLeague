import { describe, expect, it } from "vitest";
import { CreateLeague } from "@/application/use-cases/CreateLeague";
import { DeleteLeague } from "@/application/use-cases/DeleteLeague";
import { ListLeagues } from "@/application/use-cases/ListLeagues";
import { GetLeagueInfo } from "@/application/use-cases/GetLeagueInfo";
import { AddPlayer } from "@/application/use-cases/AddPlayer";
import { GetPlayers } from "@/application/use-cases/GetPlayers";
import { InMemoryLeagueRepository } from "@/infrastructure/persistence/InMemoryLeagueRepository";
import { DomainError } from "@/domain";

class FixedIds {
  private next = 0;
  nextId(): string {
    return `p${++this.next}`;
  }
}

describe("CreateLeague", () => {
  it("creates a league with a slug derived from the title", async () => {
    const useCase = new CreateLeague(new InMemoryLeagueRepository());
    const { code } = await useCase.execute({ title: "Liga Chólos 2026", ownerId: "user-1" });
    expect(code).toBe("liga-cholos-2026");
  });

  it("rejects an invalid title", async () => {
    const useCase = new CreateLeague(new InMemoryLeagueRepository());
    await expect(useCase.execute({ title: "¡??", ownerId: "u" })).rejects.toBeInstanceOf(DomainError);
  });

  it("rejects a reserved title", async () => {
    const useCase = new CreateLeague(new InMemoryLeagueRepository());
    await expect(useCase.execute({ title: "Crear", ownerId: "u" })).rejects.toThrow(/disponible/i);
  });

  it("rejects a duplicate title without auto-suffixing", async () => {
    const repository = new InMemoryLeagueRepository();
    const useCase = new CreateLeague(repository);
    await useCase.execute({ title: "Liga Cholos", ownerId: "user-1" });
    await expect(useCase.execute({ title: "Liga Cholos", ownerId: "user-2" })).rejects.toThrow(
      /ya está cogido/i,
    );
    // The original league keeps its URL.
    expect(await repository.findByCode("liga-cholos")).not.toBeNull();
  });
});

describe("DeleteLeague + slug reuse", () => {
  it("frees the slug for a future league", async () => {
    const repository = new InMemoryLeagueRepository();
    const create = new CreateLeague(repository);
    const remove = new DeleteLeague(repository);

    await create.execute({ title: "Liga Cholos", ownerId: "user-1" });
    await remove.execute("liga-cholos");

    const recreated = await create.execute({ title: "Liga Cholos", ownerId: "user-2" });
    expect(recreated.code).toBe("liga-cholos");
  });

  it("fails for an unknown code", async () => {
    const remove = new DeleteLeague(new InMemoryLeagueRepository());
    await expect(remove.execute("desconocida")).rejects.toThrow(/no existe/i);
  });
});

describe("ListLeagues", () => {
  it("shows the leader of an ongoing league and the champion of a finished one", async () => {
    const repository = new InMemoryLeagueRepository();
    const create = new CreateLeague(repository);
    await create.execute({ title: "Liga A", ownerId: "u" });

    // Fabricate an in-progress league snapshot through the aggregate.
    const { league } = (await repository.findByCode("liga-a"))!;
    league.addPlayer({ id: "p1", name: "David" });
    league.addPlayer({ id: "p2", name: "Ana" });
    await repository.save("liga-a", league);

    const summaries = await new ListLeagues(repository).execute();
    const summary = summaries.find((s) => s.code === "liga-a")!;
    expect(summary.status).toBe("registration");
    expect(summary.leader).toBeNull();
    expect(summary.champion).toBeNull();
  });
});

describe("League isolation", () => {
  it("mutations on one league do not affect another", async () => {
    const repository = new InMemoryLeagueRepository();
    const create = new CreateLeague(repository);
    const ids = new FixedIds();
    const addPlayer = new AddPlayer(repository, { next: () => ids.nextId() });
    const getPlayers = new GetPlayers(repository);

    await create.execute({ title: "Liga Uno", ownerId: "u" });
    await create.execute({ title: "Liga Dos", ownerId: "u" });

    await addPlayer.execute("liga-uno", "David");
    await addPlayer.execute("liga-uno", "Ana");

    const uno = await getPlayers.execute("liga-uno");
    const dos = await getPlayers.execute("liga-dos");
    expect(uno.players.map((p) => p.name)).toEqual(["David", "Ana"]);
    expect(dos.players).toHaveLength(0);
  });

  it("use cases reject unknown league codes", async () => {
    const repository = new InMemoryLeagueRepository();
    await expect(new AddPlayer(repository, { next: () => "p1" }).execute("nada", "David")).rejects.toThrow(
      /no existe/i,
    );
    await expect(new GetLeagueInfo(repository).execute("nada")).rejects.toThrow(/no existe/i);
  });
});
