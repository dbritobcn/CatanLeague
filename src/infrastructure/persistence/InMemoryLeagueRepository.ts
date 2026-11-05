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

/** In-memory multi-league repository for tests. */
export class InMemoryLeagueRepository implements LeagueRepository {
  private readonly leagues = new Map<string, StoredLeague>();

  async findByCode(code: string): Promise<LeagueEntity | null> {
    const stored = this.leagues.get(code);
    return stored
      ? {
          code,
          name: stored.name,
          ownerId: stored.ownerId,
          league: League.fromSnapshot(structuredClone(stored.snapshot)),
        }
      : null;
  }

  async create(input: CreateLeagueInput): Promise<LeagueEntity> {
    if (this.leagues.has(input.code)) {
      throw new DomainError("Ya existe una liga con ese nombre.");
    }
    const league = League.create();
    this.leagues.set(input.code, {
      name: input.name,
      ownerId: input.ownerId,
      createdAt: monotonicNowIso(),
      snapshot: league.toSnapshot(),
    });
    return { code: input.code, name: input.name, ownerId: input.ownerId, league };
  }

  async save(code: string, league: League): Promise<void> {
    if (!this.leagues.has(code)) throw new DomainError("La liga no existe.");
    const stored = this.leagues.get(code)!;
    stored.snapshot = league.toSnapshot();
  }

  async list(): Promise<LeagueSummary[]> {
    return [...this.leagues.entries()]
      .map(([code, stored]) =>
        summarizeLeague(
          { code, name: stored.name, createdAt: stored.createdAt },
          stored.snapshot,
        ),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async delete(code: string): Promise<void> {
    this.leagues.delete(code);
  }
}
