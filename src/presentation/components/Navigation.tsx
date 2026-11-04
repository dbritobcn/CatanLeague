"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarBlank, Plus, Trophy, UsersThree } from "@phosphor-icons/react";
import { RESERVED_SLUGS } from "@/application/slug";

interface NavLink {
  href: string;
  label: string;
  compact: string;
  icon: typeof Trophy;
}

function linksFor(pathname: string): NavLink[] {
  const firstSegment = pathname.split("/").filter(Boolean)[0] ?? "";
  const inLeague = firstSegment !== "" && !RESERVED_SLUGS.includes(firstSegment);
  if (inLeague) {
    const code = firstSegment;
    return [
      { href: `/${code}/clasificacion`, label: "Clasificación", compact: "Clasificación", icon: Trophy },
      { href: `/${code}/calendario`, label: "Calendario", compact: "Calendario", icon: CalendarBlank },
      { href: `/${code}/admin`, label: "Administración", compact: "Admin", icon: UsersThree },
    ];
  }
  return [
    { href: "/", label: "Ligas", compact: "Ligas", icon: Trophy },
    { href: "/crear", label: "Crear liga", compact: "Crear", icon: Plus },
  ];
}

export function Navigation() {
  const pathname = usePathname();
  return <aside className="sidebar">
    <Link href="/" className="brand" aria-label="Liga de Catán, inicio">
      <img src="/images/catan-emblem.ico" width="64" height="64" alt="" />
      <span>Liga de<br className="brand-break" /> Catán</span>
    </Link>
    <nav aria-label="Navegación principal">{linksFor(pathname).map(({ href, label, compact, icon: Icon }) =>
      <Link key={href} href={href} aria-current={isCurrent(pathname, href) ? "page" : undefined}>
        <Icon size={26} weight="regular" aria-hidden="true" />
        <span className="nav-full">{label}</span><span className="nav-compact">{compact}</span>
      </Link>
    )}</nav>
    <p className="sidebar-note">Una mesa.<br />Mil historias.</p>
  </aside>;
}

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
