/** Error raised when a league business rule is violated. Messages are user-facing. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
