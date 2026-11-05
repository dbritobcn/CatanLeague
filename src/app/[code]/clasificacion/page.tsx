import Link from "next/link";
import { ArrowRightIcon, TrophyIcon, UsersThreeIcon } from "@phosphor-icons/react/dist/ssr";
import { container } from "@/infrastructure/container";
import { MatchCard } from "@/presentation/components/MatchCard";
import { LeagueHero } from "@/presentation/components/LeagueHero";
import { NextRoundBand } from "@/presentation/components/NextRoundBand";
import { requireExistingLeague } from "@/presentation/auth/guards";

export const dynamic = "force-dynamic";

function ScoringLegend() {
  return <p className="scoring-legend" aria-label="Puntuación por puesto"><span>1º <b>·</b> 3 pts</span><span>2º <b>·</b> 2 pts</span><span>3º <b>·</b> 1 pt</span><span>4º <b>·</b> 0 pts</span></p>;
}

export default async function StandingsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  await requireExistingLeague(code);
  const [{ status, rows, final, champion }, schedule] = await Promise.all([
    container.getStandings.execute(code), container.getSchedule.execute(code),
  ]);
  const registration = status === "registration";
  const statusText = registration ? "Inscripción abierta" : status === "group_stage" ? "Liguilla en curso" : status === "final" ? "Todo listo para la final" : "Liga finalizada";
  return <>
    <LeagueHero />
    {champion && <section className="champion" aria-label="Campeón de la liga">
      <TrophyIcon size={38} weight="duotone" aria-hidden="true" />
      <div><span className="eyebrow">Campeón de la liga</span><strong>{champion.name}</strong></div>
      <span className="champion-note">¡La conquista es tuya!</span>
    </section>}
    {status === "group_stage" && schedule.currentRound && <NextRoundBand code={code} currentRound={schedule.currentRound} />}
    <section aria-labelledby="standings-title">
      <div className="standings-heading">
        <h2 id="standings-title">Clasificación</h2>
        <div className="league-context"><span>{statusText}</span>
          <p>{registration ? `${rows.length} participantes · Preparando la próxima aventura` : `${schedule.played} de ${schedule.total} partidas completadas`}</p>
        </div>
        <Link className="button primary-action" href={registration ? `/${code}/admin` : status === "finished" ? `/${code}/calendario` : `/${code}/admin#resultados`}>
          {registration ? "Añadir participantes" : status === "finished" ? "Ver partidas" : "Registrar resultado"}<ArrowRightIcon size={19} aria-hidden="true" />
        </Link>
      </div>
      {registration ? <div className="empty-state">
        <UsersThreeIcon size={40} weight="duotone" aria-hidden="true" />
        <h3>Las grandes ligas empiezan entre amigos.</h3>
        <p>Añade a los participantes e inicia la liga. Nosotros nos encargamos del calendario y de llevar la cuenta.</p>
        <ol className="setup-steps"><li>Añade participantes</li><li>Inicia la liga</li><li>¡A jugar!</li></ol>
      </div> : <>
        <table className="standings">
          <caption className="sr-only">Clasificación de la liga por puntos. Los cuatro primeros están en puestos de final.</caption>
          <thead><tr><th scope="col" className="position-col"><span className="desktop-label">Pos.</span><span className="mobile-label">#</span></th><th scope="col" className="left">Jugador</th><th scope="col" className="points-col"><span className="desktop-label">Puntos</span><span className="mobile-label">Pts</span></th><th scope="col"><abbr title="Partidas jugadas">PJ</abbr></th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.player.id} className={row.position <= 4 ? "qualified" : ""}>
            <td className="position-col">{row.position}<span aria-hidden="true">.</span><span className="sr-only">º puesto</span></td>
            <th scope="row" className="left player-cell"><span>{row.player.name}</span>{row.position <= 4 && <small className="qualifier">{status === "group_stage" ? "En puestos de final" : "Finalista"}</small>}</th>
            <td className="points">{row.points}</td><td>{row.played}</td>
          </tr>)}</tbody>
        </table>
        <ScoringLegend />
        <details className="standings-details"><summary>Ver desempates y puestos por jugador</summary>
          <p className="hint">En caso de empate: primeros, segundos y terceros puestos; después, nombre.</p>
          <ul>{rows.map((r) => <li key={r.player.id}><strong>{r.player.name}</strong><span>{r.finishes.map((n, i) => `${i + 1}º: ${n}`).join(" · ")}</span></li>)}</ul>
        </details>
      </>}
      {registration && <ScoringLegend />}
    </section>
    {final && <section className="section"><div className="section-heading"><h2>La gran final</h2><span className="hint">Cuatro jugadores. Un campeón.</span></div><MatchCard match={final} /></section>}
  </>;
}
