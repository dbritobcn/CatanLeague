import type { LeagueStatus } from "@/application/views";

export const STATUS_LABELS: Record<LeagueStatus, string> = {
  registration: "Inscripción abierta",
  group_stage: "Fase de liguilla",
  final: "Final pendiente",
  finished: "Liga finalizada",
};
