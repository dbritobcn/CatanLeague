import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DomainError, League, type LeagueSnapshot } from "@/domain";
import type {
  CreateLeagueInput,
  LeagueEntity,
  LeagueRepository,
  LeagueSummary,
} from "@/application/ports/LeagueRepository";
import { summarizeLeague } from "@/application/ports/LeagueRepository";

const TABLE = "leagues";

interface LeagueRow {
  id: string;
  code: string;
  name: string;
  owner_id: string;
  data: LeagueSnapshot;
  created_at: string;
  updated_at: string;
}

function toEntity(row: LeagueRow): LeagueEntity {
  return {
    code: row.code,
    name: row.name,
    ownerId: row.owner_id,
    league: League.fromSnapshot(row.data),
  };
}

/**
 * Persists each league as a Supabase row: the aggregate snapshot lives in the
 * `data` jsonb column. Uses the service-role key server-side (bypasses RLS,
 * which remains active as a safety net for direct database access). The real
 * authorization frontier is the ownership gate in the server actions.
 */
export class SupabaseLeagueRepository implements LeagueRepository {
  private client: SupabaseClient | null = null;

  constructor(
    private readonly url: string | undefined,
    private readonly serviceRoleKey: string | undefined,
  ) {}

  private supabase(): SupabaseClient {
    if (!this.client) {
      if (!this.url || !this.serviceRoleKey) {
        throw new Error(
          "Supabase no está configurado. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY, " +
            "o usa LEAGUE_PERSISTENCE=file para desarrollo local.",
        );
      }
      this.client = createClient(this.url, this.serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    return this.client;
  }

  async findByCode(code: string): Promise<LeagueEntity | null> {
    const { data, error } = await this.supabase()
      .from(TABLE)
      .select("id, code, name, owner_id, data, created_at, updated_at")
      .eq("code", code)
      .maybeSingle();
    this.assertNoError(error);
    return data ? toEntity(data as LeagueRow) : null;
  }

  async create(input: CreateLeagueInput): Promise<LeagueEntity> {
    const { data, error } = await this.supabase()
      .from(TABLE)
      .insert({
        code: input.code,
        name: input.name,
        owner_id: input.ownerId,
        data: League.create().toSnapshot(),
      })
      .select("id, code, name, owner_id, data, created_at, updated_at")
      .single();
    if (error?.code === "23505") {
      throw new DomainError("Ya existe una liga con ese nombre.");
    }
    this.assertNoError(error);
    return toEntity(data as LeagueRow);
  }

  async save(code: string, league: League): Promise<void> {
    const { data, error } = await this.supabase()
      .from(TABLE)
      .update({ data: league.toSnapshot(), updated_at: new Date().toISOString() })
      .eq("code", code)
      .select("id")
      .maybeSingle();
    this.assertNoError(error);
    if (!data) throw new DomainError("La liga no existe.");
  }

  async list(): Promise<LeagueSummary[]> {
    const { data, error } = await this.supabase()
      .from(TABLE)
      .select("code, name, data, created_at")
      .order("created_at", { ascending: false });
    this.assertNoError(error);
    return (data ?? []).map((row) =>
      summarizeLeague(
        { code: row.code, name: row.name, createdAt: row.created_at },
        row.data as LeagueSnapshot,
      ),
    );
  }

  async delete(code: string): Promise<void> {
    const { data, error } = await this.supabase()
      .from(TABLE)
      .delete()
      .eq("code", code)
      .select("id")
      .maybeSingle();
    this.assertNoError(error);
    if (!data) throw new DomainError("La liga no existe.");
  }

  private assertNoError(error: { message: string } | null): void {
    if (error) throw new Error(`Supabase: ${error.message}`);
  }
}
