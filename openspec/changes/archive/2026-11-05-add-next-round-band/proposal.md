# Add next-round band on the standings page

## Why

La página de clasificación es pura tabla: el visitante que abre `/[code]/clasificacion` no ve qué toca jugar ahora, solo un contador "N de M partidas". Como las jornadas se juegan con varias mesas a la vez, saber "¿quién se sienta a qué mesa esta jornada?" es la información más accionable de la liga — y hoy solo vivía en el calendario.

## What Changes

- La página de clasificación (`/[code]/clasificacion`) muestra una **banda destacada "Próxima jornada"** entre el hero y la tabla de clasificación, con:
  - el número de la jornada en curso ("Próxima jornada · Jornada 3 · 2 partidas");
  - **solo las mesas pendientes** de esa jornada, etiquetadas "Mesa A / Mesa B…" (ordenadas por número de partida) con los nombres de sus 4 jugadores.
- El read-model de calendario (`ScheduleView` de `GetSchedule`) expone un nuevo campo **`currentRound`**: la primera ronda con al menos una partida pendiente (solo las partidas pendientes de esa ronda, ordenadas por número) o `null` cuando no hay jornada en curso.
- La banda es **informativa** (variante B2): el CTA "Registrar resultado" se conserva donde está hoy, en el heading de la tabla; la banda enlaza al calendario (`/[code]/calendario`) para ver el resto.
- La banda **no se muestra** en `registration` (no hay calendario), en `final` (la sección "La gran final" ya cubre ese momento) ni en `finished`.

## Capabilities

### New Capabilities

- `next-round-band`: la vista de clasificación exhibe la jornada en curso — primera ronda con partidas pendientes — con únicamente las mesas por jugar, sus etiquetas derivadas (A, B, …) y sus participantes.

### Modified Capabilities

(ninguna: el cambio es aditivo sobre la vista de clasificación; `currentRound` se añade al read-model existente sin alterar su comportamiento actual)

## Impact

- `src/application/use-cases/GetSchedule.ts` + `ScheduleView`: nuevo campo derivado `currentRound` (aditivo; la página de calendario no lo consume todavía).
- `src/app/[code]/clasificacion/page.tsx`: nueva sección `.next-round` (anatomía análoga a `.champion`), solo visible en `group_stage` con `currentRound` no nulo.
- CSS (hoja de estilos global): estilos de la banda para escritorio/tablet/móvil (chips por jugador con wrap).
- Tests de `GetSchedule` (o la capa de tests correspondiente) por el cálculo de `currentRound`.
- Sin cambios de esquema, sin nuevas dependencias, sin rutas nuevas, sin acciones mutantes.
