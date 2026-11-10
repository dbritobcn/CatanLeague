import { container } from "@/infrastructure/container";
import { getSession } from "./server";

/**
 * Whether the current visitor may administer the league. This is the single seam
 * between the league owner check and the UI: link visibility flows from here, while
 * page guards (`requireLeagueAdmin`) and server actions (`requireLeagueOwner`) remain
 * the authoritative frontier. When co-administration arrives, only this function
 * changes; no UI component is aware of the rule.
 *
 * Returns false for anonymous visitors, unknown leagues or Supabase errors — the
 * safe default is never showing the administration link.
 */
export async function canAdministerLeague(code: string): Promise<boolean> {
  const user = await getSession();
  if (!user) return false;
  const info = await container.getLeagueInfo.execute(code).catch(() => null);
  if (!info) return false;
  return info.ownerId === user.id;
}
