import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";

function env(): { url: string; publishableKey: string } {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "Supabase no está configurado. Define SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY en tu entorno.",
    );
  }
  return { url, publishableKey };
}

/**
 * Supabase client bound to the request cookies (httpOnly session).
 * Use in server components and server actions.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  const { url, publishableKey } = env();
  const cookieStore = await cookies();
  return createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies; the middleware refreshes the session.
        }
      },
    },
  });
}

/** Current signed-in user, or null. Also null when Supabase is not configured
 * (e.g. local file persistence): pages render, auth actions fail loudly. */
export async function getSession(): Promise<User | null> {
  let supabase: SupabaseClient;
  try {
    supabase = await getSupabaseServerClient();
  } catch {
    return null;
  }
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}
