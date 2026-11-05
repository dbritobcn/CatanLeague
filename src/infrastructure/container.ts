import path from "node:path";
import { AddPlayer } from "@/application/use-cases/AddPlayer";
import { CreateLeague } from "@/application/use-cases/CreateLeague";
import { DeleteLeague } from "@/application/use-cases/DeleteLeague";
import { GetLeagueInfo } from "@/application/use-cases/GetLeagueInfo";
import { GetPlayers } from "@/application/use-cases/GetPlayers";
import { GetSchedule } from "@/application/use-cases/GetSchedule";
import { GetStandings } from "@/application/use-cases/GetStandings";
import { ListLeagues } from "@/application/use-cases/ListLeagues";
import { RecordMatchResult } from "@/application/use-cases/RecordMatchResult";
import { RemovePlayer } from "@/application/use-cases/RemovePlayer";
import { RestartLeague } from "@/application/use-cases/RestartLeague";
import { StartLeague } from "@/application/use-cases/StartLeague";
import { BalancedCoveringScheduleGenerator } from "@/domain";
import type { LeagueRepository } from "@/application/ports/LeagueRepository";
import { CryptoIdGenerator } from "./id/CryptoIdGenerator";
import { JsonFileLeagueRepository } from "./persistence/JsonFileLeagueRepository";
import { SupabaseLeagueRepository } from "./persistence/SupabaseLeagueRepository";
import { FisherYatesShuffler } from "./random/FisherYatesShuffler";

/** Selects the persistence adapter: Supabase by default, JSON files for local dev. */
function createRepository(): LeagueRepository {
  if (process.env.LEAGUE_PERSISTENCE === "file") {
    return new JsonFileLeagueRepository(
      process.env.LEAGUE_DATA_DIR ?? path.join(process.cwd(), "data", "leagues"),
    );
  }
  return new SupabaseLeagueRepository(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/** Composition root: the only place that knows which adapter implements each port. */
function createContainer() {
  const repository = createRepository();

  return {
    createLeague: new CreateLeague(repository),
    deleteLeague: new DeleteLeague(repository),
    listLeagues: new ListLeagues(repository),
    getLeagueInfo: new GetLeagueInfo(repository),
    addPlayer: new AddPlayer(repository, new CryptoIdGenerator()),
    removePlayer: new RemovePlayer(repository),
    startLeague: new StartLeague(repository, new BalancedCoveringScheduleGenerator(), new FisherYatesShuffler()),
    recordMatchResult: new RecordMatchResult(repository),
    restartLeague: new RestartLeague(repository),
    getPlayers: new GetPlayers(repository),
    getSchedule: new GetSchedule(repository),
    getStandings: new GetStandings(repository),
  };
}

export const container = createContainer();
