import { DomainError } from "@/domain";

/** Thrown by use cases when the requested league code does not exist. */
export class LeagueNotFoundError extends DomainError {
  constructor() {
    super("La liga no existe.");
    this.name = "LeagueNotFoundError";
  }
}
