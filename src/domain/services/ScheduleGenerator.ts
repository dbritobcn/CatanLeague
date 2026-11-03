import type { Fixture } from "../model/Match";
import type { PlayerId } from "../model/Player";

/**
 * Plans the group stage. Implementations must return fixtures of 4 distinct players where
 * no two fixtures share the same lineup and every pair of players meets at least once.
 */
export interface ScheduleGenerator {
  generate(playerIds: readonly PlayerId[]): Fixture[];
}
