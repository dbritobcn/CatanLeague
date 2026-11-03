import Link from "next/link";
import { container } from "@/infrastructure/container";
import { MatchCard } from "@/presentation/components/MatchCard";
import { STATUS_LABELS } from "@/presentation/statusLabels";

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  const { status, rows, final, champion } = await container.getStandings.execute();

  return (
    <>
      <div className="page-title">
        <h1>Clasificación</h1>
        <span className="status">{STATUS_LABELS[status]}</span>
      </div>

      {champion && (
        <section className="champion">
          <span aria-hidden>👑</span>
          <div>
            <small>Campeón de la liga</small>
            <strong>{champion.name}</strong>
          </div>
        </section>
      )}

      {status === "registration" ? (
        <p className="empty">
          La liga aún no ha comenzado. Añade participantes e iníciala desde <Link href="/admin">Admin</Link>.
        </p>
      ) : (
        <div className="table-wrap card">
          <table className="standings">
            <thead>
              <tr>
                <th>#</th>
                <th className="left">Jugador</th>
                <th>Pts</th>
                <th>PJ</th>
                <th title="Primeros puestos">1º</th>
                <th title="Segundos puestos">2º</th>
                <th title="Terceros puestos">3º</th>
                <th title="Cuartos puestos">4º</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.player.id} className={row.position <= 4 ? "qualified" : ""}>
                  <td>{row.position}</td>
                  <td className="left">{row.player.name}</td>
                  <td className="points">{row.points}</td>
                  <td>{row.played}</td>
                  {row.finishes.map((count, i) => (
                    <td key={i}>{count}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="legend">
            Los 4 primeros (resaltados) jugarán la final. Desempate: puntos, nº de 1º, 2º y 3º puestos.
          </p>
        </div>
      )}

      {final && (
        <section className="section">
          <h2>Final</h2>
          <MatchCard match={final} />
        </section>
      )}
    </>
  );
}
