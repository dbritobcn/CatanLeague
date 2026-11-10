import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liga de Catán",
  description: "Clasificación, calendario y administración de la liga de Catán entre amigos.",
};

/** Global shell only; the sidebar chrome lives in (global)/layout.tsx and
 * [code]/layout.tsx so each route family resolves its own navigation. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <a className="skip-link" href="#contenido">Saltar al contenido</a>
        <header className="mobile-header">
          <img src="/images/catan-emblem.ico" width="40" height="40" alt="" />
          <span>Liga de Catán</span>
        </header>
        {children}
      </body>
    </html>
  );
}
