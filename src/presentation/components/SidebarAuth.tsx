import { SignOutIcon } from "@phosphor-icons/react/dist/ssr";
import { logoutAction } from "@/presentation/actions";
import { getSession } from "@/presentation/auth/server";
import { SidebarLoginLink } from "./SidebarLoginLink";

/**
 * Sidebar footer auth slot: anonymous visitors get the login link (see
 * SidebarLoginLink), signed-in users get logout. Server-rendered so the
 * session never leaks to the client bundle.
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
  return <SidebarLoginLink />;
}
