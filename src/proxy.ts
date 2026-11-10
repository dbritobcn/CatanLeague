import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase session cookies on every request so that server
 * components and server actions always read a valid session.
 * (Next.js 16 renamed the middleware convention to proxy.)
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !publishableKey) return response;

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        response.headers.set("x-pathname", request.nextUrl.pathname);
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() validates the token with the Supabase auth server and refreshes
  // it through setAll above when needed.
  await supabase.auth.getUser();

  // Exposes the pathname to server components (the root layout reads it to know
  // when it renders inside a league and resolve the admin link visibility).
  response.headers.set("x-pathname", request.nextUrl.pathname);

  return response;
}

export const config = {
  // Skip static assets; everything else goes through the refresh.
  matcher: ["/((?!_next/static|_next/image|images|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
