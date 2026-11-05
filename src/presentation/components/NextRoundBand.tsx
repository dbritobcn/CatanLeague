import Link from "next/link";
import { ArrowRightIcon, CalendarDotsIcon, UserIcon } from "@phosphor-icons/react/dist/ssr";
import type { CurrentRoundView } from "@/application/use-cases/GetSchedule";

/** Cosmética: posición de la mesa dentro de la jornada en curso. La identidad de la partida sigue siendo su "Partida N". */
const TABLE_LETTERS = "ABCDEFGHIJKLM";

export function NextRoundBand({ code, currentRound }: { code: string; currentRound: CurrentRoundView }) {
  const { round, matches } = currentRound;
  return (
    <section className="next-round" aria-label="Próxima jornada">
      <CalendarDotsIcon size={38} weight="duotone" aria-hidden="true" />
      <div className="next-round-body">
        <p className="eyebrow">
          Próxima jornada · {matches.length} {matches.length === 1 ? "partida" : "partidas"}
        </p>
        <ul className="next-round-tables">
          {matches.map((match, index) => (
            <li key={match.id}>
              <strong className="table-label">Mesa {TABLE_LETTERS[index] ?? index + 1}</strong>
              <ul className="next-round-players">
                {match.players.map((player) => (
                  <li key={player.id} className="player-chip">
                    <UserIcon size={15} aria-hidden="true" />
                    {player.name}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
      <Link className="next-round-action" href={`/${code}/calendario`}>
        Ver calendario<ArrowRightIcon size={16} aria-hidden="true" />
      </Link>
    </section>
  );
}
