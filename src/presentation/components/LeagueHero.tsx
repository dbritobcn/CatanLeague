import Image from "next/image";

export function LeagueHero() {
  return <section className="league-hero" aria-labelledby="league-title">
    <p className="eyebrow">Tu liga, partida a partida</p>
    <h1 id="league-title">La carrera hacia<span className="hero-title-end"> la final</span></h1>
    <div className="landscape">
      <Image src="/images/league-landscape.png" alt="Un explorador contempla los campos, el río y las montañas de Catán" fill priority sizes="(max-width: 639px) 100vw, (max-width: 1099px) 85vw, 80vw" />
    </div>
  </section>;
}
