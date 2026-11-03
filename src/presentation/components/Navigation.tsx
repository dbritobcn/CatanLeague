"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarBlank, Trophy, UsersThree } from "@phosphor-icons/react";

const links = [
  { href: "/clasificacion", label: "Clasificación", compact: "Clasificación", icon: Trophy },
  { href: "/calendario", label: "Calendario", compact: "Calendario", icon: CalendarBlank },
  { href: "/admin", label: "Administración", compact: "Admin", icon: UsersThree },
];

export function Navigation() {
  const pathname = usePathname();
  return <aside className="sidebar">
    <Link href="/clasificacion" className="brand" aria-label="Liga de Catán, inicio">
      <img src="/images/catan-emblem.ico" width="64" height="64" alt="" />
      <span>Liga de<br className="brand-break" /> Catán</span>
    </Link>
    <nav aria-label="Navegación principal">{links.map(({ href, label, compact, icon: Icon }) =>
      <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
        <Icon size={26} weight="regular" aria-hidden="true" />
        <span className="nav-full">{label}</span><span className="nav-compact">{compact}</span>
      </Link>
    )}</nav>
    <p className="sidebar-note">Una mesa.<br />Mil historias.</p>
  </aside>;
}
