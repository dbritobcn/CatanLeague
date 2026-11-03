import path from "node:path";
import { AddPlayer } from "@/application/use-cases/AddPlayer";
import { GetPlayers } from "@/application/use-cases/GetPlayers";
import { GetSchedule } from "@/application/use-cases/GetSchedule";
import { GetStandings } from "@/application/use-cases/GetStandings";
import { RecordMatchResult } from "@/application/use-cases/RecordMatchResult";
import { RemovePlayer } from "@/application/use-cases/RemovePlayer";
import { RestartLeague } from "@/application/use-cases/RestartLeague";
import { StartLeague } from "@/application/use-cases/StartLeague";
import { BalancedCoveringScheduleGenerator } from "@/domain";
import { CryptoIdGenerator } from "./id/CryptoIdGenerator";
import { JsonFileLeagueRepository } from "./persistence/JsonFileLeagueRepository";
import { FisherYatesShuffler } from "./random/FisherYatesShuffler";

/** Composition root: the only place that knows which adapter implements each port. */
function createContainer() {
  const repository = new JsonFileLeagueRepository(
    process.env.LEAGUE_DATA_FILE ?? path.join(process.cwd(), "data", "league.json"),
  );

  return {
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
