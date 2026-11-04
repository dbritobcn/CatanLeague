import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { DomainError, League, type LeagueSnapshot } from "@/domain";
import type {
  CreateLeagueInput,
  LeagueEntity,
  LeagueRepository,
  LeagueSummary,
} from "@/application/ports/LeagueRepository";
import { summarizeLeague } from "@/application/ports/LeagueRepository";
import { monotonicNowIso } from "./monotonicClock";

interface StoredLeague {
  name: string;
  ownerId: string;
  createdAt: string;
  snapshot: LeagueSnapshot;
}

/**
 * Stores each league as a JSON document at <directory>/<code>.json.
 * Suitable for local development without a database.
 */
export class JsonFileLeagueRepository implements LeagueRepository {
  constructor(private readonly directory: string) {}

  async findByCode(code: string): Promise<LeagueEntity | null> {
    const stored = await this.read(code);
    return stored
      ? { code, name: stored.name, ownerId: stored.ownerId, league: League.fromSnapshot(stored.snapshot) }
      : null;
  }

  async create(input: CreateLeagueInput): Promise<LeagueEntity> {
    await mkdir(this.directory, { recursive: true });
    if (await this.read(input.code)) {
      throw new DomainError("Ya existe una liga con ese nombre.");
    }
    const league = League.create();
    const stored: StoredLeague = {
      name: input.name,
      ownerId: input.ownerId,
      createdAt: monotonicNowIso(),
      snapshot: league.toSnapshot(),
    };
    await writeFile(this.fileFor(input.code), JSON.stringify(stored, null, 2), "utf8");
    return { code: input.code, name: input.name, ownerId: input.ownerId, league };
  }

  async save(code: string, league: League): Promise<void> {
    const stored = await this.read(code);
    if (!stored) throw new DomainError("La liga no existe.");
    stored.snapshot = league.toSnapshot();
    await writeFile(this.fileFor(code), JSON.stringify(stored, null, 2), "utf8");
  }

  async list(): Promise<LeagueSummary[]> {
    try {
      const files = await readdir(this.directory);
      const summaries: LeagueSummary[] = [];
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const code = file.slice(0, -".json".length);
        const stored = await this.read(code);
        if (stored) {
          summaries.push(summarizeLeague({ code, name: stored.name, createdAt: stored.createdAt }, stored.snapshot));
        }
      }
      return summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }

  async delete(code: string): Promise<void> {
    await rm(this.fileFor(code), { force: true });
  }

  private fileFor(code: string): string {
    // Codes are validated slugs ([a-z0-9-]+), so path traversal is not possible.
    return path.join(this.directory, `${code}.json`);
  }

  private async read(code: string): Promise<StoredLeague | null> {
    try {
      const raw = await readFile(this.fileFor(code), "utf8");
      return JSON.parse(raw) as StoredLeague;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }
}
