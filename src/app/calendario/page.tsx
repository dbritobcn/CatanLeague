import Link from "next/link";
import { container } from "@/infrastructure/container";
import { MatchCard } from "@/presentation/components/MatchCard";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const { status, rounds, final, played, total } = await container.getSchedule.execute();

  if (status === "registration") {
    return (
      <>
        <div className="page-intro"><p className="eyebrow">El camino hacia la final</p><div className="page-title">
          <h1>Calendario</h1>
        </div><p className="page-description">Cada mesa, cada jornada y cada resultado, en un solo lugar.</p></div>
        <div className="empty-state"><h2>El tablero está por estrenar.</h2><p>Cuando inicies la liga, aquí aparecerán las jornadas y todas las partidas de tu grupo.</p>
        <Link href="/admin" className="button">Preparar la liga</Link></div>
      </>
    );
  }

  return (
    <>
      <div className="page-intro"><p className="eyebrow">El camino hacia la final</p><div className="page-title">
        <h1>Calendario</h1>
        <span className="status">
          {played}/{total} partidas jugadas
        </span>
      </div><p className="page-description">Todas las jornadas. Todos los encuentros. Una misma meta.</p></div>
      <progress className="progress" value={played} max={total || 1} aria-label={`${played} de ${total} partidas jugadas`} />

      {rounds.map(({ round, matches }) => (
        <section key={round} className="section">
          <h2>Jornada {round}</h2>
          <div className="grid">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      ))}

      <section className="section">
        <h2>Final</h2>
        {final ? (
          <MatchCard match={final} />
        ) : (
          <p className="empty">Se disputará entre los 4 primeros clasificados al terminar la liguilla.</p>
        )}
      </section>
    </>
  );
}
