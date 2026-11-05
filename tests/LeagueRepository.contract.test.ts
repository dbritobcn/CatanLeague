import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";import type { LeagueRepository } from "@/application/ports/LeagueRepository";
import { InMemoryLeagueRepository } from "@/infrastructure/persistence/InMemoryLeagueRepository";
import { JsonFileLeagueRepository } from "@/infrastructure/persistence/JsonFileLeagueRepository";
import { SupabaseLeagueRepository } from "@/infrastructure/persistence/SupabaseLeagueRepository";

/**
 * Shared contract every LeagueRepository adapter must satisfy.
 * Each adapter file calls `leagueRepositoryContract(name, factory)`.
 */
export function leagueRepositoryContract(
  name: string,
  createRepository: () => LeagueRepository | Promise<LeagueRepository>,
  cleanup?: () => Promise<void>,
) {
  describe(`LeagueRepository contract: ${name}`, () => {
    let repository: LeagueRepository;

    beforeEach(async () => {
      repository = await createRepository();
    });

    afterEach(async () => {
      await cleanup?.();
    });

    it("creates a league in registration status", async () => {
      const league = await repository.create({ code: "liga-cholos", name: "Liga Cholos", ownerId: "user-1" });
      expect(league.code).toBe("liga-cholos");
      expect(league.name).toBe("Liga Cholos");
      expect(league.ownerId).toBe("user-1");
      expect(league.league.status).toBe("registration");
      expect(league.league.players).toHaveLength(0);
    });

    it("rejects a duplicate code", async () => {
      await repository.create({ code: "liga-cholos", name: "Liga Cholos", ownerId: "user-1" });
      await expect(
        repository.create({ code: "liga-cholos", name: "Liga Cholos", ownerId: "user-2" }),
      ).rejects.toThrow(/misma liga|ese nombre/i);
    });

    it("returns null for an unknown code", async () => {
      expect(await repository.findByCode("no-existe")).toBeNull();
    });

    it("finds a saved league with its metadata", async () => {
      await repository.create({ code: "liga-cholos", name: "Liga Cholos", ownerId: "user-1" });
      const found = await repository.findByCode("liga-cholos");
      expect(found?.name).toBe("Liga Cholos");
      expect(found?.ownerId).toBe("user-1");
    });

    it("persists aggregate changes through save()", async () => {
      const { league } = await repository.create({ code: "liga-cholos", name: "Liga Cholos", ownerId: "user-1" });
      league.addPlayer({ id: "p1", name: "David" });
      league.addPlayer({ id: "p2", name: "Ana" });
      await repository.save("liga-cholos", league);

      const reloaded = await repository.findByCode("liga-cholos");
      expect(reloaded?.league.players.map((p) => p.name)).toEqual(["David", "Ana"]);
    });

    it("does not let a save() on a missing league pass silently", async () => {
      const { league } = await repository.create({ code: "liga-cholos", name: "Liga Cholos", ownerId: "u" });
      await repository.delete("liga-cholos");
      await expect(repository.save("liga-cholos", league)).rejects.toThrow(/liga no existe/i);
    });

    it("lists leagues with summaries, newest first", async () => {
      const first = await repository.create({ code: "primera", name: "Primera", ownerId: "u" });
      first.league.addPlayer({ id: "p1", name: "David" });
      first.league.addPlayer({ id: "p2", name: "Ana" });
      await repository.save("primera", first.league);
      await repository.create({ code: "segunda", name: "Segunda", ownerId: "u" });

      const list = await repository.list();
      expect(list.map((l) => l.code)).toEqual(["segunda", "primera"]);
      const summary = list.find((l) => l.code === "primera")!;
      expect(summary.status).toBe("registration");
      expect(summary.leader).toBeNull();
      expect(summary.champion).toBeNull();
      expect(summary.played).toBe(0);
    });

    it("deletes a league and frees its code", async () => {
      await repository.create({ code: "liga-cholos", name: "Liga Cholos", ownerId: "u" });
      await repository.delete("liga-cholos");
      expect(await repository.findByCode("liga-cholos")).toBeNull();
      await expect(
        repository.create({ code: "liga-cholos", name: "Liga Cholos", ownerId: "u" }),
      ).resolves.toBeTruthy();
    });
  });
}

describe("InMemoryLeagueRepository", () => {
  leagueRepositoryContract("in-memory", () => new InMemoryLeagueRepository());
});

describe("JsonFileLeagueRepository", () => {
  let directory: string;

  leagueRepositoryContract(
    "json-file",
    async () => {
      directory = await mkdtemp(path.join(tmpdir(), "catan-test-"));
      return new JsonFileLeagueRepository(directory);
    },
    async () => {
      await rm(directory, { recursive: true, force: true });
    },
  );
});

const supabaseConfigured =
  Boolean(process.env.SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
const describeSupabase = supabaseConfigured ? describe : describe.skip;

describeSupabase("SupabaseLeagueRepository", () => {
  // The shared contract reuses fixed codes, so rows from a previous run must go first.
  const CODES = ["liga-cholos", "primera", "segunda"];

  leagueRepositoryContract(
    "supabase",
    () => new SupabaseLeagueRepository(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY),
    async () => {
      const repository = new SupabaseLeagueRepository(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      );
      await Promise.all(CODES.map((code) => repository.delete(code).catch(() => undefined)));
    },
  );
});
