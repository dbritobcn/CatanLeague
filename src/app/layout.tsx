import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liga de Catán",
  description: "Clasificación, calendario y administración de la liga de Catán entre amigos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="site-header">
          <Link href="/clasificacion" className="brand">
            <span className="hex" aria-hidden>⬢</span> Liga de Catán
          </Link>
          <nav>
            <Link href="/clasificacion">Clasificación</Link>
            <Link href="/calendario">Calendario</Link>
            <Link href="/admin">Admin</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
