"use client";

import { useState } from "react";
import type { MatchView } from "@/application/views";
import { recordResultAction } from "../actions";
import { ActionForm } from "./ActionForm";

const POSITIONS = ["1º · 3 pts", "2º · 2 pts", "3º · 1 pt", "4º · 0 pts"];
const FINAL_POSITIONS = ["1º · Campeón", "2º", "3º", "4º"];

export function ResultForm({ match, leagueCode }: { match: MatchView; leagueCode: string }) {
  const [ranking, setRanking] = useState<string[]>(
    match.result?.map((r) => r.player.id) ?? ["", "", "", ""],
  );
  const labels = match.phase === "final" ? FINAL_POSITIONS : POSITIONS;
  const complete = ranking.every(Boolean) && new Set(ranking).size === 4;

  const form = (
    <ActionForm action={recordResultAction}>
      <input type="hidden" name="matchId" value={match.id} />
      <input type="hidden" name="leagueCode" value={leagueCode} />
      <div className="result-grid">
        {labels.map((label, index) => (
          <label key={label}>
            <span>{label}</span>
            <select
              name={`position${index + 1}`}
              value={ranking[index]}
              onChange={(e) => setRanking(ranking.map((id, i) => (i === index ? e.target.value : id)))}
              required
            >
              <option value="">—</option>
              {match.players.map((p) => (
                <option key={p.id} value={p.id} disabled={ranking.includes(p.id) && ranking[index] !== p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <button type="submit" disabled={!complete}>
        {match.result ? "Corregir resultado" : "Guardar resultado"}
      </button>
    </ActionForm>
  );

  return match.result ? (
    <details className="result-form">
      <summary>Corregir resultado</summary>
      {form}
    </details>
  ) : (
    <div className="result-form">{form}</div>
  );
}
