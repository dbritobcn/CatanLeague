"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInIcon } from "@phosphor-icons/react";

/**
 * Login entry for anonymous visitors. Client-side so the post-login return
 * URL always tracks the route the visitor is actually on, even after
 * client-side navigation (a server-rendered value would go stale).
 */
export function SidebarLoginLink() {
  const pathname = usePathname();
  const next = pathname !== "/" && !pathname.startsWith("/login") ? `?next=${encodeURIComponent(pathname)}` : "";
  return (
    <div className="sidebar-auth">
      <Link href={`/login${next}`}>
        <SignInIcon size={22} weight="regular" aria-hidden="true" />
        <span className="nav-full">Iniciar sesión</span>
        <span className="nav-compact">Entrar</span>
      </Link>
    </div>
  );
}
