import type { Metadata } from "next";
import { headers } from "next/headers";
import { Navigation } from "@/presentation/components/Navigation";
import { canAdministerLeague } from "@/presentation/auth/canAdmin";
import { RESERVED_SLUGS } from "@/application/slug";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liga de Catán",
  description: "Clasificación, calendario y administración de la liga de Catán entre amigos.",
};

/** League admin link for the sidebar, resolved server-side for the current visitor.
 * Undefined outside a league, for non-owners, or when the proxy header is absent. */
async function leagueAdminLink(): Promise<{ href: string; label: string; compact: string } | undefined> {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const code = pathname.split("/").filter(Boolean)[0] ?? "";
  if (code === "" || RESERVED_SLUGS.includes(code)) return undefined;
  if (!(await canAdministerLeague(code))) return undefined;
  return { href: `/${code}/admin`, label: "Administración", compact: "Admin" };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <a className="skip-link" href="#contenido">Saltar al contenido</a>
        <header className="mobile-header">
          <img src="/images/catan-emblem.ico" width="40" height="40" alt="" />
          <span>Liga de Catán</span>
        </header>
        <Navigation adminLink={await leagueAdminLink()} />
        <main id="contenido" tabIndex={-1}>{children}</main>
      </body>
    </html>
  );
}
