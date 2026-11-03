import { container } from "@/infrastructure/container";
import {
  addPlayerAction,
  removePlayerAction,
  restartLeagueAction,
  startLeagueAction,
} from "@/presentation/actions";
import { ActionForm } from "@/presentation/components/ActionForm";
import { MatchCard } from "@/presentation/components/MatchCard";
import { ResultForm } from "@/presentation/components/ResultForm";
import { STATUS_LABELS } from "@/presentation/statusLabels";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [{ status, players, minPlayers, maxPlayers }, schedule] = await Promise.all([
    container.getPlayers.execute(),
    container.getSchedule.execute(),
  ]);
  const registration = status === "registration";
  const groupLocked = status === "finished";

  return (
    <>
      <div className="page-title">
        <h1>Administración</h1>
        <span className="status">{STATUS_LABELS[status]}</span>
      </div>

      <section className="section card">
        <h2>
          Participantes <small>({players.length})</small>
        </h2>
        {registration && (
          <ActionForm action={addPlayerAction} className="inline-form">
            <input name="name" placeholder="Nombre del participante" maxLength={40} required autoComplete="off" />
            <button type="submit">Añadir</button>
          </ActionForm>
        )}
        <ul className="players">
          {players.map((p) => (
            <li key={p.id}>
              <span>{p.name}</span>
              {registration && (
                <ActionForm action={removePlayerAction}>
                  <input type="hidden" name="playerId" value={p.id} />
                  <button type="submit" className="ghost" aria-label={`Eliminar a ${p.name}`}>
                    ✕
                  </button>
                </ActionForm>
              )}
            </li>
          ))}
        </ul>

        {registration ? (
          <ActionForm
            action={startLeagueAction}
            confirm="Una vez iniciada no podrás modificar los participantes. ¿Iniciar la liga?"
          >
            <p className="hint">
              Mínimo {minPlayers} y máximo {maxPlayers} participantes. Al iniciar se generará el calendario de la
              liguilla: todos se enfrentan al menos una vez, sin repetir combinaciones y con el mismo número de
              partidas por jugador.
            </p>
            <button type="submit" disabled={players.length < minPlayers}>
              Iniciar liga
            </button>
          </ActionForm>
        ) : (
          <ActionForm
            action={restartLeagueAction}
            confirm="Se borrarán el calendario y todos los resultados (los participantes se mantienen). ¿Continuar?"
          >
            <button type="submit" className="danger">
              Reiniciar liga
            </button>
          </ActionForm>
        )}
      </section>

      {!registration && (
        <>
          <section className="section">
            <h2>Final</h2>
            {schedule.final ? (
              <MatchCard match={schedule.final}>
                {status !== "finished" && (
                  <ResultForm key={schedule.final.players.map((p) => p.id).join()} match={schedule.final} />
                )}
              </MatchCard>
            ) : (
              <p className="empty">
                Se generará automáticamente al introducir el último resultado de la liguilla ({schedule.played}/
                {schedule.total}).
              </p>
            )}
          </section>

          {schedule.rounds.map(({ round, matches }) => (
            <section key={round} className="section">
              <h2>Jornada {round}</h2>
              <div className="grid">
                {matches.map((match) => (
                  <MatchCard key={match.id} match={match}>
                    {!groupLocked && <ResultForm match={match} />}
                  </MatchCard>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </>
  );
}
