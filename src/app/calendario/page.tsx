import Link from "next/link";
import { container } from "@/infrastructure/container";
import { MatchCard } from "@/presentation/components/MatchCard";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const { status, rounds, final, played, total } = await container.getSchedule.execute();

  if (status === "registration") {
    return (
      <>
        <div className="page-title">
          <h1>Calendario</h1>
        </div>
        <p className="empty">
          El calendario se generará al iniciar la liga desde <Link href="/admin">Admin</Link>.
        </p>
      </>
    );
  }

  return (
    <>
      <div className="page-title">
        <h1>Calendario</h1>
        <span className="status">
          {played}/{total} partidas jugadas
        </span>
      </div>
      <progress className="progress" value={played} max={total} />

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
