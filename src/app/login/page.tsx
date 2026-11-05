import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/presentation/components/LoginForm";
import { getSession } from "@/presentation/auth/server";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Already signed in: go straight to the destination.
  const user = await getSession();
  if (user) {
    const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    redirect(destination);
  }

  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">El otro lado del tablero</p>
        <div className="page-title">
          <h1>Acceder</h1>
        </div>
        <p className="page-description">
          Necesitas una cuenta para crear y gestionar ligas. Ver la clasificación y el calendario
          es libre.
        </p>
      </div>

      <section className="section card login-card">
        <LoginForm next={next ?? "/"} />
        <p className="empty">
          ¿Solo quieres mirar? <Link href="/">Explora las ligas públicas</Link>.
        </p>
      </section>
    </>
  );
}
