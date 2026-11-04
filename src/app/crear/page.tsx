import { redirect } from "next/navigation";
import { createLeagueAction } from "@/presentation/actions";
import { ActionForm } from "@/presentation/components/ActionForm";
import { SlugPreview } from "@/presentation/components/SlugPreview";
import { getSession } from "@/presentation/auth/server";

export const dynamic = "force-dynamic";

export default async function CreateLeaguePage() {
  const user = await getSession();
  if (!user) redirect("/login?next=%2Fcrear");

  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">Un tablero nuevo</p>
        <div className="page-title">
          <h1>Crear liga</h1>
        </div>
        <p className="page-description">
          El nombre se convierte en la dirección pública de la liga: «Liga Cholos» vivirá en
          <span className="share-code">/liga-cholos</span>. Elige algo fácil de compartir.
        </p>
      </div>

      <section className="section card">
        <ActionForm action={createLeagueAction} className="create-league">
          <SlugPreview />
          <p className="hint">
            Podrás invitar a participar a quien quieras compartiendo la dirección. Mínimo 5
            participantes para iniciar la liga.
          </p>
          <button type="submit">Crear liga</button>
        </ActionForm>
      </section>
    </>
  );
}
