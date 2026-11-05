import { container } from "@/infrastructure/container";
import {
  addPlayerAction,
  deleteLeagueAction,
  logoutAction,
  removePlayerAction,
  restartLeagueAction,
  startLeagueAction,
} from "@/presentation/actions";
import { ActionForm } from "@/presentation/components/ActionForm";
import { MatchCard } from "@/presentation/components/MatchCard";
import { ResultForm } from "@/presentation/components/ResultForm";
import { STATUS_LABELS } from "@/presentation/statusLabels";
import { requireLeagueAdmin } from "@/presentation/auth/guards";
import { Plus, SignOut, Trash, X } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

export default async function AdminPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { name } = await requireLeagueAdmin(code);
  const [{ status, players, minPlayers, maxPlayers }, schedule] = await Promise.all([
    container.getPlayers.execute(code),
    container.getSchedule.execute(code),
  ]);
  const registration = status === "registration";
  const groupLocked = status === "finished";

  return (
    <>
      <div className="page-intro">
      <p className="eyebrow">Al otro lado del tablero</p>
      <div className="page-title">
        <h1>Administración</h1>
        <span className="status">{STATUS_LABELS[status]}</span>
      </div>
      <p className="page-description">
        Gestiona «{name}» — reúne a tu grupo, pon la liga en marcha y registra cada partida.
      </p>
      <p className="hint">Comparte la liga: <span className="share-code">/{code}</span></p>
      </div>

      <section className="section card">
        <h2>
          Participantes <small>({players.length})</small>
        </h2>
        {registration && (
          <ActionForm action={addPlayerAction} className="inline-form" resetOnSuccess>
            <input type="hidden" name="leagueCode" value={code} />
            <label className="field-label" htmlFor="player-name">Nombre del participante</label>
            <div className="inline-fields">
            <input id="player-name" name="name" placeholder="¿Quién se apunta?" maxLength={40} required autoComplete="off" />
            <button type="submit"><Plus size={18} aria-hidden="true" />Añadir</button>
            </div>
          </ActionForm>
        )}
        <ul className="players">
          {players.map((p) => (
            <li key={p.id}>
              <span>{p.name}</span>
              {registration && (
                <ActionForm action={removePlayerAction}>
                  <input type="hidden" name="leagueCode" value={code} />
                  <input type="hidden" name="playerId" value={p.id} />
                  <button type="submit" className="ghost" aria-label={`Eliminar a ${p.name}`}>
                    <X size={16} aria-hidden="true" />
                  </button>
                </ActionForm>
              )}
            </li>
          ))}
        </ul>

        {registration ? (
          <ActionForm
            action={startLeagueAction}
            className="start-league"
            confirm="Una vez iniciada no podrás modificar los participantes. ¿Iniciar la liga?"
          >
            <input type="hidden" name="leagueCode" value={code} />
            <p className="hint">
              Mínimo {minPlayers} y máximo {maxPlayers} participantes. Al iniciar se generará el calendario de la
              liguilla: todos se enfrentan al menos una vez, sin repetir combinaciones y con el mismo número de
              partidas por jugador.
            </p>
            <button type="submit" disabled={players.length < minPlayers || players.length > maxPlayers}>
              Iniciar liga
            </button>
          </ActionForm>
        ) : (
          <ActionForm
            action={restartLeagueAction}
            confirm="Se borrarán el calendario y todos los resultados (los participantes se mantienen). ¿Continuar?"
          >
            <input type="hidden" name="leagueCode" value={code} />
            <button type="submit" className="danger">
              Reiniciar liga
            </button>
          </ActionForm>
        )}
      </section>

      {!registration && (
        <>
          <section className="section" id="resultados">
            <h2>Final</h2>
            {schedule.final ? (
              <MatchCard match={schedule.final}>
                {status !== "finished" && (
                  <ResultForm
                    key={schedule.final.players.map((p) => p.id).join()}
                    match={schedule.final}
                    leagueCode={code}
                  />
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
                    {!groupLocked && <ResultForm match={match} leagueCode={code} />}
                  </MatchCard>
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      <section className="section admin-footer">
        <form action={logoutAction}>
          <button type="submit" className="ghost">
            <SignOut size={16} aria-hidden="true" /> Cerrar sesión
          </button>
        </form>
        <ActionForm
          action={deleteLeagueAction}
          confirm={`Se eliminará «${name}» con todos sus participantes y resultados, y su dirección /${code} quedará libre. NO hay vuelta atrás. ¿Eliminar la liga?`}
        >
          <input type="hidden" name="leagueCode" value={code} />
          <button type="submit" className="danger">
            <Trash size={16} aria-hidden="true" /> Eliminar liga
          </button>
        </ActionForm>
      </section>
    </>
  );
}
