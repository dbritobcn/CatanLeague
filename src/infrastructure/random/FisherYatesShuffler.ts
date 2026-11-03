import type { Shuffler } from "@/application/ports/Shuffler";

export class FisherYatesShuffler implements Shuffler {
  constructor(private readonly random: () => number = Math.random) {}

  shuffle<T>(items: readonly T[]): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
