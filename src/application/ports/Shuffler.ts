export interface Shuffler {
  shuffle<T>(items: readonly T[]): T[];
}
