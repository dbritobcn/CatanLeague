import type { Match } from "./Match";
import type { Player, PlayerId } from "./Player";
import { PLAYERS_PER_MATCH, pointsForPosition } from "./Scoring";

export interface Standing {
  readonly player: Player;
  readonly points: number;
  readonly played: number;
  /** Number of times the player finished 1st, 2nd, 3rd and 4th. */
  readonly finishes: readonly number[];
}

/**
 * Builds the classification table from played matches.
 * Tiebreakers: points, then number of 1st places, 2nd places, 3rd places, then name.
 */
export function calculateStandings(players: readonly Player[], matches: readonly Match[]): Standing[] {
  const rows = new Map<PlayerId, { points: number; played: number; finishes: number[] }>();
  for (const player of players) {
    rows.set(player.id, { points: 0, played: 0, finishes: new Array(PLAYERS_PER_MATCH).fill(0) });
  }

  for (const match of matches) {
    match.ranking?.forEach((playerId, position) => {
      const row = rows.get(playerId);
      if (!row) return;
      row.points += pointsForPosition(position);
      row.played += 1;
      row.finishes[position] += 1;
    });
  }

  return players
    .map((player) => ({ player, ...rows.get(player.id)! }))
    .sort(compareStandings);
}

function compareStandings(a: Standing, b: Standing): number {
  if (a.points !== b.points) return b.points - a.points;
  for (let i = 0; i < PLAYERS_PER_MATCH; i++) {
    if (a.finishes[i] !== b.finishes[i]) return b.finishes[i] - a.finishes[i];
  }
  return a.player.name.localeCompare(b.player.name, "es");
}
