import { notFound, redirect } from "next/navigation";
import { container } from "@/infrastructure/container";
import { getSession } from "./server";

/**
 * Server-side guards shared by pages. Server actions have their own frontier
 * in actions.ts (requireLeagueOwner); these give fast, UX-level protection.
 */

/** Resolves the league or renders 404. Returns metadata for the page header. */
export async function requireExistingLeague(code: string): Promise<{ name: string }> {
  const info = await container.getLeagueInfo.execute(code).catch(() => notFound());
  return { name: info.name };
}

/** Redirects anonymous visitors to login and hides foreign leagues as 404. */
export async function requireLeagueAdmin(code: string): Promise<{ name: string }> {
  const user = await getSession();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/${code}/admin`)}`);
  const info = await container.getLeagueInfo.execute(code).catch(() => notFound());
  if (info.ownerId !== user.id) notFound();
  return { name: info.name };
}
