import type { ReactNode } from "react";
import type { MatchView } from "@/application/views";

const MEDALS = ["🥇", "🥈", "🥉", "4º"];

export function MatchCard({ match, children }: { match: MatchView; children?: ReactNode }) {
  const isFinal = match.phase === "final";
  return (
    <article className={`card match ${isFinal ? "final" : ""} ${match.result ? "played" : ""}`}>
      <header>
        <strong>{isFinal ? "🏆 Gran Final" : `Partida ${match.number}`}</strong>
        <span className={`badge ${match.result ? "done" : ""}`}>{match.result ? "Jugada" : "Pendiente"}</span>
      </header>
      {match.result ? (
        <ol className="ranking">
          {match.result.map((r) => (
            <li key={r.player.id}>
              <span className="medal">{MEDALS[r.position - 1]}</span>
              <span className="name">{r.player.name}</span>
              {!isFinal && <span className="pts">+{r.points}</span>}
            </li>
          ))}
        </ol>
      ) : (
        <ul className="lineup">
          {match.players.map((p) => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      )}
      {children}
    </article>
  );
}
