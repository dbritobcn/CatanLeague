import Link from "next/link";
import { headers } from "next/headers";
import { SignInIcon, SignOutIcon } from "@phosphor-icons/react/dist/ssr";
import { logoutAction } from "@/presentation/actions";
import { getSession } from "@/presentation/auth/server";

/**
 * Sidebar footer auth slot (replaces the tagline): anonymous visitors get a
 * login link that returns to the current page; signed-in users get logout.
 * Server-rendered so the session never leaks to the client bundle.
 */
export async function SidebarAuth() {
  const user = await getSession();
  if (user) {
    return (
      <form action={logoutAction} className="sidebar-auth">
        <button type="submit">
          <SignOutIcon size={22} weight="regular" aria-hidden="true" />
          <span className="nav-full">Cerrar sesión</span>
          <span className="nav-compact">Salir</span>
        </button>
      </form>
    );
  }

  const pathname = (await headers()).get("x-pathname") ?? "/";
  const next = pathname !== "/" && !pathname.startsWith("/login") ? `?next=${encodeURIComponent(pathname)}` : "";
  return (
    <Link className="sidebar-auth" href={`/login${next}`}>
      <SignInIcon size={22} weight="regular" aria-hidden="true" />
      <span className="nav-full">Iniciar sesión</span>
      <span className="nav-compact">Entrar</span>
    </Link>
  );
}
