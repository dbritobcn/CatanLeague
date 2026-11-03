import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { LeagueRepository } from "@/application/ports/LeagueRepository";
import { League, type LeagueSnapshot } from "@/domain";

/** Stores the league as a JSON document on disk. Suitable for a single-server deployment. */
export class JsonFileLeagueRepository implements LeagueRepository {
  constructor(private readonly filePath: string) {}

  async get(): Promise<League> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      return League.fromSnapshot(JSON.parse(raw) as LeagueSnapshot);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return League.create();
      throw error;
    }
  }

  async save(league: League): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.tmp`;
    await writeFile(tmp, JSON.stringify(league.toSnapshot(), null, 2), "utf8");
    await rename(tmp, this.filePath);
  }
}
