import type { ScheduleGenerator } from "@/domain";
import type { LeagueRepository } from "../ports/LeagueRepository";
import type { Shuffler } from "../ports/Shuffler";
import { LeagueNotFoundError } from "../errors";

export class StartLeague {
  constructor(
    private readonly repository: LeagueRepository,
    private readonly scheduleGenerator: ScheduleGenerator,
    private readonly shuffler: Shuffler,
  ) {}

  async execute(code: string): Promise<void> {
    const league = await this.repository.findByCode(code);
    if (!league) throw new LeagueNotFoundError();
    const playerIds = this.shuffler.shuffle(league.league.players.map((p) => p.id));
    league.league.start(this.scheduleGenerator.generate(playerIds));
    await this.repository.save(code, league.league);
  }
}
