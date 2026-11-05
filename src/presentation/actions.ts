"use server";

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { DomainError } from "@/domain";
import { container } from "@/infrastructure/container";
import { getSession, getSupabaseServerClient } from "./auth/server";

export interface ActionState {
  error?: string;
  success?: string;
}

/**
 * The real security frontier: every mutating action verifies the session and
 * the league ownership before touching a use case, no matter which page the
 * POST comes from. Page-level gates are defense in depth only.
 */
async function requireLeagueOwner(code: string): Promise<void> {
  const user = await getSession();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/${code}/admin`)}`);
  const info = await container.getLeagueInfo.execute(code).catch(() => notFound());
  if (info.ownerId !== user.id) notFound();
}

/** Fetches the league code from the form and enforces ownership. */
async function ownedLeagueFrom(form: FormData): Promise<string> {
  const code = String(form.get("leagueCode") ?? "");
  await requireLeagueOwner(code);
  return code;
}

async function run(operation: () => Promise<void>, success: string): Promise<ActionState> {
  try {
    await operation();
  } catch (error) {
    if (error instanceof DomainError) return { error: error.message };
    throw error;
  }
  revalidatePath("/", "layout");
  return { success };
}

// ── League management ──────────────────────────────────────────────────────

export async function createLeagueAction(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await getSession();
  if (!user) redirect("/login?next=%2Fcrear");
  const title = String(form.get("title") ?? "");
  let code: string;
  try {
    ({ code } = await container.createLeague.execute({ title, ownerId: user.id }));
  } catch (error) {
    if (error instanceof DomainError) return { error: error.message };
    throw error;
  }
  revalidatePath("/", "layout");
  redirect(`/${code}/admin`);
}

export async function deleteLeagueAction(_: ActionState, form: FormData): Promise<ActionState> {
  const code = await ownedLeagueFrom(form);
  const result = await run(() => container.deleteLeague.execute(code), "Liga eliminada.");
  if (result.error) return result;
  redirect("/");
}

// ── League mutations (owner only) ───────────────────────────────────────────

export async function addPlayerAction(_: ActionState, form: FormData): Promise<ActionState> {
  const code = await ownedLeagueFrom(form);
  const name = String(form.get("name") ?? "");
  return run(() => container.addPlayer.execute(code, name), `${name.trim()} se ha unido a la liga.`);
}

export async function removePlayerAction(_: ActionState, form: FormData): Promise<ActionState> {
  const code = await ownedLeagueFrom(form);
  return run(
    () => container.removePlayer.execute(code, String(form.get("playerId"))),
    "Participante eliminado.",
  );
}

export async function startLeagueAction(_: ActionState, form: FormData): Promise<ActionState> {
  const code = await ownedLeagueFrom(form);
  return run(() => container.startLeague.execute(code), "¡Liga iniciada! El calendario está listo.");
}

export async function restartLeagueAction(_: ActionState, form: FormData): Promise<ActionState> {
  const code = await ownedLeagueFrom(form);
  return run(
    () => container.restartLeague.execute(code),
    "Liga reiniciada. Los participantes se mantienen.",
  );
}

export async function recordResultAction(_: ActionState, form: FormData): Promise<ActionState> {
  const code = await ownedLeagueFrom(form);
  const matchId = String(form.get("matchId"));
  const ranking = [1, 2, 3, 4].map((position) => String(form.get(`position${position}`) ?? ""));
  return run(() => container.recordMatchResult.execute(code, matchId, ranking), "Resultado guardado.");
}

// ── Authentication (email + password) ──────────────────────────────────────

/** Only same-origin absolute paths are allowed as post-login destinations. */
function sanitizeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

function translateAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return "Email o contraseña incorrectos.";
  if (/already (been )?registered/i.test(message)) return "Ya existe una cuenta con ese email.";
  if (/password should be at least/i.test(message)) return "La contraseña debe tener al menos 6 caracteres.";
  if (/email not confirmed/i.test(message)) return "Confirma tu email antes de entrar (revisa tu bandeja).";
  return "No se pudo completar la operación. Inténtalo de nuevo.";
}

export async function loginAction(_: ActionState, form: FormData): Promise<ActionState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const next = sanitizeNext(String(form.get("next") ?? "/"));
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: translateAuthError(error.message) };
  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUpAction(_: ActionState, form: FormData): Promise<ActionState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const next = sanitizeNext(String(form.get("next") ?? "/"));
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: translateAuthError(error.message) };
  // With "Confirm email" disabled, signUp already returns a session. If email
  // confirmation is on, try to sign in anyway before asking the user to confirm.
  if (!data.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      return { success: "Cuenta creada. Revisa tu email para confirmarla y vuelve a entrar." };
    }
  }
  revalidatePath("/", "layout");
  redirect(next);
}

export async function logoutAction(): Promise<void> {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
