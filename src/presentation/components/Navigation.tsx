"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarBlankIcon, PlusIcon, TrophyIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { RESERVED_SLUGS } from "@/application/slug";

interface AdminLink {
  href: string;
  label: string;
  compact: string;
}

interface NavLink {
  href: string;
  label: string;
  compact: string;
  icon: typeof TrophyIcon;
}

function linksFor(pathname: string, adminLink?: AdminLink): NavLink[] {
  const firstSegment = pathname.split("/").filter(Boolean)[0] ?? "";
  const inLeague = firstSegment !== "" && !RESERVED_SLUGS.includes(firstSegment);
  if (inLeague) {
    const code = firstSegment;
    const links: NavLink[] = [
      { href: `/${code}/clasificacion`, label: "Clasificación", compact: "Clasificación", icon: TrophyIcon },
      { href: `/${code}/calendario`, label: "Calendario", compact: "Calendario", icon: CalendarBlankIcon },
    ];
    // Only rendered for the league owner; the server decides via canAdministerLeague.
    if (adminLink) {
      links.push({ ...adminLink, icon: UsersThreeIcon });
    }
    return links;
  }
  return [
    { href: "/", label: "Ligas", compact: "Ligas", icon: TrophyIcon },
    { href: "/crear", label: "Crear liga", compact: "Crear", icon: PlusIcon },
  ];
}

export function Navigation({
  adminLink,
  footer,
}: {
  adminLink?: AdminLink;
  footer?: React.ReactNode;
}) {
  const pathname = usePathname();
  return <aside className="sidebar">
    <Link href="/" className="brand" aria-label="Liga de Catán, inicio">
      <img src="/images/catan-emblem.ico" width="64" height="64" alt="" />
      <span>Liga de<br className="brand-break" /> Catán</span>
    </Link>
    <nav aria-label="Navegación principal">{linksFor(pathname, adminLink).map(({ href, label, compact, icon: Icon }) =>
      <Link key={href} href={href} aria-current={isCurrent(pathname, href) ? "page" : undefined}>
        <Icon size={26} weight="regular" aria-hidden="true" />
        <span className="nav-full">{label}</span><span className="nav-compact">{compact}</span>
      </Link>
    )}</nav>
    {footer}
  </aside>;
}

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
