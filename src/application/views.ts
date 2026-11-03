import type { League, LeagueStatus, Match, Player } from "@/domain";
import { pointsForPosition } from "@/domain";

/** Read models returned by queries so the UI never touches domain objects directly. */

export interface PlayerView {
  id: string;
  name: string;
}

export interface MatchResultView {
  position: number;
  player: PlayerView;
  points: number;
}

export interface MatchView {
  id: string;
  number: number;
  round: number;
  phase: "group" | "final";
  players: PlayerView[];
  result: MatchResultView[] | null;
}

export interface StandingView {
  position: number;
  player: PlayerView;
  points: number;
  played: number;
  finishes: number[];
}

export function toPlayerView(player: Player): PlayerView {
  return { id: player.id, name: player.name };
}

export function toMatchView(league: League, match: Match): MatchView {
  const player = (id: string) => toPlayerView(league.findPlayer(id) ?? { id, name: "?" });
  return {
    id: match.id,
    number: match.number,
    round: match.round,
    phase: match.phase,
    players: match.playerIds.map(player),
    result:
      match.ranking?.map((id, index) => ({
        position: index + 1,
        player: player(id),
        points: match.phase === "group" ? pointsForPosition(index) : 0,
      })) ?? null,
  };
}

export type { LeagueStatus };
