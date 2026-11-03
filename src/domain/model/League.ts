import { DomainError } from "../errors/DomainError";
import { type Fixture, type Match, isPlayed, lineupKey } from "./Match";
import type { Player, PlayerId } from "./Player";
import { PLAYERS_PER_MATCH } from "./Scoring";
import { type Standing, calculateStandings } from "./Standing";

export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 24;
export const MAX_NAME_LENGTH = 40;
const FINAL_MATCH_ID = "final";

export type LeagueStatus = "registration" | "group_stage" | "final" | "finished";

export interface LeagueSnapshot {
  readonly status: LeagueStatus;
  readonly players: readonly Player[];
  readonly matches: readonly Match[];
}

/** Aggregate root: the only entry point to change players, matches and results. */
export class League {
  private constructor(
    private _status: LeagueStatus,
    private _players: Player[],
    private _matches: Match[],
  ) {}

  static create(): League {
    return new League("registration", [], []);
  }

  static fromSnapshot(snapshot: LeagueSnapshot): League {
    return new League(snapshot.status, [...snapshot.players], [...snapshot.matches]);
  }

  toSnapshot(): LeagueSnapshot {
    return { status: this._status, players: [...this._players], matches: [...this._matches] };
  }

  get status(): LeagueStatus {
    return this._status;
  }

  get players(): readonly Player[] {
    return this._players;
  }

  get groupMatches(): readonly Match[] {
    return this._matches.filter((m) => m.phase === "group");
  }

  get finalMatch(): Match | null {
    return this._matches.find((m) => m.phase === "final") ?? null;
  }

  get champion(): Player | null {
    const winnerId = this.finalMatch?.ranking?.[0];
    return winnerId ? this.findPlayer(winnerId) : null;
  }

  standings(): Standing[] {
    return calculateStandings(this._players, this.groupMatches);
  }

  addPlayer(player: Player): void {
    this.ensureStatus("registration", "Solo se pueden añadir participantes antes de iniciar la liga.");
    const name = player.name.trim();
    if (!name) throw new DomainError("El nombre del participante no puede estar vacío.");
    if (name.length > MAX_NAME_LENGTH) {
      throw new DomainError(`El nombre no puede superar los ${MAX_NAME_LENGTH} caracteres.`);
    }
    if (this._players.some((p) => p.name.toLocaleLowerCase("es") === name.toLocaleLowerCase("es"))) {
      throw new DomainError(`Ya existe un participante llamado "${name}".`);
    }
    if (this._players.length >= MAX_PLAYERS) {
      throw new DomainError(`La liga admite como máximo ${MAX_PLAYERS} participantes.`);
    }
    this._players.push({ id: player.id, name });
  }

  removePlayer(playerId: PlayerId): void {
    this.ensureStatus("registration", "Solo se pueden eliminar participantes antes de iniciar la liga.");
    this._players = this._players.filter((p) => p.id !== playerId);
  }

  start(fixtures: readonly Fixture[]): void {
    this.ensureStatus("registration", "La liga ya está iniciada.");
    if (this._players.length < MIN_PLAYERS) {
      throw new DomainError(`Se necesitan al menos ${MIN_PLAYERS} participantes para iniciar la liga.`);
    }
    this.assertValidGroupStage(fixtures);

    this._matches = fixtures.map((fixture, index) => ({
      id: `g${index + 1}`,
      number: index + 1,
      round: fixture.round,
      phase: "group",
      playerIds: [...fixture.playerIds],
      ranking: null,
    }));
    this._status = "group_stage";
  }

  /** Records (or corrects) a result. `ranking` lists the match players from 1st to 4th. */
  recordResult(matchId: string, ranking: readonly PlayerId[]): void {
    const match = this._matches.find((m) => m.id === matchId);
    if (!match) throw new DomainError("La partida no existe.");
    this.assertValidRanking(match, ranking);

    if (match.phase === "final") {
      this.ensureStatus("final", "La final no está disponible.");
      this.replaceMatch({ ...match, ranking: [...ranking] });
      this._status = "finished";
      return;
    }

    if (this._status !== "group_stage" && this._status !== "final") {
      throw new DomainError("Los resultados de la liguilla ya no se pueden modificar.");
    }
    this.replaceMatch({ ...match, ranking: [...ranking] });
    if (this.groupMatches.every(isPlayed)) this.scheduleFinal();
  }

  /** Discards the schedule and results, keeping the registered players. */
  restart(): void {
    this._matches = [];
    this._status = "registration";
  }

  findPlayer(playerId: PlayerId): Player | null {
    return this._players.find((p) => p.id === playerId) ?? null;
  }

  /** Creates the final with the current top 4, or refreshes it if a group result was corrected. */
  private scheduleFinal(): void {
    const finalists = this.standings()
      .slice(0, PLAYERS_PER_MATCH)
      .map((s) => s.player.id);
    const lastRound = Math.max(...this.groupMatches.map((m) => m.round));
    const final: Match = {
      id: FINAL_MATCH_ID,
      number: this.groupMatches.length + 1,
      round: lastRound + 1,
      phase: "final",
      playerIds: finalists,
      ranking: null,
    };
    this._matches = [...this.groupMatches, final];
    this._status = "final";
  }

  private assertValidGroupStage(fixtures: readonly Fixture[]): void {
    const playerIds = new Set(this._players.map((p) => p.id));
    const lineups = new Set<string>();
    const pairs = new Set<string>();

    for (const fixture of fixtures) {
      const ids = new Set(fixture.playerIds);
      if (ids.size !== PLAYERS_PER_MATCH || fixture.playerIds.length !== PLAYERS_PER_MATCH) {
        throw new DomainError(`Cada partida debe tener ${PLAYERS_PER_MATCH} participantes distintos.`);
      }
      if ([...ids].some((id) => !playerIds.has(id))) {
        throw new DomainError("El calendario incluye participantes que no están inscritos.");
      }
      const key = lineupKey(fixture.playerIds);
      if (lineups.has(key)) throw new DomainError("El calendario repite una combinación de participantes.");
      lineups.add(key);

      const sorted = [...fixture.playerIds].sort();
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) pairs.add(`${sorted[i]}|${sorted[j]}`);
      }
    }

    const n = playerIds.size;
    if (pairs.size !== (n * (n - 1)) / 2) {
      throw new DomainError("El calendario no enfrenta a todos los participantes entre sí.");
    }
  }

  private assertValidRanking(match: Match, ranking: readonly PlayerId[]): void {
    const unique = new Set(ranking);
    const samePlayers =
      ranking.length === PLAYERS_PER_MATCH &&
      unique.size === PLAYERS_PER_MATCH &&
      match.playerIds.every((id) => unique.has(id));
    if (!samePlayers) {
      throw new DomainError("La clasificación debe incluir a los 4 participantes de la partida, sin repetir.");
    }
  }

  private replaceMatch(updated: Match): void {
    this._matches = this._matches.map((m) => (m.id === updated.id ? updated : m));
  }

  private ensureStatus(expected: LeagueStatus, message: string): void {
    if (this._status !== expected) throw new DomainError(message);
  }
}
