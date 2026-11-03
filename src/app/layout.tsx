import type { Metadata } from "next";
import { Navigation } from "@/presentation/components/Navigation";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liga de Catán",
  description: "Clasificación, calendario y administración de la liga de Catán entre amigos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <a className="skip-link" href="#contenido">Saltar al contenido</a>
        <header className="mobile-header">
          <img src="/images/catan-emblem.ico" width="40" height="40" alt="" />
          <span>Liga de Catán</span>
        </header>
        <Navigation />
        <main id="contenido" tabIndex={-1}>{children}</main>
      </body>
    </html>
  );
}
