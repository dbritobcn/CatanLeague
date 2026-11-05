import { DomainError } from "@/domain";
import type { LeagueRepository } from "../ports/LeagueRepository";
import { requireValidSlug } from "../slug";

export interface CreatedLeague {
  readonly code: string;
}

export class CreateLeague {
  constructor(private readonly repository: LeagueRepository) {}

  async execute(input: { title: string; ownerId: string }): Promise<CreatedLeague> {
    const title = input.title.trim();
    if (!title) throw new DomainError("El nombre de la liga es obligatorio.");
    const code = requireValidSlug(title);
    const existing = await this.repository.findByCode(code);
    if (existing) {
      // Slugs are immutable and never auto-suffixed: the URL must match the title.
      throw new DomainError("Ese nombre ya está cogido. Elige otro.");
    }
    await this.repository.create({ code, name: title, ownerId: input.ownerId });
    return { code };
  }
}
