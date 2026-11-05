import Link from "next/link";
import Image from "next/image";
import { MedalIcon, PlusIcon, TrophyIcon } from "@phosphor-icons/react/dist/ssr";
import { container } from "@/infrastructure/container";
import { STATUS_LABELS } from "@/presentation/statusLabels";

export const dynamic = "force-dynamic";

function leagueProgress(played: number, total: number, status: string) {
  if (status === "registration") return "Inscripción abierta";
  if (total === 0) return "Calendario en preparación";
  return `${played} de ${total} partidas`;
}

export default async function HomePage() {
  const leagues = await container.listLeagues.execute();

  return (
    <>
      <section className="league-hero" aria-labelledby="home-title">
        <p className="eyebrow">Todas las mesas, una misma isla</p>
        <h1 id="home-title">Ligas de Catán<span className="hero-title-end"> entre amigos</span></h1>
        <div className="home-actions">
          <Link href="/crear" className="button">
            <PlusIcon size={19} aria-hidden="true" /> Crear liga
          </Link>
        </div>
        <div className="landscape">
          <Image src="/images/league-landscape.png" alt="Un explorador contempla los campos, el río y las montañas de Catán" fill priority sizes="(max-width: 639px) 100vw, (max-width: 1099px) 85vw, 80vw" />
        </div>
      </section>

      <section className="section" aria-labelledby="leagues-title">
        <div className="section-heading">
          <h2 id="leagues-title">Ligas</h2>
          <span className="hint">{leagues.length > 0 ? "Pulsa una liga para ver su clasificación" : ""}</span>
        </div>

        {leagues.length === 0 ? (
          <div className="empty-state">
            <TrophyIcon size={40} weight="duotone" aria-hidden="true" />
            <h3>Aún no hay ligas en la isla.</h3>
            <p>Crea la primera: ponle nombre, reúne a tu grupo y nosotros nos encargamos del calendario, la clasificación y la final.</p>
            <Link href="/crear" className="button"><PlusIcon size={19} aria-hidden="true" /> Crear la primera liga</Link>
          </div>
        ) : (
          <div className="grid">
            {leagues.map((league) => (
              <Link key={league.code} href={`/${league.code}/clasificacion`} className="card league-card">
                <header>
                  <strong>{league.name}</strong>
                  <span className="status">{STATUS_LABELS[league.status]}</span>
                </header>
                <p className="empty">{leagueProgress(league.played, league.total, league.status)}</p>
                {league.champion ? (
                  <p className="league-leader champion">
                    <TrophyIcon size={17} weight="duotone" aria-hidden="true" /> Campeón: {league.champion}
                  </p>
                ) : league.leader ? (
                  <p className="league-leader">
                    <MedalIcon size={17} weight="duotone" aria-hidden="true" /> Líder: {league.leader}
                  </p>
                ) : null}
                <p className="hint">Compartir: <span className="share-code">/{league.code}</span></p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
