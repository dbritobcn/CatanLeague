"use server";

import { revalidatePath } from "next/cache";
import { DomainError } from "@/domain";
import { container } from "@/infrastructure/container";

export interface ActionState {
  error?: string;
  success?: string;
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

export async function addPlayerAction(_: ActionState, form: FormData): Promise<ActionState> {
  const name = String(form.get("name") ?? "");
  return run(() => container.addPlayer.execute(name), `${name.trim()} se ha unido a la liga.`);
}

export async function removePlayerAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(() => container.removePlayer.execute(String(form.get("playerId"))), "Participante eliminado.");
}

export async function startLeagueAction(): Promise<ActionState> {
  return run(() => container.startLeague.execute(), "¡Liga iniciada! El calendario está listo.");
}

export async function restartLeagueAction(): Promise<ActionState> {
  return run(() => container.restartLeague.execute(), "Liga reiniciada. Los participantes se mantienen.");
}

export async function recordResultAction(_: ActionState, form: FormData): Promise<ActionState> {
  const matchId = String(form.get("matchId"));
  const ranking = [1, 2, 3, 4].map((position) => String(form.get(`position${position}`) ?? ""));
  return run(() => container.recordMatchResult.execute(matchId, ranking), "Resultado guardado.");
}
