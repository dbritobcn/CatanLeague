export const PLAYERS_PER_MATCH = 4;

/** Points awarded by finishing position: 1st, 2nd, 3rd, 4th. */
export const POINTS_BY_POSITION: readonly number[] = [3, 2, 1, 0];

export function pointsForPosition(positionIndex: number): number {
  return POINTS_BY_POSITION[positionIndex] ?? 0;
}
