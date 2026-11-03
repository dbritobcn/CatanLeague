import type { ScheduleGenerator } from "@/domain";
import type { LeagueRepository } from "../ports/LeagueRepository";
import type { Shuffler } from "../ports/Shuffler";

export class StartLeague {
  constructor(
    private readonly repository: LeagueRepository,
    private readonly scheduleGenerator: ScheduleGenerator,
    private readonly shuffler: Shuffler,
  ) {}

  async execute(): Promise<void> {
    const league = await this.repository.get();
    const playerIds = this.shuffler.shuffle(league.players.map((p) => p.id));
    league.start(this.scheduleGenerator.generate(playerIds));
    await this.repository.save(league);
  }
}
