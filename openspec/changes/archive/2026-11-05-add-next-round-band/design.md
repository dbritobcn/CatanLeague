# Design: banda "Próxima jornada" en la página de clasificación

## Context

La página `src/app/[code]/clasificacion/page.tsx` ya ejecuta `getSchedule.execute(code)` (para el contador "X de Y partidas"), o sea que los datos de calendario están disponibles sin consultas extra. Hoy la página exhibe: hero, sección de campeón (solo `finished`), tabla de clasificación con heading + CTA, y una sección "La gran final" (solo `final`). Cuando la liga está en `group_stage`, el visitante no ve en ninguna parte quiénes se sientan a mesa esta jornada; esa información vive únicamente en `/[code]/calendario`.

El dominio (`League.recordResult`) no impone orden de registro de resultados, por lo que "la próxima" no es un hecho almacenado: es una derivación del estado (qué partidas no tienen ranking).

Acotaciones de estilo del repo: read-models en `src/application/views.ts`, casos de uso finos en `src/application/use-cases/`, componentes de presentación puros que no tocan el dominio, y una hoja de estilos global única (`src/app/globals.css`) con patrones de sección listos (`.champion`, `.section`, `.card`…).

## Goals / Non-Goals

**Goals:**
- Que en `group_stage` el visitante vea, al abrir la clasificación, la jornada en curso con sus mesas pendientes (nombres de jugadores) y un atajo al calendario.
- Que la derivación de "jornada en curso" viva en la capa de aplicación (testeable, reutilizable por el calendario en el futuro) y no en la página.
- Cero consultas nuevas, cero cambios de esquema, cero cambios de comportamiento en las demás vistas.

**Non-Goals:**
- No mover ni rediseñar el CTA "Registrar resultado" del heading (decisióse la variante B2: banda informativa).
- No transformar la página de calendario (resaltar jornada en curso, ocultar jugadas…).
- No añadir estado de "jornada actual" al dominio: es puro cálculo sobre datos ya leídos.

## Decisions

### 1. `currentRound` como campo del `ScheduleView` de `GetSchedule`

```ts
export interface CurrentRoundView {
  round: number;
  matches: MatchView[]; // solo pendientes, ordenadas por number
}
// en ScheduleView:
currentRound: CurrentRoundView | null;
```

- Derivado en `GetSchedule.execute`, tras construir los `rounds`:
  - si `league.league.status !== "group_stage"` → `null` (los estados `registration`/`final`/`finished` no tienen jornada en curso; el paso a `final` es automático al jugarse la última partida del grupo, así que no existe estado "todo jugado y aún `group_stage`").
  - si no, primera entrada de `rounds` (que ya está en orden de ronda) con alguna `match.result === null` → `{ round, matches: solo las pendientes }`.
- Alternativa descartada: derivarlo en la página desde `rounds`. La semántica de "jornada en curso" es de negocio (no de maquetación); colocarla en el caso de uso la hace testeable y reutilizable por `calendario` en el futuro. El coste es mínimo: unos 6 líneas sobre datos ya construidos.

### 2. Etiquetado "Mesa A/B/…" derivado en presentación

Los `Match` tienen `number` global (`g1…gN`); la letra de mesa es cosmética: posición dentro de la lista de mesas pendientes de la jornada en curso (A, B, C, …) en orden de `number`. Se calcula en el componente (o en un helper de presentación pequeño) a partir del `index`. No se persiste ni se expone en el read-model — la identidad canónica de la partida sigue siendo su `number`.

Alternativa descartada: "Partida 6 / Partida 7". Es fiel al calendario, pero el usuario decidió por el lenguaje de mesas (se juegan varias a la vez, es una "noche de juego").

### 3. Anatomía de la sección: espejo de `.champion`

Nueva sección `.next-round` entre `LeagueHero` (y sección de campeón, si existiera) y la sección "Clasificación", solo renderizada `status === "group_stage" && currentRound`:

```
⚔  PRÓXIMA JORNADA · Jornada 3 · 2 partidas
Mesa A · David, Theresa, Xavi e Ingrid
Mesa B · Pedro, Ana, Luis y Marta
                       [Ver calendario →]
```

- Mismo esqueleto que `.champion` (icono + bloque de texto + elemento a la derecha), pero en una paleta coherente (el champagne dorado de `.champion` es de campeón; para la jornada en curso toca decidir un acento, p. ej. un verde más vivo sobre fondo ivory o el verde forest directamente, según convenga con la identidad existente).
- Cabecera: `eyebrow` "Próxima jornada" + "Jornada N" + contador de partidas pendientes de esa jornada.
- Cuerpo: una lista de mesa por línea (o "tabla" de dos columnas en escritorio si hay ≥ 2 mesas): etiqueta `Mesa A` en semibold + los 4 nombres como chips (`<li class="player-chip">`) que hacen wrap; esto resuelve el móvil con nombres largos (40 chars) sin overflow.
- Acción: solo un `<Link>` a `/${code}/calendario` ("Ver calendario →"), derecho-alineado como `champion-note`. Sin botones de registro (B2).
- El heading de la tabla y su CTA "Registrar resultado" quedan intactos en todos los estados.

Alternativa descartada (B1): absorber el CTA de registrar resultado dentro de la banda. Se descartó por simplicidad: la banda no toca la jerarquía de acciones ni cambia el comportamiento en `registration`/`finished`.

### 4. Accesibilidad y SSR

- Sección con `aria-label="Próxima jornada"`; los nombres como lista (`<ul>` de mesas, cada mesa con etiqueta + `ol`/`ul` de jugadores) para lectores de pantalla.
- Icono decorativo (`weight="duotone"`, `aria-hidden`), patrón ya usado en la página.
- Nada dinámico cliente: la banda se renderiza en el mismo server component, consistent for free con `dynamic = "force-dynamic"`.

### 5. Tests

No existe hoy test unitario de `GetSchedule` (los tests del repo viven en `tests/` cubriendo dominio, generador, contrato de repositorio, platform y slug). Añadimos `tests/GetSchedule.test.ts` que cubre `currentRound` a través de `League` + un `LeagueRepository` in-memory (patrón del contrato existente):

- `group_stage` con ronda incompleta → primera ronda con pendientes, solo pendientes, orden por `number`.
- resultado fuera de orden (jornada 4 jugada, jornada 3 colgante) → `round: 3`.
- `registration` / `final` / `finished` → `null`.
- jornada completa → siguiente ronda.

## Risks / Trade-offs

- [Riesgo] "Próxima jornada" puede chocar con la realidad si alguien juega mesas fuera de orden durante mucho tiempo (la bandera sigue señalando la jornada incompleta aunque el grupo haya dejado de jugarla). → Es el comportamiento aceptado por diseño (señal de "lo que falta para avanzar"); si molesta en uso real, el siguiente paso natural es dejar de mostrar la banda cuando la jornada lleva mucho sin actividad (fuera de scope).
- [Riesgo] La letra de mesa (A/B) es una etiqueta derivada, no una identidad: si algún día se muestran las mesas en otro orden (p. ej. orden de registro) las letras podrían no coincidir entre páginas. → Las letras solo existen en esta banda y siempre derivadas del mismo orden por `number`; en el resto de la app la identidad es "Partida N". Documentado aquí para no olvidar.
- [Tradeoff] `currentRound` vive de momento sin consumidor en el calendario; es API temprana. → Es aditivo y barato; justificado por el test en capa de aplicación. Se puede eliminar sin coste si nunca se usa, pero se espera que `calendario` lo aproveche para resaltar la jornada en curso.
- [Tradeoff] Con ligas de 24 jugadores la jornada en curso puede tener muchas mesas (varias mesas × 4 nombres). → La banda escala con wrap; si algún día se vuelve ruidosa, el tope natural es mostrar las primeras 2-3 mesas + "y N más". No bloqueante hoy (típico: 5-12 jugadores).

## Migration Plan

Despliegue trivial y aditivo: no hay migración de datos ni de esquema. Si algo falla, se revierte el commit sin efecto residual. Rolloback de la página = la banda desaparece y el resto de la vista es idéntico al día de hoy.

## Open Questions

- Tono cromático exacto de la banda (accent forest sobre ivory vs. un tono distinto) — decidir al maquetar contra la identidad existente; no bloquea implementación.
