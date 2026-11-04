import { calculateStandings, type League, type LeagueSnapshot, type LeagueStatus } from "@/domain";

/** A league and its platform metadata (code, owner, name). */
export interface LeagueEntity {
  readonly code: string;
  readonly name: string;
  readonly ownerId: string;
  readonly league: League;
}

export interface CreateLeagueInput {
  readonly code: string;
  readonly name: string;
  readonly ownerId: string;
}

/** Public listing card for the homepage gallery. */
export interface LeagueSummary {
  readonly code: string;
  readonly name: string;
  readonly status: LeagueStatus;
  readonly played: number;
  readonly total: number;
  /** Current leader while the league is being played; null otherwise. */
  readonly leader: string | null;
  /** Champion once the league is finished; null otherwise. */
  readonly champion: string | null;
  readonly createdAt: string;
}

export interface LeagueRepository {
  /** Returns the league with the given code, or null if it does not exist. */
  findByCode(code: string): Promise<LeagueEntity | null>;
  /** Creates a league in registration status. Throws DomainError if the code is taken. */
  create(input: CreateLeagueInput): Promise<LeagueEntity>;
  /** Persists the aggregate of the league identified by code. */
  save(code: string, league: League): Promise<void>;
  /** All leagues, newest first, as gallery summaries. */
  list(): Promise<LeagueSummary[]>;
  /** Deletes the league and frees its code. */
  delete(code: string): Promise<void>;
}

/** Pure projection from a persisted snapshot to a gallery summary (shared by adapters). */
export function summarizeLeague(
  meta: { code: string; name: string; createdAt: string },
  snapshot: LeagueSnapshot,
): LeagueSummary {
  const groupMatches = snapshot.matches.filter((m) => m.phase === "group");
  const top = calculateStandings(snapshot.players, groupMatches)[0]?.player.name ?? null;
  const playing = snapshot.status === "group_stage" || snapshot.status === "final";
  return {
    code: meta.code,
    name: meta.name,
    status: snapshot.status,
    played: groupMatches.filter((m) => m.ranking !== null).length,
    total: groupMatches.length,
    leader: playing ? top : null,
    champion: snapshot.status === "finished" ? top : null,
    createdAt: meta.createdAt,
  };
}
