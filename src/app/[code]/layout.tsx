import { Navigation } from "@/presentation/components/Navigation";
import { SidebarAuth } from "@/presentation/components/SidebarAuth";
import { canAdministerLeague } from "@/presentation/auth/canAdmin";

/**
 * Chrome for league routes (/<code>/…): resolves the admin link per league
 * segment. Because this layout belongs to the [code] segment, client-side
 * navigation into or between leagues re-renders it — the role decision is
 * never stale (a root layout would only run once and be reused by partial
 * rendering), and the code arrives via params instead of header plumbing.
 */
export default async function LeagueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const adminLink = (await canAdministerLeague(code))
    ? { href: `/${code}/admin`, label: "Administración", compact: "Admin" }
    : undefined;
  return (
    <>
      <Navigation adminLink={adminLink} footer={<SidebarAuth />} />
      <main id="contenido" tabIndex={-1}>{children}</main>
    </>
  );
}
